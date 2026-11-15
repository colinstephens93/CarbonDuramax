"""
Headless Blender build script for Milestone 8 part-variant GLBs.

Usage:
  blender --background --python assets-src/blender/build_variants.py -- --out public/models/variants

Normative rules (docs/specs/M8-part-variants.md §§3.1-3.3):
- Reads shared stock dimensions from assets-src/dimensions.json and variant/interface
  dimensions from assets-src/variant_dimensions.json (no hard-coded interface or pinned numbers).
- Imports geometry/material/export helpers from frozen build_cylinder1.py.
- Builds V1-V4 in the scene-placed class (project frame in Blender metres, export_yup=True,
  named if_* empty interface markers) and V5 in the part-local class (wrist-pin pivot at origin).
- Logs machine-checkable assertions: triangle/material caps, project/bore-fit envelopes,
  marker translations, vertex-level non-penetration against analytic solid envelopes on the
  frozen exterior shell GLB, V5 crown dish volume delta, and exported GLB binary read-back.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import struct
import sys
from pathlib import Path
from typing import Callable

import bmesh
import bpy
import numpy as np
from mathutils import Vector

THIS_DIR = Path(__file__).resolve().parent
if str(THIS_DIR) not in sys.path:
    sys.path.insert(0, str(THIS_DIR))
sys.dont_write_bytecode = True

from build_cylinder1 import (  # noqa: E402
    MM_TO_M,
    add_box,
    add_extruded_polygon_x,
    add_revolved_profile,
    add_tube_along_axis,
    export_glb,
    finalize_bmesh_object,
    make_pbr_material,
    reset_scene,
)

REPO_ROOT = THIS_DIR.parent.parent

VARIANT_CAPS: dict[str, int] = {
    "turbo_unit_engine_large": 3600,
    "intake_tract_engine_highflow": 2600,
    "exhaust_system_engine_4inch": 2800,
    "intercooler_core_engine_upgraded": 1800,
    "rot_piston_c1_lowcomp": 5200,
}

MATERIAL_CAP = 4
SPEC_NOMINAL_MARKER_RADIUS_MM = 30.0
APPROVED_MARKER_COLLAR_RADIUS_MM = 90.0  # D-039 approved per-marker connection-collar deviation
MIN_OBSTACLE_CLEARANCE_MM = 2.0


def parse_args() -> argparse.Namespace:
    argv = sys.argv
    script_args = argv[argv.index("--") + 1 :] if "--" in argv else []
    parser = argparse.ArgumentParser(description="Build Milestone 8 part-variant GLBs.")
    parser.add_argument(
        "--out",
        required=True,
        help="Output directory for the 5 variant GLBs (e.g. public/models/variants).",
    )
    parser.add_argument(
        "--dimensions",
        default=None,
        help="Optional path to dimensions.json (defaults to assets-src/dimensions.json).",
    )
    parser.add_argument(
        "--variant-dimensions",
        default=None,
        help="Optional path to variant_dimensions.json (defaults to assets-src/variant_dimensions.json).",
    )
    parser.add_argument(
        "--shell",
        default=None,
        help="Optional path to Duramax_LLY_2005_66L_V8.glb.",
    )
    return parser.parse_args(script_args)


# ---------------------------------------------------------------------------
# Vector / curve / BMesh utilities (authored in mm, written to BMesh in m)
# ---------------------------------------------------------------------------
def unit_np(v: np.ndarray | list[float] | tuple[float, ...]) -> np.ndarray:
    arr = np.asarray(v, dtype=np.float64)
    n = float(np.linalg.norm(arr))
    if n < 1e-12:
        raise ValueError("Zero-length direction vector.")
    return arr / n


def basis_from_dir(d: np.ndarray, up_hint: np.ndarray | None = None) -> tuple[np.ndarray, np.ndarray]:
    t = unit_np(d)
    if up_hint is None:
        ref = np.array([0.0, 0.0, 1.0]) if abs(t[2]) < 0.9 else np.array([0.0, 1.0, 0.0])
    else:
        ref = np.asarray(up_hint, dtype=np.float64)
    u = ref - t * float(np.dot(ref, t))
    if float(np.linalg.norm(u)) < 1e-6:
        ref = np.array([1.0, 0.0, 0.0])
        u = ref - t * float(np.dot(ref, t))
    u = unit_np(u)
    v = np.cross(t, u)
    return u, v


def catmull_rom(points: np.ndarray | list[np.ndarray], samples: int) -> np.ndarray:
    pts = np.asarray(points, dtype=np.float64)
    if len(pts) == 2:
        t = np.linspace(0.0, 1.0, samples)[:, None]
        return (1.0 - t) * pts[0] + t * pts[1]
    padded = np.vstack([pts[0], pts, pts[-1]])
    seg_count = len(pts) - 1
    out: list[np.ndarray] = []
    for s in range(samples):
        u = (s / (samples - 1)) * seg_count
        idx = min(int(u), seg_count - 1)
        t = u - idx
        p0, p1, p2, p3 = padded[idx], padded[idx + 1], padded[idx + 2], padded[idx + 3]
        pt = 0.5 * (
            2.0 * p1
            + (-p0 + p2) * t
            + (2.0 * p0 - 5.0 * p1 + 4.0 * p2 - p3) * (t * t)
            + (-p0 + 3.0 * p1 - 3.0 * p2 + p3) * (t * t * t)
        )
        out.append(pt)
    return np.asarray(out, dtype=np.float64)


def polyline_arclength(pts: np.ndarray) -> np.ndarray:
    diffs = np.linalg.norm(np.diff(pts, axis=0), axis=1)
    return np.concatenate([[0.0], np.cumsum(diffs)])


def sample_polyline_slice(pts: np.ndarray, s0: float, s1: float, count: int) -> np.ndarray:
    cum = polyline_arclength(pts)
    total = float(cum[-1])
    s_vals = np.linspace(max(0.0, s0), min(total, s1), count)
    out: list[np.ndarray] = []
    for s in s_vals:
        idx = int(np.searchsorted(cum, s, side="right") - 1)
        idx = max(0, min(idx, len(pts) - 2))
        denom = max(float(cum[idx + 1] - cum[idx]), 1e-9)
        t = (float(s) - float(cum[idx])) / denom
        out.append(pts[idx] * (1.0 - t) + pts[idx + 1] * t)
    return np.asarray(out, dtype=np.float64)


def v_m(pt_mm: np.ndarray | tuple[float, float, float] | list[float]) -> Vector:
    return Vector((float(pt_mm[0]) * MM_TO_M, float(pt_mm[1]) * MM_TO_M, float(pt_mm[2]) * MM_TO_M))


def bm_add_ring_mm(
    bm: bmesh.types.BMesh,
    center_mm: np.ndarray,
    u: np.ndarray,
    v: np.ndarray,
    radius_mm: float,
    segments: int,
) -> list[bmesh.types.BMVert]:
    verts: list[bmesh.types.BMVert] = []
    for i in range(segments):
        ang = (2.0 * math.pi * i) / segments
        pt_mm = center_mm + radius_mm * (math.cos(ang) * u + math.sin(ang) * v)
        verts.append(bm.verts.new(v_m(pt_mm)))
    return verts


def bm_add_band(
    bm: bmesh.types.BMesh,
    ring0: list[bmesh.types.BMVert],
    ring1: list[bmesh.types.BMVert],
    mat_index: int,
) -> None:
    n = len(ring0)
    for i in range(n):
        j = (i + 1) % n
        f = bm.faces.new((ring0[i], ring0[j], ring1[j], ring1[i]))
        f.material_index = mat_index


def bm_add_fan(
    bm: bmesh.types.BMesh,
    ring: list[bmesh.types.BMVert],
    center_mm: np.ndarray,
    mat_index: int,
    flip: bool = False,
) -> None:
    c_vert = bm.verts.new(v_m(center_mm))
    n = len(ring)
    for i in range(n):
        j = (i + 1) % n
        verts = (c_vert, ring[j], ring[i]) if flip else (c_vert, ring[i], ring[j])
        f = bm.faces.new(verts)
        f.material_index = mat_index


def bm_add_tube_segment_mm(
    bm: bmesh.types.BMesh,
    p0_mm: np.ndarray,
    p1_mm: np.ndarray,
    r0_mm: float,
    r1_mm: float,
    segments: int,
    mat_index: int,
    cap0: bool = False,
    cap1: bool = False,
    cap0_center_mm: np.ndarray | None = None,
    cap1_center_mm: np.ndarray | None = None,
    axis_normal_override: np.ndarray | None = None,
) -> None:
    p0 = np.asarray(p0_mm, dtype=np.float64)
    p1 = np.asarray(p1_mm, dtype=np.float64)
    d = unit_np(p1 - p0) if axis_normal_override is None else unit_np(axis_normal_override)
    u, v = basis_from_dir(d)
    ring0 = bm_add_ring_mm(bm, p0, u, v, r0_mm, segments)
    ring1 = bm_add_ring_mm(bm, p1, u, v, r1_mm, segments)
    bm_add_band(bm, ring0, ring1, mat_index)
    if cap0:
        bm_add_fan(bm, ring0, p0 if cap0_center_mm is None else cap0_center_mm, mat_index, flip=True)
    if cap1:
        bm_add_fan(bm, ring1, p1 if cap1_center_mm is None else cap1_center_mm, mat_index, flip=False)


def bm_add_swept_tube_mm(
    bm: bmesh.types.BMesh,
    pts_mm: np.ndarray,
    radii_mm: float | np.ndarray,
    segments: int,
    mat_index: int,
    cap_start: bool = False,
    cap_end: bool = False,
    cap_start_center_mm: np.ndarray | None = None,
    cap_end_center_mm: np.ndarray | None = None,
    start_tangent_override: np.ndarray | None = None,
    end_tangent_override: np.ndarray | None = None,
) -> None:
    pts = np.asarray(pts_mm, dtype=np.float64)
    r_arr = np.broadcast_to(np.asarray(radii_mm, dtype=np.float64), (len(pts),))
    tangents: list[np.ndarray] = []
    for i in range(len(pts)):
        if i == 0 and start_tangent_override is not None:
            tangents.append(unit_np(start_tangent_override))
        elif i == len(pts) - 1 and end_tangent_override is not None:
            tangents.append(unit_np(end_tangent_override))
        elif i == 0:
            tangents.append(unit_np(pts[1] - pts[0]))
        elif i == len(pts) - 1:
            tangents.append(unit_np(pts[-1] - pts[-2]))
        else:
            tangents.append(unit_np(pts[i + 1] - pts[i - 1]))

    u, _ = basis_from_dir(tangents[0])
    rings: list[list[bmesh.types.BMVert]] = []
    for i, p in enumerate(pts):
        t = tangents[i]
        u = u - t * float(np.dot(u, t))
        if float(np.linalg.norm(u)) < 1e-6:
            u, _ = basis_from_dir(t)
        u = unit_np(u)
        v = np.cross(t, u)
        rings.append(bm_add_ring_mm(bm, p, u, v, float(r_arr[i]), segments))

    for i in range(len(rings) - 1):
        bm_add_band(bm, rings[i], rings[i + 1], mat_index)
    if cap_start:
        bm_add_fan(bm, rings[0], pts[0] if cap_start_center_mm is None else cap_start_center_mm, mat_index, flip=True)
    if cap_end:
        bm_add_fan(bm, rings[-1], pts[-1] if cap_end_center_mm is None else cap_end_center_mm, mat_index, flip=False)


def bm_add_swept_annular_sleeve_mm(
    bm: bmesh.types.BMesh,
    pts_mm: np.ndarray,
    r_inner_mm: float,
    r_outer_mm: float,
    segments: int,
    mat_index: int,
) -> None:
    pts = np.asarray(pts_mm, dtype=np.float64)
    tangents: list[np.ndarray] = []
    for i in range(len(pts)):
        if i == 0:
            tangents.append(unit_np(pts[1] - pts[0]))
        elif i == len(pts) - 1:
            tangents.append(unit_np(pts[-1] - pts[-2]))
        else:
            tangents.append(unit_np(pts[i + 1] - pts[i - 1]))
    u, _ = basis_from_dir(tangents[0])
    outer_rings: list[list[bmesh.types.BMVert]] = []
    inner_rings: list[list[bmesh.types.BMVert]] = []
    for i, p in enumerate(pts):
        t = tangents[i]
        u = u - t * float(np.dot(u, t))
        if float(np.linalg.norm(u)) < 1e-6:
            u, _ = basis_from_dir(t)
        u = unit_np(u)
        v = np.cross(t, u)
        outer_rings.append(bm_add_ring_mm(bm, p, u, v, r_outer_mm, segments))
        if i == 0 or i == len(pts) - 1:
            inner_rings.append(bm_add_ring_mm(bm, p, u, v, r_inner_mm, segments))
    for i in range(len(outer_rings) - 1):
        bm_add_band(bm, outer_rings[i], outer_rings[i + 1], mat_index)
    # Start annulus (normal -t), end annulus (normal +t), inner bore band (normal -r)
    bm_add_band(bm, outer_rings[0], inner_rings[0], mat_index)
    bm_add_band(bm, inner_rings[1], outer_rings[-1], mat_index)
    bm_add_band(bm, inner_rings[1], inner_rings[0], mat_index)


def create_marker_empties(markers_mm: list[tuple[str, np.ndarray]]) -> list[bpy.types.Object]:
    empties: list[bpy.types.Object] = []
    for name, pos_mm in markers_mm:
        empty = bpy.data.objects.new(name, None)
        empty.empty_display_type = "PLAIN_AXES"
        empty.empty_display_size = 0.01
        empty.location = v_m(pos_mm)
        bpy.context.collection.objects.link(empty)
        empties.append(empty)
    return empties


# ---------------------------------------------------------------------------
# Analytic SDF envelopes for §3.3 non-penetration assertions (project mm)
# ---------------------------------------------------------------------------
SdfFn = Callable[[np.ndarray], np.ndarray]


def sdf_union(fns: list[SdfFn]) -> SdfFn:
    def _eval(pts: np.ndarray) -> np.ndarray:
        vals = [fn(pts) for fn in fns]
        out = vals[0]
        for v in vals[1:]:
            out = np.minimum(out, v)
        return out

    return _eval


def sdf_box(pmin: tuple[float, float, float], pmax: tuple[float, float, float]) -> SdfFn:
    mn = np.asarray(pmin, dtype=np.float64)
    mx = np.asarray(pmax, dtype=np.float64)
    c = 0.5 * (mn + mx)
    h = 0.5 * (mx - mn)

    def _eval(pts: np.ndarray) -> np.ndarray:
        q = np.abs(pts - c) - h
        outside = np.linalg.norm(np.maximum(q, 0.0), axis=1)
        inside = np.minimum(np.max(q, axis=1), 0.0)
        return outside + inside

    return _eval


def sdf_frustum_segment(p0: np.ndarray, p1: np.ndarray, r0: float, r1: float) -> SdfFn:
    a = np.asarray(p0, dtype=np.float64)
    b = np.asarray(p1, dtype=np.float64)
    ab = b - a
    length = float(np.linalg.norm(ab))
    axis = ab / max(length, 1e-9)

    def _eval(pts: np.ndarray) -> np.ndarray:
        ap = pts - a
        s = ap @ axis
        radial_vec = ap - s[:, None] * axis[None, :]
        rho = np.linalg.norm(radial_vec, axis=1)
        t = np.clip(s / max(length, 1e-9), 0.0, 1.0)
        r_at_t = r0 + (r1 - r0) * t
        d_rad = rho - r_at_t
        d_ax = np.maximum(-s, s - length)
        outside = np.sqrt(np.maximum(d_rad, 0.0) ** 2 + np.maximum(d_ax, 0.0) ** 2)
        inside = np.minimum(np.maximum(d_rad, d_ax), 0.0)
        return outside + inside

    return _eval


def sdf_swept_tube(pts_poly: np.ndarray, radii: float | np.ndarray) -> SdfFn:
    pts = np.asarray(pts_poly, dtype=np.float64)
    r_arr = np.broadcast_to(np.asarray(radii, dtype=np.float64), (len(pts),))
    segs = [sdf_frustum_segment(pts[i], pts[i + 1], float(r_arr[i]), float(r_arr[i + 1])) for i in range(len(pts) - 1)]
    return sdf_union(segs)


def sdf_revolved_x_polygon(center_yz: tuple[float, float], profile_rx: list[tuple[float, float]]) -> SdfFn:
    cy, cz = center_yz
    poly = np.asarray([(x, r) for (r, x) in profile_rx], dtype=np.float64)
    n = len(poly)

    def _eval(pts: np.ndarray) -> np.ndarray:
        x = pts[:, 0]
        rho = np.sqrt((pts[:, 1] - cy) ** 2 + (pts[:, 2] - cz) ** 2)
        q = np.stack([x, rho], axis=1)
        min_d2 = np.full(len(pts), np.inf, dtype=np.float64)
        inside = np.zeros(len(pts), dtype=bool)
        for i in range(n):
            a = poly[i]
            b = poly[(i + 1) % n]
            e = b - a
            w = q - a
            ee = max(float(np.dot(e, e)), 1e-12)
            t = np.clip((w @ e) / ee, 0.0, 1.0)
            diff = w - t[:, None] * e[None, :]
            d2 = np.sum(diff * diff, axis=1)
            min_d2 = np.minimum(min_d2, d2)
            cond1 = a[1] <= q[:, 1]
            cond2 = b[1] <= q[:, 1]
            cross = e[0] * w[:, 1] - e[1] * w[:, 0]
            flip = ((cond1 & ~cond2 & (cross > 0.0)) | (~cond1 & cond2 & (cross < 0.0)))
            inside ^= flip
        dist = np.sqrt(np.maximum(min_d2, 0.0))
        return np.where(inside, -dist, dist)

    return _eval


# ---------------------------------------------------------------------------
# Model builders (V1-V5)
# ---------------------------------------------------------------------------
class BuiltVariantSpec:
    def __init__(
        self,
        name: str,
        filepath: Path,
        markers_mm: list[tuple[str, np.ndarray]],
        envelope_bounds_mm: tuple[tuple[float, float], tuple[float, float], tuple[float, float]] | None,
        sdf_envelope: SdfFn | None,
        replaced_shell_subtrees: set[str],
        marker_connected_groups: dict[str, set[str]],
        obstacle_excluded_groups: set[str],
        meta: dict[str, float] | None = None,
    ) -> None:
        self.name = name
        self.filepath = filepath
        self.markers_mm = markers_mm
        self.envelope_bounds_mm = envelope_bounds_mm
        self.sdf_envelope = sdf_envelope
        self.replaced_shell_subtrees = replaced_shell_subtrees
        self.marker_connected_groups = marker_connected_groups
        self.obstacle_excluded_groups = obstacle_excluded_groups
        self.meta = meta or {}


def build_v1_turbo(vd: dict[str, float], out_dir: Path) -> BuiltVariantSpec:
    reset_scene()
    name = "turbo_unit_engine_large"

    mat_iron = make_pbr_material("mat_turbo_cast_iron", (0.23, 0.22, 0.21, 1.0), 0.85, 0.72)
    mat_alu = make_pbr_material("mat_turbo_alu_compressor", (0.72, 0.73, 0.75, 1.0), 0.90, 0.30)
    mat_steel = make_pbr_material("mat_turbo_steel_chra_actuator", (0.46, 0.47, 0.50, 1.0), 0.92, 0.38)
    M_IRON, M_ALU, M_STEEL = 0, 1, 2

    bm = bmesh.new()
    ry = vd["turboRotorAxisYMm"]
    rz = vd["turboRotorAxisZMm"]
    axis_c_m = Vector((0.0, ry * MM_TO_M, rz * MM_TO_M))

    if_rh = np.array([vd["ifTurbineInletRhXMm"], vd["ifTurbineInletRhYMm"], vd["ifTurbineInletRhZMm"]])
    if_lh = np.array([vd["ifTurbineInletLhXMm"], vd["ifTurbineInletLhYMm"], vd["ifTurbineInletLhZMm"]])
    if_tout = np.array([vd["ifTurbineOutletXMm"], vd["ifTurbineOutletYMm"], vd["ifTurbineOutletZMm"]])
    if_cin = np.array([vd["ifTurboCompressorInletXMm"], vd["ifTurboCompressorInletYMm"], vd["ifTurboCompressorInletZMm"]])
    if_cout = np.array([vd["ifTurboCompressorOutletXMm"], vd["ifTurboCompressorOutletYMm"], vd["ifTurboCompressorOutletZMm"]])

    n_tout = unit_np([vd["turbineOutletNormalX"], vd["turbineOutletNormalY"], vd["turbineOutletNormalZ"]])
    n_cin = unit_np([vd["compressorInletNormalX"], vd["compressorInletNormalY"], vd["compressorInletNormalZ"]])
    n_cout = unit_np([vd["compressorOutletNormalX"], vd["compressorOutletNormalY"], vd["compressorOutletNormalZ"]])

    # 1. Turbine housing (closed revolved shell X -152..-88, outer radius 117, rear neck r 54)
    tx0 = vd["turboTurbineHousingXMinMm"]
    tx1 = vd["turboTurbineHousingXMaxMm"]
    tr_max = vd["turboTurbineHousingOuterRadiusMm"]
    tr_neck = vd["turboTurbineHousingRearNeckRadiusMm"]
    turbine_profile_mm = [
        (44.0, tx0),
        (51.0, -147.0),
        (tr_neck, if_rh[0]),
        (80.0, -128.0),
        (104.0, -120.0),
        (116.0, -112.0),
        (tr_max, -104.0),
        (106.0, -96.0),
        (84.0, tx1),
        (70.0, tx1),
        (64.0, -100.0),
        (62.0, -120.0),
        (58.0, -136.0),
        (50.0, -145.0),
        (38.0, tx0),
    ]
    add_revolved_profile(
        bm,
        [(r * MM_TO_M, x * MM_TO_M) for (r, x) in turbine_profile_mm],
        segments=32,
        axis="X",
        center=axis_c_m,
        mat_index=M_IRON,
        close_loop=True,
    )

    # 2. CHRA center housing (X -92..-58, r 42..46) + Ø12 oil feed & Ø24 oil drain stubs
    cx0, cx1 = vd["turboChraXMinMm"], vd["turboChraXMaxMm"]
    cr_in, cr_out = vd["turboChraInnerRadiusMm"], vd["turboChraOuterRadiusMm"]
    add_tube_along_axis(
        bm,
        cr_in * MM_TO_M,
        cr_out * MM_TO_M,
        cx0 * MM_TO_M,
        cx1 * MM_TO_M,
        segments=24,
        axis="X",
        center=axis_c_m,
        mat_index=M_STEEL,
    )
    chra_mid_x = 0.5 * (cx0 + cx1)
    r_feed = 0.5 * vd["turboOilFeedDiameterMm"]
    r_drain = 0.5 * vd["turboOilDrainDiameterMm"]
    feed_p0 = np.array([chra_mid_x, ry, rz + cr_out - 2.0])
    feed_p1 = np.array([chra_mid_x, ry, rz + cr_out + 18.0])
    bm_add_tube_segment_mm(bm, feed_p0, feed_p1, r_feed, r_feed, 12, M_STEEL, cap0=False, cap1=True)
    drain_p0 = np.array([chra_mid_x, ry, rz - cr_out + 2.0])
    drain_p1 = np.array([chra_mid_x, ry, rz - cr_out - 20.0])
    bm_add_tube_segment_mm(bm, drain_p0, drain_p1, r_drain, r_drain, 14, M_STEEL, cap0=False, cap1=True)

    # 3. Compressor housing (closed revolved shell X -60..+16, outer radius 131)
    cpx0, cpx1 = vd["turboCompressorHousingXMinMm"], vd["turboCompressorHousingXMaxMm"]
    cpr_max = vd["turboCompressorHousingOuterRadiusMm"]
    compressor_profile_mm = [
        (52.0, cpx0),
        (74.0, -54.0),
        (100.0, -46.0),
        (124.0, -36.0),
        (cpr_max, -26.0),
        (128.0, -16.0),
        (112.0, -6.0),
        (84.0, 2.0),
        (56.0, 10.0),
        (46.0, cpx1),
        (38.0, cpx1),
        (44.0, 6.0),
        (58.0, -8.0),
        (64.0, -30.0),
        (56.0, -48.0),
        (44.0, cpx0),
    ]
    add_revolved_profile(
        bm,
        [(r * MM_TO_M, x * MM_TO_M) for (r, x) in compressor_profile_mm],
        segments=32,
        axis="X",
        center=axis_c_m,
        mat_index=M_ALU,
        close_loop=True,
    )

    # 4. Up-pipe nozzles (r 40) + r 44 flanges angled onto stock contacts
    r_noz = vd["turboUpPipeNozzleRadiusMm"]
    r_up_fl = vd["turboUpPipeFlangeRadiusMm"]
    fl_t = vd["turboFlangeThicknessMm"]
    rh_start = np.array([-110.0, -32.7, 371.4])
    lh_start = np.array([-108.0, 10.0, 402.0])
    for start_pt, face_pt in ((rh_start, if_rh), (lh_start, if_lh)):
        d_up = unit_np(face_pt - start_pt)
        noz_end = face_pt - d_up * fl_t
        bm_add_tube_segment_mm(bm, start_pt, noz_end, r_noz, r_noz, 20, M_IRON, cap0=False, cap1=False)
        bm_add_tube_segment_mm(
            bm, noz_end, face_pt, r_up_fl, r_up_fl, 20, M_IRON, cap0=True, cap1=True, cap1_center_mm=face_pt
        )

    # 5. Turbine outlet nozzle (r 45 neck + r 52 flange, face normal n_tout)
    r_tout_neck = vd["turboTurbineOutletNeckRadiusMm"]
    r_tout_fl = vd["turboTurbineOutletFlangeRadiusMm"]
    tout_start = if_tout - n_tout * 58.0
    tout_end = if_tout - n_tout * fl_t
    bm_add_tube_segment_mm(bm, tout_start, tout_end, r_tout_neck, r_tout_neck, 20, M_IRON, cap0=False, cap1=False)
    bm_add_tube_segment_mm(
        bm, tout_end, if_tout, r_tout_fl, r_tout_fl, 20, M_IRON, cap0=True, cap1=True, cap1_center_mm=if_tout
    )

    # 6. Compressor inlet bell (r 44 bell tube + r 48 flange, face normal n_cin)
    r_bell = vd["turboCompressorInletBellRadiusMm"]
    r_cin_fl = vd["turboCompressorInletFlangeRadiusMm"]
    bell_start = if_cin - n_cin * 58.0
    bell_end = if_cin - n_cin * fl_t
    bm_add_tube_segment_mm(bm, bell_start, bell_end, 38.0, r_bell, 24, M_ALU, cap0=True, cap1=False)
    bm_add_tube_segment_mm(
        bm, bell_end, if_cin, r_cin_fl, r_cin_fl, 24, M_ALU, cap0=True, cap1=True, cap1_center_mm=if_cin
    )

    # 7. Compressor outlet elbow (r 38 elbow + r 44 flange, face normal n_cout)
    r_cout_el = vd["turboCompressorOutletElbowRadiusMm"]
    r_cout_fl = vd["turboCompressorOutletFlangeRadiusMm"]
    cout_fl_back = if_cout - n_cout * 10.0
    elbow_ctrl = np.array(
        [
            [0.0, 40.0, 405.0],
            [13.0, 49.0, 412.5],
            cout_fl_back,
        ]
    )
    elbow_pts = catmull_rom(elbow_ctrl, 6)
    bm_add_swept_tube_mm(
        bm,
        elbow_pts,
        r_cout_el,
        20,
        M_ALU,
        cap_start=True,
        cap_end=False,
        end_tangent_override=n_cout,
    )
    bm_add_tube_segment_mm(
        bm,
        cout_fl_back,
        if_cout,
        r_cout_fl,
        r_cout_fl,
        20,
        M_ALU,
        cap0=True,
        cap1=True,
        cap1_center_mm=if_cout,
        axis_normal_override=n_cout,
    )

    # 8. VGT actuator (Ø60 x 80 at (-120, 50, 500) + bracket + Ø8 rod)
    act_c = np.array([vd["turboActuatorCenterXMm"], vd["turboActuatorCenterYMm"], vd["turboActuatorCenterZMm"]])
    act_r = 0.5 * vd["turboActuatorDiameterMm"]
    act_half_l = 0.5 * vd["turboActuatorLengthMm"]
    act_rod_r = 0.5 * vd["turboActuatorRodDiameterMm"]
    act_p0 = act_c + np.array([-act_half_l, 0.0, 0.0])
    act_p1 = act_c + np.array([act_half_l, 0.0, 0.0])
    bm_add_tube_segment_mm(bm, act_p0, act_p1, act_r, act_r, 20, M_STEEL, cap0=True, cap1=True)
    bracket_min = (-140.0, 68.0, 468.0)
    bracket_max = (-100.0, 108.0, 506.0)
    add_box(
        bm,
        tuple(c * MM_TO_M for c in bracket_min),
        tuple(c * MM_TO_M for c in bracket_max),
        mat_index=M_STEEL,
    )
    rod_p0 = act_c + np.array([0.0, 0.0, -act_r])
    rod_p1 = np.array([-112.0, 30.0, 440.0])
    bm_add_tube_segment_mm(bm, rod_p0, rod_p1, act_rod_r, act_rod_r, 10, M_STEEL, cap0=False, cap1=True)

    obj = finalize_bmesh_object(name, bm, [mat_iron, mat_alu, mat_steel])
    markers = [
        ("if_turbine_inlet_rh", if_rh),
        ("if_turbine_inlet_lh", if_lh),
        ("if_turbine_outlet", if_tout),
        ("if_compressor_inlet", if_cin),
        ("if_compressor_outlet", if_cout),
    ]
    empties = create_marker_empties(markers)
    filepath = out_dir / f"{name}.glb"
    export_glb(filepath, [obj, *empties])

    sdf = sdf_union(
        [
            sdf_revolved_x_polygon((ry, rz), turbine_profile_mm),
            sdf_revolved_x_polygon((ry, rz), compressor_profile_mm),
            sdf_frustum_segment(np.array([cx0, ry, rz]), np.array([cx1, ry, rz]), cr_out, cr_out),
            sdf_frustum_segment(feed_p0, feed_p1, r_feed, r_feed),
            sdf_frustum_segment(drain_p0, drain_p1, r_drain, r_drain),
            sdf_frustum_segment(rh_start, if_rh - unit_np(if_rh - rh_start) * fl_t, r_noz, r_noz),
            sdf_frustum_segment(if_rh - unit_np(if_rh - rh_start) * fl_t, if_rh, r_up_fl, r_up_fl),
            sdf_frustum_segment(lh_start, if_lh - unit_np(if_lh - lh_start) * fl_t, r_noz, r_noz),
            sdf_frustum_segment(if_lh - unit_np(if_lh - lh_start) * fl_t, if_lh, r_up_fl, r_up_fl),
            sdf_frustum_segment(tout_start, tout_end, r_tout_neck, r_tout_neck),
            sdf_frustum_segment(tout_end, if_tout, r_tout_fl, r_tout_fl),
            sdf_frustum_segment(bell_start, bell_end, 38.0, r_bell),
            sdf_frustum_segment(bell_end, if_cin, r_cin_fl, r_cin_fl),
            sdf_swept_tube(elbow_pts, r_cout_el),
            sdf_frustum_segment(cout_fl_back, if_cout, r_cout_fl, r_cout_fl),
            sdf_frustum_segment(act_p0, act_p1, act_r, act_r),
            sdf_box(bracket_min, bracket_max),
            sdf_frustum_segment(rod_p0, rod_p1, act_rod_r, act_rod_r),
        ]
    )

    bounds = (
        (vd["turboEnvXMinMm"], vd["turboEnvXMaxMm"]),
        (vd["turboEnvYMinMm"], vd["turboEnvYMaxMm"]),
        (vd["turboEnvZMinMm"], vd["turboEnvZMaxMm"]),
    )
    return BuiltVariantSpec(
        name=name,
        filepath=filepath,
        markers_mm=markers,
        envelope_bounds_mm=bounds,
        sdf_envelope=sdf,
        replaced_shell_subtrees={"turbo_unit"},
        marker_connected_groups={
            "if_turbine_inlet_rh": {"turbo"},
            "if_turbine_inlet_lh": {"turbo"},
            "if_turbine_outlet": {"turbo"},
            "if_compressor_inlet": {"intake"},
            "if_compressor_outlet": set(),
        },
        obstacle_excluded_groups={"turbo", "intake"},
    )


def build_v2_intake(vd: dict[str, float], out_dir: Path) -> BuiltVariantSpec:
    reset_scene()
    name = "intake_tract_engine_highflow"

    mat_alu = make_pbr_material("mat_intake_alu_polished", (0.82, 0.83, 0.85, 1.0), 0.95, 0.22)
    mat_sil = make_pbr_material("mat_intake_silicone_black", (0.045, 0.045, 0.05, 1.0), 0.0, 0.62)
    mat_media = make_pbr_material("mat_intake_filter_gauze", (0.14, 0.13, 0.12, 1.0), 0.05, 0.88)
    mat_cap = make_pbr_material("mat_intake_filter_cap_steel", (0.58, 0.60, 0.63, 1.0), 0.92, 0.28)
    M_ALU, M_SIL, M_MEDIA, M_CAP = 0, 1, 2, 3

    bm = bmesh.new()
    if_cin = np.array([vd["ifTurboCompressorInletXMm"], vd["ifTurboCompressorInletYMm"], vd["ifTurboCompressorInletZMm"]])
    if_air = np.array([vd["ifIntakeAirboxMountXMm"], vd["ifIntakeAirboxMountYMm"], vd["ifIntakeAirboxMountZMm"]])
    n_cin = unit_np([vd["compressorInletNormalX"], vd["compressorInletNormalY"], vd["compressorInletNormalZ"]])
    f_axis = unit_np([vd["intakeFilterAxisX"], vd["intakeFilterAxisY"], vd["intakeFilterAxisZ"]])

    ctrl = np.array(
        [[vd[f"intakePathP{i}XMm"], vd[f"intakePathP{i}YMm"], vd[f"intakePathP{i}ZMm"]] for i in range(9)],
        dtype=np.float64,
    )
    r_tube = vd["intakeTubeOuterRadiusMm"]
    start_offset = vd["intakeTubeStartOffsetMm"]

    path = catmull_rom(ctrl, 32)
    path[0] = if_cin + n_cin * start_offset

    bm_add_swept_tube_mm(
        bm,
        path,
        r_tube,
        20,
        M_ALU,
        cap_start=True,
        cap_end=True,
        cap_start_center_mm=if_cin,
        cap_end_center_mm=if_air,
        start_tangent_override=n_cin,
        end_tangent_override=f_axis,
    )

    # Two Ø116 (r 58) x 60 mm silicone sleeves + two Ø120 (r 60) x 12 mm clamp rings
    r_coupler = 0.5 * vd["intakeCouplerOuterDiameterMm"]
    coupler_len = vd["intakeCouplerLengthMm"]
    r_clamp = 0.5 * vd["intakeClampOuterDiameterMm"]
    clamp_w = vd["intakeClampWidthMm"]
    total_len = float(polyline_arclength(path)[-1])

    coupler1_pts = sample_polyline_slice(path, 8.0, 8.0 + coupler_len, 4)
    coupler2_pts = sample_polyline_slice(path, total_len - 2.0 - coupler_len, total_len - 2.0, 4)
    bm_add_swept_annular_sleeve_mm(bm, coupler1_pts, r_tube - 0.5, r_coupler, 20, M_SIL)
    bm_add_swept_annular_sleeve_mm(bm, coupler2_pts, r_tube - 0.5, r_coupler, 20, M_SIL)

    clamp1_pts = sample_polyline_slice(path, 16.0, 16.0 + clamp_w, 2)
    clamp2_pts = sample_polyline_slice(path, total_len - 10.0 - clamp_w, total_len - 10.0, 2)
    bm_add_swept_annular_sleeve_mm(bm, clamp1_pts, r_coupler - 1.0, r_clamp, 20, M_SIL)
    bm_add_swept_annular_sleeve_mm(bm, clamp2_pts, r_coupler - 1.0, r_clamp, 20, M_SIL)

    # Open-element conical filter: base Ø160 -> tip Ø100, length 190 mm, 32 radial segs (16 pleats)
    f_len = vd["intakeFilterLengthMm"]
    f_base_r = 0.5 * vd["intakeFilterBaseDiameterMm"]
    f_tip_r = 0.5 * vd["intakeFilterTipDiameterMm"]
    radial = 32
    u, v = basis_from_dir(f_axis)

    def fpoint(dist_mm: float, rad_mm: float, ang: float) -> np.ndarray:
        return if_air + f_axis * dist_mm + rad_mm * (math.cos(ang) * u + math.sin(ang) * v)

    media_end = f_len - 10.0
    pleat_rings: list[list[bmesh.types.BMVert]] = []
    for frac in (0.0, 0.22, 0.45, 0.68, 0.88, 1.0):
        dist = media_end * frac
        r_nom = f_base_r + (f_tip_r - f_base_r) * (dist / f_len)
        ring: list[bmesh.types.BMVert] = []
        for i in range(radial):
            ang = (2.0 * math.pi * i) / radial
            rr = r_nom + (3.0 if i % 2 == 0 else 0.0)
            ring.append(bm.verts.new(v_m(fpoint(dist, rr, ang))))
        pleat_rings.append(ring)

    for i in range(len(pleat_rings) - 1):
        bm_add_band(bm, pleat_rings[i], pleat_rings[i + 1], M_MEDIA)

    base_inner = [bm.verts.new(v_m(fpoint(0.0, r_tube + 1.0, (2.0 * math.pi * i) / radial))) for i in range(radial)]
    bm_add_band(bm, pleat_rings[0], base_inner, M_MEDIA)

    # Steel end cap (last 10 mm of the 190 mm filter length)
    r_cap_start = f_base_r + (f_tip_r - f_base_r) * (media_end / f_len)
    cap_ring0 = [bm.verts.new(v_m(fpoint(media_end, r_cap_start + 1.5, (2.0 * math.pi * i) / radial))) for i in range(radial)]
    cap_ring1 = [bm.verts.new(v_m(fpoint(f_len, f_tip_r, (2.0 * math.pi * i) / radial))) for i in range(radial)]
    bm_add_band(bm, cap_ring0, cap_ring1, M_CAP)
    bm_add_fan(bm, cap_ring1, if_air + f_axis * f_len, M_CAP, flip=False)

    obj = finalize_bmesh_object(name, bm, [mat_alu, mat_sil, mat_media, mat_cap])
    markers = [
        ("if_compressor_inlet", if_cin),
        ("if_airbox_mount", if_air),
    ]
    empties = create_marker_empties(markers)
    filepath = out_dir / f"{name}.glb"
    export_glb(filepath, [obj, *empties])

    sdf = sdf_union(
        [
            sdf_swept_tube(path, r_tube),
            sdf_swept_tube(coupler1_pts, r_coupler),
            sdf_swept_tube(coupler2_pts, r_coupler),
            sdf_swept_tube(clamp1_pts, r_clamp),
            sdf_swept_tube(clamp2_pts, r_clamp),
            sdf_frustum_segment(if_air, if_air + f_axis * f_len, f_base_r + 3.0, f_tip_r),
        ]
    )

    bounds = (
        (vd["intakeEnvXMinMm"], vd["intakeEnvXMaxMm"]),
        (vd["intakeEnvYMinMm"], vd["intakeEnvYMaxMm"]),
        (vd["intakeEnvZMinMm"], vd["intakeEnvZMaxMm"]),
    )
    return BuiltVariantSpec(
        name=name,
        filepath=filepath,
        markers_mm=markers,
        envelope_bounds_mm=bounds,
        sdf_envelope=sdf,
        replaced_shell_subtrees={"intake_tract"},
        marker_connected_groups={
            "if_compressor_inlet": {"turbo", "intake"},
            "if_airbox_mount": {"intake"},
        },
        obstacle_excluded_groups={"intake", "turbo"},
    )


def build_v3_exhaust(vd: dict[str, float], out_dir: Path) -> BuiltVariantSpec:
    reset_scene()
    name = "exhaust_system_engine_4inch"

    mat_ss = make_pbr_material("mat_exhaust_stainless_409", (0.62, 0.63, 0.65, 1.0), 0.90, 0.32)
    mat_tint = make_pbr_material("mat_exhaust_heat_tinted", (0.29, 0.24, 0.19, 1.0), 0.88, 0.48)
    M_SS, M_TINT = 0, 1

    bm = bmesh.new()
    if_tout = np.array([vd["ifTurbineOutletXMm"], vd["ifTurbineOutletYMm"], vd["ifTurbineOutletZMm"]])
    n_tout = unit_np([vd["turbineOutletNormalX"], vd["turbineOutletNormalY"], vd["turbineOutletNormalZ"]])

    ctrl = np.array(
        [[vd[f"exhaustPathP{i}XMm"], vd[f"exhaustPathP{i}YMm"], vd[f"exhaustPathP{i}ZMm"]] for i in range(9)],
        dtype=np.float64,
    )
    path = catmull_rom(ctrl, 30)
    cum = polyline_arclength(path)
    r_stub = vd["exhaustStubOuterRadiusMm"]
    r_pipe = vd["exhaustPipeOuterRadiusMm"]
    ramp = np.clip((cum - 12.0) / (110.0 - 12.0), 0.0, 1.0)
    smooth = ramp * ramp * (3.0 - 2.0 * ramp)
    radii = r_stub + (r_pipe - r_stub) * smooth

    bm_add_swept_tube_mm(
        bm,
        path,
        radii,
        20,
        M_SS,
        cap_start=True,
        cap_end=True,
        cap_start_center_mm=if_tout,
        start_tangent_override=n_tout,
    )

    # Inlet flange r 52, face normal n_tout, sitting on if_turbine_outlet
    r_fl = vd["exhaustInletFlangeRadiusMm"]
    fl_end = if_tout + n_tout * 14.0
    bm_add_tube_segment_mm(
        bm,
        if_tout,
        fl_end,
        r_fl,
        r_fl,
        24,
        M_TINT,
        cap0=True,
        cap1=True,
        cap0_center_mm=if_tout,
        axis_normal_override=n_tout,
    )

    # Muffler: Ø220 x 380 mm, 32-segment revolved profile along X at (-570..-950, -108, 25)
    muff_r = 0.5 * vd["exhaustMufflerOuterDiameterMm"]
    mx0 = vd["exhaustMufflerXStartMm"]
    mx1 = vd["exhaustMufflerXEndMm"]
    my = vd["exhaustMufflerAxisYMm"]
    mz = vd["exhaustMufflerAxisZMm"]
    muff_profile_mm = [
        (0.0, mx0),
        (60.0, mx0),
        (88.0, mx0 - 4.0),
        (103.0, mx0 - 12.0),
        (muff_r, mx0 - 22.0),
        (muff_r, mx0 - 30.0),
        (muff_r, mx1 + 30.0),
        (106.0, mx1 + 20.0),
        (95.0, mx1 + 10.0),
        (78.0, mx1 + 4.0),
        (55.0, mx1),
        (0.0, mx1),
    ]
    add_revolved_profile(
        bm,
        [(r * MM_TO_M, x * MM_TO_M) for (r, x) in muff_profile_mm],
        segments=32,
        axis="X",
        center=Vector((0.0, my * MM_TO_M, mz * MM_TO_M)),
        mat_index=M_SS,
        close_loop=False,
    )

    # Tail pipe: Ø101.6 tube X -950 -> -1035, downturn to Z -25, flared rolled tip r 50.8 -> 56
    tail_end_x = vd["exhaustTailEndXMm"]
    tail_end_z = vd["exhaustTailEndZMm"]
    r_tip = vd["exhaustTipFlareOuterRadiusMm"]
    tail_ctrl = np.array(
        [
            [mx1, my, mz],
            [-995.0, my, mz],
            [-1025.0, my, 10.0],
            [tail_end_x, my, tail_end_z],
        ],
        dtype=np.float64,
    )
    tail_pts = catmull_rom(tail_ctrl, 12)
    bm_add_swept_tube_mm(bm, tail_pts, r_pipe, 20, M_SS, cap_start=False, cap_end=False)
    tail_dir = unit_np(tail_pts[-1] - tail_pts[-2])
    tip_end = tail_pts[-1] + tail_dir * 14.0
    bm_add_tube_segment_mm(bm, tail_pts[-1], tip_end, r_pipe, r_tip, 20, M_TINT, cap0=False, cap1=True)

    obj = finalize_bmesh_object(name, bm, [mat_ss, mat_tint])
    markers = [("if_turbine_outlet", if_tout)]
    empties = create_marker_empties(markers)
    filepath = out_dir / f"{name}.glb"
    export_glb(filepath, [obj, *empties])

    sdf = sdf_union(
        [
            sdf_swept_tube(path, radii),
            sdf_frustum_segment(if_tout, fl_end, r_fl, r_fl),
            sdf_frustum_segment(np.array([mx1, my, mz]), np.array([mx0, my, mz]), muff_r, muff_r),
            sdf_swept_tube(tail_pts, r_pipe),
            sdf_frustum_segment(tail_pts[-1], tip_end, r_pipe, r_tip),
        ]
    )

    bounds = (
        (vd["exhaustEnvXMinMm"], vd["exhaustEnvXMaxMm"]),
        (vd["exhaustEnvYMinMm"], vd["exhaustEnvYMaxMm"]),
        (vd["exhaustEnvZMinMm"], vd["exhaustEnvZMaxMm"]),
    )
    return BuiltVariantSpec(
        name=name,
        filepath=filepath,
        markers_mm=markers,
        envelope_bounds_mm=bounds,
        sdf_envelope=sdf,
        replaced_shell_subtrees={"turbo_downpipe"},
        marker_connected_groups={"if_turbine_outlet": {"turbo"}},
        obstacle_excluded_groups={"turbo"},
    )


def build_v4_intercooler(vd: dict[str, float], out_dir: Path) -> BuiltVariantSpec:
    reset_scene()
    name = "intercooler_core_engine_upgraded"

    mat_alu = make_pbr_material("mat_ic_core_brushed_alu", (0.74, 0.76, 0.78, 1.0), 0.92, 0.35)
    mat_tank = make_pbr_material("mat_ic_tank_black_powdercoat", (0.055, 0.055, 0.06, 1.0), 0.30, 0.55)
    mat_sil = make_pbr_material("mat_ic_silicone_black", (0.04, 0.04, 0.045, 1.0), 0.0, 0.62)
    M_ALU, M_TANK, M_SIL = 0, 1, 2

    bm = bmesh.new()
    if_hot = np.array(
        [vd["ifIntercoolerHotSideInletXMm"], vd["ifIntercoolerHotSideInletYMm"], vd["ifIntercoolerHotSideInletZMm"]]
    )
    r_pipe = vd["intercoolerPipeOuterRadiusMm"]
    r_coupler = vd["intercoolerCouplerOuterRadiusMm"]

    # 1. Hot-side Ø76.2 (r 38.1) pipe: +Y from if_hot_side_inlet, bending -X ≈ 230 mm along core front face into near tank
    hot_ctrl = np.array(
        [
            if_hot,
            [if_hot[0], 504.0, 149.0],
            [340.0, 512.0, 152.0],
            [220.0, 512.0, 152.0],
            [144.6, 516.0, 152.0],
            [120.0, 545.0, 152.0],
            [120.0, 560.0, 152.0],
        ],
        dtype=np.float64,
    )
    hot_pts = catmull_rom(hot_ctrl, 22)
    bm_add_swept_tube_mm(
        bm,
        hot_pts,
        r_pipe,
        16,
        M_ALU,
        cap_start=True,
        cap_end=True,
        cap_start_center_mm=if_hot,
        start_tangent_override=np.array([0.0, 1.0, 0.0]),
    )
    hot_total = float(polyline_arclength(hot_pts)[-1])
    hot_c1 = sample_polyline_slice(hot_pts, 4.0, 32.0, 3)
    hot_c2 = sample_polyline_slice(hot_pts, hot_total - 42.0, hot_total - 14.0, 3)
    bm_add_swept_annular_sleeve_mm(bm, hot_c1, r_pipe - 0.5, r_coupler, 16, M_SIL)
    bm_add_swept_annular_sleeve_mm(bm, hot_c2, r_pipe - 0.5, r_coupler, 16, M_SIL)

    # 2. Chamfered cast-style end tanks (60 x 110 x 340 at X 90..150 and X 610..670, Y 545..655, Z -20..320)
    ty0, ty1 = vd["intercoolerTankYMinMm"], vd["intercoolerTankYMaxMm"]
    tz0, tz1 = vd["intercoolerTankZMinMm"], vd["intercoolerTankZMaxMm"]
    ch = 12.0
    tank_yz_loop_m = [
        ((ty0 + ch) * MM_TO_M, tz0 * MM_TO_M),
        ((ty1 - ch) * MM_TO_M, tz0 * MM_TO_M),
        (ty1 * MM_TO_M, (tz0 + ch) * MM_TO_M),
        (ty1 * MM_TO_M, (tz1 - ch) * MM_TO_M),
        ((ty1 - ch) * MM_TO_M, tz1 * MM_TO_M),
        ((ty0 + ch) * MM_TO_M, tz1 * MM_TO_M),
        (ty0 * MM_TO_M, (tz1 - ch) * MM_TO_M),
        (ty0 * MM_TO_M, (tz0 + ch) * MM_TO_M),
    ]
    nx0, nx1 = vd["intercoolerNearTankXMinMm"], vd["intercoolerNearTankXMaxMm"]
    fx0, fx1 = vd["intercoolerFarTankXMinMm"], vd["intercoolerFarTankXMaxMm"]
    add_extruded_polygon_x(bm, tank_yz_loop_m, nx0 * MM_TO_M, nx1 * MM_TO_M, mat_index=M_TANK)
    add_extruded_polygon_x(bm, tank_yz_loop_m, fx0 * MM_TO_M, fx1 * MM_TO_M, mat_index=M_TANK)

    # 3. Bar-and-plate core box (X 150..610, Y 555..645, Z -10..310)
    cx0, cx1 = vd["intercoolerCoreXMinMm"], vd["intercoolerCoreXMaxMm"]
    cy0, cy1 = vd["intercoolerCoreYMinMm"], vd["intercoolerCoreYMaxMm"]
    cz0, cz1 = vd["intercoolerCoreZMinMm"], vd["intercoolerCoreZMaxMm"]
    add_box(
        bm,
        (cx0 * MM_TO_M, cy0 * MM_TO_M, cz0 * MM_TO_M),
        (cx1 * MM_TO_M, cy1 * MM_TO_M, cz1 * MM_TO_M),
        mat_index=M_ALU,
    )

    # 4. 18 raised vertical fin strips on -Y-facing core face, full core height
    fin_boxes: list[tuple[tuple[float, float, float], tuple[float, float, float]]] = []
    for k in range(18):
        fx = (cx0 + 10.0) + k * ((cx1 - cx0 - 20.0) / 17.0)
        bmin = (fx - 1.0, cy0 - 2.5, cz0)
        bmax = (fx + 1.0, cy0, cz1)
        fin_boxes.append((bmin, bmax))
        add_box(bm, tuple(c * MM_TO_M for c in bmin), tuple(c * MM_TO_M for c in bmax), mat_index=M_ALU)

    # 5. 3 small mounting brackets on the tank tops (Z 320..338)
    bracket_boxes = [
        ((102.0, 582.0, tz1), (138.0, 618.0, tz1 + 18.0)),
        ((622.0, 562.0, tz1), (658.0, 594.0, tz1 + 18.0)),
        ((622.0, 606.0, tz1), (658.0, 638.0, tz1 + 18.0)),
    ]
    for bmin, bmax in bracket_boxes:
        add_box(bm, tuple(c * MM_TO_M for c in bmin), tuple(c * MM_TO_M for c in bmax), mat_index=M_TANK)

    # 6. Cold-side Ø76.2 outlet neck pointing +Y ending in Ø84 silicone coupler
    cold_p0 = np.array([640.0, ty1, 152.0])
    cold_p1 = np.array([640.0, 696.0, 152.0])
    bm_add_tube_segment_mm(bm, cold_p0, cold_p1, r_pipe, r_pipe, 16, M_ALU, cap0=False, cap1=True)
    cold_c_pts = np.array([[640.0, 662.0, 152.0], [640.0, 692.0, 152.0]], dtype=np.float64)
    bm_add_swept_annular_sleeve_mm(bm, cold_c_pts, r_pipe - 0.5, r_coupler, 16, M_SIL)

    obj = finalize_bmesh_object(name, bm, [mat_alu, mat_tank, mat_sil])
    markers = [("if_hot_side_inlet", if_hot)]
    empties = create_marker_empties(markers)
    filepath = out_dir / f"{name}.glb"
    export_glb(filepath, [obj, *empties])

    sdf_parts: list[SdfFn] = [
        sdf_swept_tube(hot_pts, r_pipe),
        sdf_swept_tube(hot_c1, r_coupler),
        sdf_swept_tube(hot_c2, r_coupler),
        sdf_box((nx0, ty0, tz0), (nx1, ty1, tz1)),
        sdf_box((fx0, ty0, tz0), (fx1, ty1, tz1)),
        sdf_box((cx0, cy0, cz0), (cx1, cy1, cz1)),
        sdf_frustum_segment(cold_p0, cold_p1, r_pipe, r_pipe),
        sdf_swept_tube(cold_c_pts, r_coupler),
    ]
    for bmin, bmax in fin_boxes:
        sdf_parts.append(sdf_box(bmin, bmax))
    for bmin, bmax in bracket_boxes:
        sdf_parts.append(sdf_box(bmin, bmax))

    bounds = (
        (vd["intercoolerEnvXMinMm"], vd["intercoolerEnvXMaxMm"]),
        (vd["intercoolerEnvYMinMm"], vd["intercoolerEnvYMaxMm"]),
        (vd["intercoolerEnvZMinMm"], vd["intercoolerEnvZMaxMm"]),
    )
    return BuiltVariantSpec(
        name=name,
        filepath=filepath,
        markers_mm=markers,
        envelope_bounds_mm=bounds,
        sdf_envelope=sdf_union(sdf_parts),
        replaced_shell_subtrees=set(),
        marker_connected_groups={"if_hot_side_inlet": {"boostPipe"}},
        obstacle_excluded_groups={"boostPipe"},
    )


def revolved_dish_volume_cm3(bowl_points_rz_mm: list[tuple[float, float]], crown_z_mm: float) -> float:
    """Exact solid-of-revolution volume (cm^3) between z = crown_z_mm and bowl profile."""
    poly = [(0.0, crown_z_mm)] + list(bowl_points_rz_mm)
    if poly[-1][0] > 0.0:
        poly.append((0.0, crown_z_mm))
    area2 = 0.0
    centroid_num = 0.0
    n = len(poly)
    for i in range(n):
        r0, z0 = poly[i]
        r1, z1 = poly[(i + 1) % n]
        cross = r0 * z1 - r1 * z0
        area2 += cross
        centroid_num += (r0 + r1) * cross
    area = 0.5 * area2
    if abs(area) < 1e-12:
        return 0.0
    centroid_r = centroid_num / (6.0 * area)
    vol_mm3 = abs(2.0 * math.pi * area * centroid_r)
    return vol_mm3 / 1000.0


def ceil_float32_m(mm_val: float) -> float:
    """Ensures IEEE-754 float32 quantization in Blender Mesh does not round below mm_val * 1e-3."""
    target_m = mm_val * MM_TO_M
    f32 = float(np.float32(target_m))
    if f32 * 1000.0 < mm_val:
        f32 = float(np.nextafter(np.float32(target_m), np.float32(np.inf)))
    return f32


def build_v5_piston(d: dict[str, float], vd: dict[str, float], out_dir: Path) -> BuiltVariantSpec:
    reset_scene()
    name = "rot_piston_c1_lowcomp"

    mat_alu = make_pbr_material("mat_piston_forged_alu", (0.50, 0.52, 0.56, 1.0), 0.92, 0.34)
    mat_crown = make_pbr_material("mat_piston_anodized_crown", (0.16, 0.155, 0.15, 1.0), 0.65, 0.52)
    mat_steel = make_pbr_material("mat_piston_rings_pin_steel", (0.15, 0.16, 0.18, 1.0), 0.90, 0.28)
    M_ALU, M_CROWN, M_STEEL = 0, 1, 2

    bore_mm = d["boreMm"]
    skirt_clear_mm = d["pistonSkirtClearanceMm"]
    comp_h_mm = d["pistonCompressionHeightMm"]
    pin_d_mm = d["wristPinDiameterMm"]

    r_out_mm = 0.5 * (bore_mm - skirt_clear_mm)
    assert abs(r_out_mm - vd["pistonCrownOuterRadiusMm"]) < 1e-9
    assert abs(comp_h_mm - vd["pistonCrownHeightMm"]) < 1e-9

    r_out_m = ceil_float32_m(r_out_mm)
    comp_h_m = comp_h_mm * MM_TO_M
    pin_r_m = 0.5 * pin_d_mm * MM_TO_M

    skirt_bottom_m = -(pin_r_m + 0.165 * pin_d_mm * MM_TO_M)
    r_inner_cavity_m = 0.78 * r_out_m
    cavity_top_m = 0.56 * comp_h_m

    g_depth_m = 0.072 * r_out_m
    g_h1_m = 0.048 * comp_h_m
    g_h2_m = 0.048 * comp_h_m
    g_h3_m = 0.072 * comp_h_m

    z_top_land_m = comp_h_m - 0.135 * comp_h_m
    z_g1_bot_m = z_top_land_m - g_h1_m
    z_land2_m = z_g1_bot_m - 0.065 * comp_h_m
    z_g2_bot_m = z_land2_m - g_h2_m
    z_land3_m = z_g2_bot_m - 0.065 * comp_h_m
    z_g3_bot_m = z_land3_m - g_h3_m

    # Pinned 6-point open flat-floor dish + crown land profile (§3.2 V5, no valve reliefs)
    variant_bowl_mm = [
        (0.0, vd["pistonDishFlatFloorZMm"]),
        (vd["pistonDishFlatFloorRadiusMm"], vd["pistonDishFlatFloorZMm"]),
        (vd["pistonDishShoulderRadiusMm"], vd["pistonDishShoulderZMm"]),
        (vd["pistonDishLipRadiusMm"], vd["pistonDishLipZMm"]),
        (vd["pistonDishMouthRadiusMm"], vd["pistonCrownHeightMm"]),
    ]
    crown_profile_m = [(r * MM_TO_M, z * MM_TO_M) for (r, z) in variant_bowl_mm] + [(r_out_m, comp_h_m)]

    # Stock omega reference profile from frozen build_cylinder1.py (for analytic ΔV check)
    stock_bowl_depth_mm = 0.27 * comp_h_mm
    stock_bowl_mm = [
        (0.0, comp_h_mm - 0.11 * comp_h_mm),
        (0.16 * r_out_mm, comp_h_mm - 0.55 * stock_bowl_depth_mm),
        (0.38 * r_out_mm, comp_h_mm - stock_bowl_depth_mm),
        (0.60 * r_out_mm, comp_h_mm - 0.72 * stock_bowl_depth_mm),
        (0.54 * r_out_mm, comp_h_mm - 0.08 * stock_bowl_depth_mm),
        (0.56 * r_out_mm, comp_h_mm),
    ]
    v_stock_cm3 = revolved_dish_volume_cm3(stock_bowl_mm, comp_h_mm)
    v_lowcomp_cm3 = revolved_dish_volume_cm3(variant_bowl_mm, comp_h_mm)
    delta_v_cm3 = v_lowcomp_cm3 - v_stock_cm3

    bm = bmesh.new()

    # Main piston body (48 circumferential segments)
    body_profile_m = [
        (r_out_m, comp_h_m),
        (r_out_m, z_top_land_m),
        (r_out_m - g_depth_m, z_top_land_m),
        (r_out_m - g_depth_m, z_g1_bot_m),
        (r_out_m, z_g1_bot_m),
        (r_out_m, z_land2_m),
        (r_out_m - g_depth_m, z_land2_m),
        (r_out_m - g_depth_m, z_g2_bot_m),
        (r_out_m, z_g2_bot_m),
        (r_out_m, z_land3_m),
        (r_out_m - g_depth_m, z_land3_m),
        (r_out_m - g_depth_m, z_g3_bot_m),
        (r_out_m, z_g3_bot_m),
        (r_out_m, skirt_bottom_m + 0.02 * r_out_m),
        (r_out_m - 0.02 * r_out_m, skirt_bottom_m),
        (r_inner_cavity_m + 0.03 * r_out_m, skirt_bottom_m),
        (r_inner_cavity_m, skirt_bottom_m + 0.04 * r_out_m),
        (r_inner_cavity_m, cavity_top_m),
        (0.0, cavity_top_m + 0.05 * comp_h_m),
    ]
    add_revolved_profile(bm, body_profile_m, segments=48, axis="Z", mat_index=M_ALU)
    add_revolved_profile(bm, crown_profile_m, segments=48, axis="Z", mat_index=M_CROWN)

    # 3 piston rings (48 segments)
    r_ring_out_m = r_out_m - 0.002 * r_out_m
    r_ring_in_m = r_out_m - 0.88 * g_depth_m
    for z0_m, z1_m in (
        (z_g1_bot_m + 0.08 * g_h1_m, z_top_land_m - 0.08 * g_h1_m),
        (z_g2_bot_m + 0.08 * g_h2_m, z_land2_m - 0.08 * g_h2_m),
        (z_g3_bot_m + 0.06 * g_h3_m, z_land3_m - 0.06 * g_h3_m),
    ):
        add_tube_along_axis(bm, r_ring_in_m, r_ring_out_m, z0_m, z1_m, segments=48, axis="Z", mat_index=M_STEEL)

    # Internal pin bosses + hollow wrist pin along X (stock construction)
    boss_x_in_m = 0.30 * r_out_m
    boss_x_out_m = 0.80 * r_out_m
    boss_r_out_m = 1.32 * pin_r_m
    for sign_x in (-1.0, 1.0):
        x0 = sign_x * boss_x_in_m
        x1 = sign_x * boss_x_out_m
        xa, xb = (x0, x1) if x0 < x1 else (x1, x0)
        add_tube_along_axis(bm, pin_r_m, boss_r_out_m, xa, xb, segments=28, axis="X", mat_index=M_ALU)

    pin_half_m = 0.82 * r_out_m
    add_tube_along_axis(
        bm,
        0.52 * pin_r_m,
        0.995 * pin_r_m,
        -pin_half_m,
        pin_half_m,
        segments=32,
        axis="X",
        mat_index=M_STEEL,
    )

    obj = finalize_bmesh_object(name, bm, [mat_alu, mat_crown, mat_steel])
    filepath = out_dir / f"{name}.glb"
    export_glb(filepath, [obj])

    return BuiltVariantSpec(
        name=name,
        filepath=filepath,
        markers_mm=[],
        envelope_bounds_mm=None,
        sdf_envelope=None,
        replaced_shell_subtrees=set(),
        marker_connected_groups={},
        obstacle_excluded_groups=set(),
        meta={
            "v_stock_cm3": v_stock_cm3,
            "v_lowcomp_cm3": v_lowcomp_cm3,
            "delta_v_cm3": delta_v_cm3,
            "cr_implied_delta_cm3": vd["pistonCrImpliedDeltaVolumeMm3"] / 1000.0,
            "skirt_bottom_mm": skirt_bottom_m * 1000.0,
        },
    )


# ---------------------------------------------------------------------------
# Binary GLB parser (shell registration + exported GLB read-back)
# ---------------------------------------------------------------------------
COMPONENT_DTYPE = {
    5120: np.int8,
    5121: np.uint8,
    5122: np.int16,
    5123: np.uint16,
    5125: np.uint32,
    5126: np.float32,
}
TYPE_COUNT = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4, "MAT4": 16}


class ParsedGlb:
    def __init__(self, path: Path) -> None:
        raw = path.read_bytes()
        self.byte_length = len(raw)
        self.sha256 = hashlib.sha256(raw).hexdigest()
        magic, version, total_len = struct.unpack_from("<III", raw, 0)
        if magic != 0x46546C67 or version != 2 or total_len != len(raw):
            raise ValueError(f"Invalid GLB header in {path}")
        offset = 12
        json_bytes = b""
        bin_bytes = b""
        while offset < len(raw):
            c_len, c_type = struct.unpack_from("<II", raw, offset)
            offset += 8
            chunk = raw[offset : offset + c_len]
            offset += c_len
            if c_type == 0x4E4F534A:
                json_bytes = chunk
            elif c_type == 0x004E4942:
                bin_bytes = chunk
        self.doc = json.loads(json_bytes.decode("utf-8"))
        self.bin = bin_bytes

    def accessor_array(self, acc_idx: int) -> np.ndarray:
        acc = self.doc["accessors"][acc_idx]
        bv = self.doc["bufferViews"][acc["bufferView"]]
        dtype = np.dtype(COMPONENT_DTYPE[acc["componentType"]]).newbyteorder("<")
        comp_n = TYPE_COUNT[acc["type"]]
        count = int(acc["count"])
        elem_size = dtype.itemsize * comp_n
        stride = int(bv.get("byteStride", elem_size))
        base_offset = int(bv.get("byteOffset", 0)) + int(acc.get("byteOffset", 0))
        if stride == elem_size:
            arr = np.frombuffer(self.bin, dtype=dtype, count=count * comp_n, offset=base_offset)
            return arr.reshape((count, comp_n)) if comp_n > 1 else arr
        out = np.empty((count, comp_n), dtype=dtype)
        for i in range(count):
            row = np.frombuffer(self.bin, dtype=dtype, count=comp_n, offset=base_offset + i * stride)
            out[i] = row
        return out if comp_n > 1 else out[:, 0]


def node_local_mat4(node: dict) -> np.ndarray:
    if "matrix" in node:
        return np.asarray(node["matrix"], dtype=np.float64).reshape((4, 4)).T
    tx, ty, tz = node.get("translation", [0.0, 0.0, 0.0])
    qx, qy, qz, qw = node.get("rotation", [0.0, 0.0, 0.0, 1.0])
    sx, sy, sz = node.get("scale", [1.0, 1.0, 1.0])
    x2, y2, z2 = qx + qx, qy + qy, qz + qz
    xx, xy, xz = qx * x2, qx * y2, qx * z2
    yy, yz, zz = qy * y2, qy * z2, qz * z2
    wx, wy, wz = qw * x2, qw * y2, qw * z2
    return np.array(
        [
            [(1.0 - (yy + zz)) * sx, (xy - wz) * sy, (xz + wy) * sz, tx],
            [(xy + wz) * sx, (1.0 - (xx + zz)) * sy, (yz - wx) * sz, ty],
            [(xz - wy) * sx, (yz + wx) * sy, (1.0 - (xx + yy)) * sz, tz],
            [0.0, 0.0, 0.0, 1.0],
        ],
        dtype=np.float64,
    )


def compute_world_matrices(doc: dict) -> dict[int, np.ndarray]:
    nodes = doc.get("nodes", [])
    scene_idx = doc.get("scene", 0)
    roots = doc.get("scenes", [{}])[scene_idx].get("nodes", list(range(len(nodes))))
    out: dict[int, np.ndarray] = {}

    def visit(n_idx: int, parent: np.ndarray) -> None:
        world = parent @ node_local_mat4(nodes[n_idx])
        out[n_idx] = world
        for ch in nodes[n_idx].get("children", []):
            visit(ch, world)

    ident = np.eye(4, dtype=np.float64)
    for r in roots:
        visit(r, ident)
    return out


def transform_pts(mat4: np.ndarray, pts: np.ndarray) -> np.ndarray:
    return ( pts @ mat4[:3, :3].T ) + mat4[:3, 3]


def gltf_yup_m_to_project_mm(pts_gltf_m: np.ndarray) -> np.ndarray:
    """§3.1 / §9.4 conversion: p_mm = (1000*g_x, -1000*g_z, 1000*g_y)."""
    return np.stack(
        [
            1000.0 * pts_gltf_m[:, 0],
            -1000.0 * pts_gltf_m[:, 2],
            1000.0 * pts_gltf_m[:, 1],
        ],
        axis=1,
    )


SHELL_GROUP_NAMES = (
    "blockPan",
    "injectors",
    "cp3Fuel",
    "turbo",
    "egrSystem",
    "resonator",
    "intake",
    "boostPipe",
    "alternator",
    "acComp",
    "beltDrive",
    "electronics",
    "frontCover",
    "heads",
    "valveCovers",
    "exhaustManifolds",
    "chargePipeCold",
    "intakeBridge",
    "fuelFilter",
    "oilFill",
    "dipstick",
    "liftBracket",
)


def parse_frozen_shell(shell_path: Path) -> tuple[str, dict[str, np.ndarray], dict[str, tuple[str, np.ndarray]]]:
    """
    Returns:
      (sha256, group_verts_mm, fine_subtrees_mm)
      where group_verts_mm maps each of the 22 top-level shell group names to project-mm vertices,
      and fine_subtrees_mm splits `turbo` into `turbo_uppipe_rh`, `turbo_uppipe_lh`,
      `turbo_downpipe`, `turbo_unit` and `intake` into `intake_tract` so non-penetration can
      test non-replaced subtrees directly as well as per-group obstacle distances.
    """
    glb = ParsedGlb(shell_path)
    doc = glb.doc
    nodes = doc["nodes"]
    world_map = compute_world_matrices(doc)
    name_to_idx = {n.get("name"): idx for idx, n in enumerate(nodes) if n.get("name")}

    def collect_subtree_project_mm(start_idx: int) -> np.ndarray:
        chunks: list[np.ndarray] = []
        stack = [start_idx]
        while stack:
            idx = stack.pop()
            node = nodes[idx]
            if "mesh" in node:
                w = world_map[idx]
                for prim in doc["meshes"][node["mesh"]]["primitives"]:
                    pos_f = glb.accessor_array(prim["attributes"]["POSITION"]).astype(np.float64)
                    wp = transform_pts(w, pos_f)
                    # M10 §5.1 / §5.6.4 Y-up registration (scale 1, zero translation): p_mm = (1000*g_x, -1000*g_z, 1000*g_y)
                    reg_mm = gltf_yup_m_to_project_mm(wp)
                    chunks.append(reg_mm)
            stack.extend(node.get("children", []))
        return np.concatenate(chunks, axis=0) if chunks else np.zeros((0, 3), dtype=np.float64)

    group_verts: dict[str, np.ndarray] = {}
    fine_subtrees: dict[str, tuple[str, np.ndarray]] = {}
    for gname in SHELL_GROUP_NAMES:
        if gname not in name_to_idx:
            raise ValueError(f"Expected shell group '{gname}' not found in {shell_path}")
        top_idx = name_to_idx[gname]
        group_verts[gname] = collect_subtree_project_mm(top_idx)
        if gname == "turbo":
            ch = nodes[top_idx]["children"]
            fine_subtrees["turbo_uppipe_rh"] = ("turbo", collect_subtree_project_mm(ch[0]))
            fine_subtrees["turbo_uppipe_lh"] = ("turbo", collect_subtree_project_mm(ch[1]))
            fine_subtrees["turbo_downpipe"] = ("turbo", collect_subtree_project_mm(ch[2]))
            fine_subtrees["turbo_unit"] = ("turbo", collect_subtree_project_mm(ch[3]))
        elif gname == "intake":
            fine_subtrees["intake_tract"] = ("intake", group_verts[gname])
        else:
            fine_subtrees[gname] = (gname, group_verts[gname])

    return glb.sha256, group_verts, fine_subtrees


def min_vert_to_vert_distance(a: np.ndarray, b: np.ndarray, chunk: int = 256) -> float:
    b2 = np.einsum("ij,ij->i", b, b)
    best = np.inf
    for s in range(0, len(a), chunk):
        ac = a[s : s + chunk]
        d2 = np.einsum("ij,ij->i", ac, ac)[:, None] + b2[None, :] - 2.0 * (ac @ b.T)
        best = min(best, float(np.min(d2)))
    return math.sqrt(max(best, 0.0))


# ---------------------------------------------------------------------------
# Verification & logged assertion block (§3.3)
# ---------------------------------------------------------------------------
def verify_and_log(
    specs: list[BuiltVariantSpec],
    vd: dict[str, float],
    shell_sha256: str,
    shell_groups: dict[str, np.ndarray],
    shell_subtrees: dict[str, tuple[str, np.ndarray]],
) -> None:
    print("\n" + "=" * 96)
    print("M8 VARIANT BUILD — LOGGED ASSERTION BLOCK")
    print("=" * 96)
    print(f"Frozen exterior shell GLB SHA-256: {shell_sha256}")

    total_tris = 0
    total_bytes = 0

    for spec in specs:
        glb = ParsedGlb(spec.filepath)
        doc = glb.doc
        nodes = doc.get("nodes", [])
        meshes = doc.get("meshes", [])
        mats = doc.get("materials", [])
        world_map = compute_world_matrices(doc)

        assert not doc.get("images"), f"{spec.name}: unexpected images in GLB"
        assert not doc.get("textures"), f"{spec.name}: unexpected textures in GLB"

        # Node contract: exact root mesh node + exact if_* empty set
        mesh_nodes = [(idx, n) for idx, n in enumerate(nodes) if "mesh" in n]
        assert len(mesh_nodes) == 1, f"{spec.name}: expected 1 mesh node, got {len(mesh_nodes)}"
        root_idx, root_node = mesh_nodes[0]
        assert root_node.get("name") == spec.name, f"{spec.name}: root node mismatch {root_node.get('name')}"

        marker_nodes = {
            n.get("name"): (idx, n)
            for idx, n in enumerate(nodes)
            if "mesh" not in n and str(n.get("name", "")).startswith("if_")
        }
        expected_marker_names = {m_name for m_name, _ in spec.markers_mm}
        assert set(marker_nodes.keys()) == expected_marker_names, (
            f"{spec.name}: marker set {set(marker_nodes.keys())} != {expected_marker_names}"
        )

        # Triangle, vertex, material counts & world vertices in glTF m
        tris = 0
        verts_count = 0
        prim_world_gltf_m: list[tuple[str, np.ndarray]] = []
        w_root = world_map[root_idx]
        for prim in meshes[root_node["mesh"]]["primitives"]:
            pos_local = glb.accessor_array(prim["attributes"]["POSITION"]).astype(np.float64)
            verts_count += len(pos_local)
            if "indices" in prim:
                tris += len(glb.accessor_array(prim["indices"])) // 3
            else:
                tris += len(pos_local) // 3
            mat_name = mats[prim["material"]]["name"] if "material" in prim else ""
            prim_world_gltf_m.append((mat_name, transform_pts(w_root, pos_local)))

        all_gltf_m = np.concatenate([pts for _, pts in prim_world_gltf_m], axis=0)
        cap = VARIANT_CAPS[spec.name]
        assert 0 < tris <= cap, f"{spec.name}: triangles {tris} > cap {cap}"
        assert len(mats) <= MATERIAL_CAP, f"{spec.name}: materials {len(mats)} > {MATERIAL_CAP}"

        total_tris += tris
        total_bytes += glb.byte_length

        print(f"\n[{spec.name}.glb]")
        print(f"  bytes={glb.byte_length}  sha256={glb.sha256}")
        print(f"  triangles={tris} / cap={cap} (PASS)  vertices={verts_count}  materials={len(mats)} / {MATERIAL_CAP} (PASS)")

        if spec.envelope_bounds_mm is not None:
            proj_pts_mm = gltf_yup_m_to_project_mm(all_gltf_m)
            mn = proj_pts_mm.min(axis=0)
            mx = proj_pts_mm.max(axis=0)
            (x_lo, x_hi), (y_lo, y_hi), (z_lo, z_hi) = spec.envelope_bounds_mm
            assert mn[0] >= x_lo - 1e-3 and mx[0] <= x_hi + 1e-3, f"{spec.name}: X bounds {mn[0]:.2f}..{mx[0]:.2f}"
            assert mn[1] >= y_lo - 1e-3 and mx[1] <= y_hi + 1e-3, f"{spec.name}: Y bounds {mn[1]:.2f}..{mx[1]:.2f}"
            assert mn[2] >= z_lo - 1e-3 and mx[2] <= z_hi + 1e-3, f"{spec.name}: Z bounds {mn[2]:.2f}..{mx[2]:.2f}"
            ground_clr = float(mn[2] - vd["studioFloorZMm"])
            print(
                f"  project_bounds_mm: X[{mn[0]:.2f}, {mx[0]:.2f}] in [{x_lo}, {x_hi}]  "
                f"Y[{mn[1]:.2f}, {mx[1]:.2f}] in [{y_lo}, {y_hi}]  "
                f"Z[{mn[2]:.2f}, {mx[2]:.2f}] in [{z_lo}, {z_hi}] (PASS)"
            )
            if spec.name in ("exhaust_system_engine_4inch", "intercooler_core_engine_upgraded"):
                assert mn[2] >= vd["externalMinZLimitMm"], (
                    f"{spec.name}: min Z {mn[2]:.2f} < {vd['externalMinZLimitMm']}"
                )
            print(f"  min_z_mm={mn[2]:.2f}  ground_clearance_mm={ground_clr:.2f}")

            # Marker read-back in project space
            for m_name, expected_mm in spec.markers_mm:
                m_idx, _ = marker_nodes[m_name]
                wm = world_map[m_idx]
                g_pos = np.array([[wm[0, 3], wm[1, 3], wm[2, 3]]], dtype=np.float64)
                p_mm = gltf_yup_m_to_project_mm(g_pos)[0]
                dev = float(np.linalg.norm(p_mm - expected_mm))
                mesh_nearest = min_vert_to_vert_distance(expected_mm[None, :], proj_pts_mm)
                assert dev <= 0.05, f"{spec.name} marker {m_name} dev {dev:.4f} mm"
                print(
                    f"  marker {m_name}: glb_mm=({p_mm[0]:.2f}, {p_mm[1]:.2f}, {p_mm[2]:.2f}) "
                    f"datum_dev={dev:.4f} mm (PASS)  nearest_mesh_vert={mesh_nearest:.3f} mm"
                )

            # Vertex-level non-penetration against analytic solid envelope (Spec §3.3 + D-039 90.0 mm collar)
            assert spec.sdf_envelope is not None
            marker_pos_by_name = dict(spec.markers_mm)
            obstacle_chunks: list[np.ndarray] = []
            collar90_conn_chunks: list[np.ndarray] = []
            conn_outside90_mins: list[tuple[str, float]] = []
            diag_30_to_90_count = 0
            max_conn_inside_marker_dist = 0.0

            for sub_id, (parent_grp, sub_verts) in shell_subtrees.items():
                if sub_id in spec.replaced_shell_subtrees:
                    continue
                mated_markers = [
                    marker_pos_by_name[m_name]
                    for m_name, conn_grps in spec.marker_connected_groups.items()
                    if parent_grp in conn_grps
                ]
                if not mated_markers:
                    obstacle_chunks.append(sub_verts)
                else:
                    d_mated = np.min(
                        np.stack(
                            [np.linalg.norm(sub_verts - mp[None, :], axis=1) for mp in mated_markers],
                            axis=1,
                        ),
                        axis=1,
                    )
                    sub_sdf = spec.sdf_envelope(sub_verts)
                    in_env = sub_sdf <= 0.0
                    if np.any(in_env):
                        max_conn_inside_marker_dist = max(
                            max_conn_inside_marker_dist, float(np.max(d_mated[in_env]))
                        )
                    diag_30_to_90_count += int(
                        np.sum(in_env & (d_mated > SPEC_NOMINAL_MARKER_RADIUS_MM) & (d_mated <= APPROVED_MARKER_COLLAR_RADIUS_MM))
                    )
                    outside90_mask = d_mated > APPROVED_MARKER_COLLAR_RADIUS_MM
                    if np.any(outside90_mask):
                        rem_verts = sub_verts[outside90_mask]
                        collar90_conn_chunks.append(rem_verts)
                        conn_outside90_mins.append((sub_id, min_vert_to_vert_distance(proj_pts_mm, rem_verts)))

            obs_pts = np.concatenate(obstacle_chunks, axis=0)
            obs_sdf = spec.sdf_envelope(obs_pts)
            obs_inside = int(np.sum(obs_sdf <= 0.0))
            min_env_surface_mm = float(np.min(obs_sdf))

            col_inside = (
                int(np.sum(spec.sdf_envelope(np.concatenate(collar90_conn_chunks, axis=0)) <= 0.0))
                if collar90_conn_chunks
                else 0
            )

            # Per-group vertex-to-vertex distances across non-connected obstacle groups
            group_mins: list[tuple[str, float]] = []
            for gname, gverts in shell_groups.items():
                if gname in spec.obstacle_excluded_groups:
                    continue
                gd = min_vert_to_vert_distance(proj_pts_mm, gverts)
                group_mins.append((gname, gd))
            group_mins.sort(key=lambda item: item[1])
            nearest_grp, nearest_v2v = group_mins[0]

            conn_outside90_mins.sort(key=lambda item: item[1])
            nearest_conn_sub, nearest_conn_v2v = conn_outside90_mins[0]

            assert obs_inside == 0, f"{spec.name}: {obs_inside} obstacle vertices inside envelope!"
            assert col_inside == 0, (
                f"{spec.name}: {col_inside} connected-group vertices outside {APPROVED_MARKER_COLLAR_RADIUS_MM} mm collar inside envelope!"
            )
            assert nearest_v2v >= MIN_OBSTACLE_CLEARANCE_MM, (
                f"{spec.name}: min obstacle v2v {nearest_v2v:.2f} mm < {MIN_OBSTACLE_CLEARANCE_MM} mm"
            )
            assert nearest_conn_v2v >= MIN_OBSTACLE_CLEARANCE_MM, (
                f"{spec.name}: min connected-outside-90mm v2v {nearest_conn_v2v:.2f} mm < {MIN_OBSTACLE_CLEARANCE_MM} mm"
            )
            top4_str = ", ".join(f"{g}:{d:.2f}" for g, d in group_mins[:4])
            print(
                f"  non_penetration: non_excepted_inside=0 (obstacle_groups={obs_inside}, "
                f"connected_outside_90mm_collar={col_inside}; PASS, D-039)  "
                f"min_envelope_surface_gap_mm={min_env_surface_mm:.2f}  "
                f"min_v2v_mm={nearest_v2v:.2f} ({nearest_grp}) >= 2.00 (PASS)  [{top4_str}]"
            )
            print(
                f"  connection_collar_diag (D-039): connected_30_to_90mm_mouth_verts={diag_30_to_90_count} "
                f"(max_marker_dist={max_conn_inside_marker_dist:.2f} mm <= 90.00 mm)  "
                f"min_connected_outside_90mm_v2v_mm={nearest_conn_v2v:.2f} ({nearest_conn_sub}) >= 2.00 (PASS)"
            )

            # Export read-back for V2 tube 101.6 mm OD from cross-section
            if spec.name == "intake_tract_engine_highflow":
                alu_pts_mm = np.concatenate(
                    [gltf_yup_m_to_project_mm(pts) for mname, pts in prim_world_gltf_m if mname == "mat_intake_alu_polished"],
                    axis=0,
                )
                n_cin = unit_np(
                    [vd["compressorInletNormalX"], vd["compressorInletNormalY"], vd["compressorInletNormalZ"]]
                )
                if_cin = np.array(
                    [vd["ifTurboCompressorInletXMm"], vd["ifTurboCompressorInletYMm"], vd["ifTurboCompressorInletZMm"]]
                )
                c0_mm = if_cin + n_cin * vd["intakeTubeStartOffsetMm"]
                rel = alu_pts_mm - c0_mm[None, :]
                ring_mask = (np.abs(rel @ n_cin) < 0.25) & (np.linalg.norm(rel, axis=1) > 10.0) & (
                    np.linalg.norm(rel, axis=1) < 80.0
                )
                ring_pts = alu_pts_mm[ring_mask]
                measured_od = 2.0 * float(np.mean(np.linalg.norm(ring_pts - c0_mm[None, :], axis=1)))
                assert abs(measured_od - vd["intakeTubeOuterDiameterMm"]) <= 0.05, (
                    f"V2 read-back OD {measured_od:.4f} != {vd['intakeTubeOuterDiameterMm']}"
                )
                print(
                    f"  readback_v2_tube_od_mm={measured_od:.4f} "
                    f"(expected {vd['intakeTubeOuterDiameterMm']:.4f}, PASS)"
                )

        else:
            # V5 piston: part-local glTF space (+Y bore, X/Z radial), pivot at origin
            root_trans = w_root[:3, 3]
            assert float(np.max(np.abs(root_trans))) <= 1e-6, f"V5 pivot drift {root_trans}"
            mn_m = all_gltf_m.min(axis=0)
            mx_m = all_gltf_m.max(axis=0)
            hx_min, hx_max = abs(mn_m[0]) * 1000.0, abs(mx_m[0]) * 1000.0
            hz_min, hz_max = abs(mn_m[2]) * 1000.0, abs(mx_m[2]) * 1000.0
            od_x = (mx_m[0] - mn_m[0]) * 1000.0
            od_z = (mx_m[2] - mn_m[2]) * 1000.0
            crown_y_mm = mx_m[1] * 1000.0
            skirt_bot_mm = mn_m[1] * 1000.0

            r_pin = vd["pistonCrownOuterRadiusMm"]
            for h_ext in (hx_min, hx_max, hz_min, hz_max):
                assert r_pin <= h_ext <= r_pin + 0.05, f"V5 half-extent {h_ext:.6f} outside [{r_pin}, {r_pin + 0.05}]"
            assert 2.0 * r_pin <= od_x <= 2.0 * r_pin + 0.10
            assert 2.0 * r_pin <= od_z <= 2.0 * r_pin + 0.10
            assert abs(crown_y_mm - vd["pistonCrownHeightMm"]) <= 0.10

            # Volume contract assertion
            v_stock = spec.meta["v_stock_cm3"]
            v_lowcomp = spec.meta["v_lowcomp_cm3"]
            delta_v = spec.meta["delta_v_cm3"]
            cr_target = spec.meta["cr_implied_delta_cm3"]
            assert abs(v_stock * 1000.0 - vd["pistonStockDishVolumeMm3"]) <= 1.0
            assert abs(v_lowcomp * 1000.0 - vd["pistonVariantDishVolumeMm3"]) <= 1.0
            assert abs(delta_v - cr_target) <= 0.05, f"V5 delta_v {delta_v:.4f} outside {cr_target:.4f} +- 0.05"

            # Export read-back of V5 crown profile from mat_piston_anodized_crown primitive
            crown_pts_m = np.concatenate(
                [pts for mname, pts in prim_world_gltf_m if mname == "mat_piston_anodized_crown"],
                axis=0,
            )
            crown_r_mm = np.sqrt(crown_pts_m[:, 0] ** 2 + crown_pts_m[:, 2] ** 2) * 1000.0
            crown_z_mm = crown_pts_m[:, 1] * 1000.0
            # Cluster distinct radial rings (rounded to 0.01 mm)
            ring_radii = sorted({round(float(r), 4) for r in crown_r_mm})
            # Collapse near-identical float32 values within 0.005 mm
            distinct_r: list[float] = []
            for r in ring_radii:
                if not distinct_r or abs(r - distinct_r[-1]) > 0.005:
                    distinct_r.append(r)
            expected_r = [
                0.0,
                vd["pistonDishFlatFloorRadiusMm"],
                vd["pistonDishShoulderRadiusMm"],
                vd["pistonDishLipRadiusMm"],
                vd["pistonDishMouthRadiusMm"],
                vd["pistonCrownOuterRadiusMm"],
            ]
            assert len(distinct_r) == len(expected_r), f"V5 crown rings {distinct_r} != {expected_r}"
            for got_r, exp_r in zip(distinct_r, expected_r):
                assert abs(got_r - exp_r) <= 0.02, f"V5 crown radius {got_r} != {exp_r}"
            dish_floor_z = float(np.min(crown_z_mm))
            dish_depth_readback = float(np.max(crown_z_mm) - dish_floor_z)
            assert abs(dish_depth_readback - vd["pistonDishDepthMm"]) <= 0.02

            print(
                f"  bore_fit_mm: OD_X={od_x:.5f}  OD_Z={od_z:.5f}  crown_Y={crown_y_mm:.4f}  "
                f"skirt_bottom_Y={skirt_bot_mm:.4f}  pivot_max_abs_m={float(np.max(np.abs(root_trans))):.2e} (PASS)"
            )
            print(
                f"  dish_volume_cm3: stock={v_stock:.4f}  lowcomp={v_lowcomp:.4f}  "
                f"delta={delta_v:.4f} vs CR_target={cr_target:.4f} (diff={delta_v - cr_target:+.4f} <= 0.05, PASS)"
            )
            print(
                f"  readback_v5_crown: radii_mm={[round(r, 4) for r in distinct_r]}  "
                f"dish_depth_mm={dish_depth_readback:.4f} (PASS)"
            )

    assert total_tris <= 16000, f"Total variant triangles {total_tris} > 16000"
    print("\n" + "-" * 96)
    print(f"SUMMARY: 5/5 variant GLBs verified | total_triangles={total_tris} / 16000 | total_bytes={total_bytes}")
    print("=" * 96 + "\n")


def main() -> None:
    args = parse_args()
    out_dir = Path(args.out).resolve()
    dims_path = Path(args.dimensions).resolve() if args.dimensions else (REPO_ROOT / "assets-src" / "dimensions.json")
    vdims_path = (
        Path(args.variant_dimensions).resolve()
        if args.variant_dimensions
        else (REPO_ROOT / "assets-src" / "variant_dimensions.json")
    )
    shell_path = (
        Path(args.shell).resolve() if args.shell else (REPO_ROOT / "public" / "Duramax_LLY_2005_66L_V8.glb")
    )

    dims: dict[str, float] = json.loads(dims_path.read_text(encoding="utf-8"))
    vdims: dict[str, float] = json.loads(vdims_path.read_text(encoding="utf-8"))

    shell_sha256, shell_groups, shell_subtrees = parse_frozen_shell(shell_path)

    specs = [
        build_v1_turbo(vdims, out_dir),
        build_v2_intake(vdims, out_dir),
        build_v3_exhaust(vdims, out_dir),
        build_v4_intercooler(vdims, out_dir),
        build_v5_piston(dims, vdims, out_dir),
    ]
    verify_and_log(specs, vdims, shell_sha256, shell_groups, shell_subtrees)


if __name__ == "__main__":
    try:
        main()
    except Exception:
        import traceback

        traceback.print_exc()
        sys.exit(1)
