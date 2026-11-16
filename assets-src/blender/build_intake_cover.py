"""
Headless Blender 5.2 build script for Milestone 12 optional LLY plastic upper intake
manifold cover GLB (GM 21994000 -> public/models/intake_cover_lly.glb).

Usage:
  blender --background --python assets-src/blender/build_intake_cover.py -- --out public/models/intake_cover_lly.glb

Normative contract (docs/specs/M12-intake-cover.md §§4, 9, 16.2):
- Reads all dimensions, planform vertices, wall thickness, mount features, glyph stroke
  prisms, materials, and caps exclusively from assets-src/cover_dimensions.json.
- Authors in the master project frame (+X front/crank, +Y vehicle LH, +Z up, metres)
  under one root Group node `intake_cover_lly`, with two mesh leaves
  (`ext_intake_cover_body`, `ext_intake_cover_lettering`) and two empty markers
  (`if_intake_cover_rear_bolt`, `if_intake_cover_duct_clamp`), exported Y-up (`export_yup=True`)
  with `POSITION` + `NORMAL` indexed triangles only (zero textures, images, UVs, skins, animations).
- Runs a binary GLB read-back verification asserting file size, hierarchy, triangle caps,
  exact 540 lettering triangles, bounds, marker deviations, 0 boundary edges at 1e-5 m,
  exact 3 closed body components + 45 closed lettering prism components, and full shell + V2
  clearance reproduction.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import struct
import sys
from pathlib import Path
from typing import Any

import bmesh
import bpy
import numpy as np
from mathutils import Vector

THIS_DIR = Path(__file__).resolve().parent
REPO_ROOT = THIS_DIR.parent.parent
sys.dont_write_bytecode = True

MM_TO_M = 0.001


def parse_args() -> argparse.Namespace:
    argv = sys.argv
    script_args = argv[argv.index("--") + 1 :] if "--" in argv else []
    parser = argparse.ArgumentParser(description="Build Milestone 12 LLY intake manifold cover GLB.")
    parser.add_argument(
        "--out",
        default=str(REPO_ROOT / "public" / "models" / "intake_cover_lly.glb"),
        help="Output path for intake_cover_lly.glb.",
    )
    parser.add_argument(
        "--cover-dimensions",
        default=str(REPO_ROOT / "assets-src" / "cover_dimensions.json"),
        help="Path to assets-src/cover_dimensions.json.",
    )
    parser.add_argument(
        "--shell",
        default=str(REPO_ROOT / "public" / "Duramax_LLY_2005_66L_V8.glb"),
        help="Path to frozen Duramax_LLY_2005_66L_V8.glb for clearance verification.",
    )
    parser.add_argument(
        "--variant-dimensions",
        default=str(REPO_ROOT / "assets-src" / "variant_dimensions.json"),
        help="Path to frozen assets-src/variant_dimensions.json for V2 clearance verification.",
    )
    return parser.parse_args(script_args)


def reset_scene() -> None:
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    for mesh in list(bpy.data.meshes):
        bpy.data.meshes.remove(mesh)
    for mat in list(bpy.data.materials):
        bpy.data.materials.remove(mat)
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0


def build_materials(mat_defs: dict[str, Any]) -> dict[str, bpy.types.Material]:
    out: dict[str, bpy.types.Material] = {}
    for name, spec in mat_defs.items():
        if name.startswith("_"):
            continue
        mat = bpy.data.materials.new(name=name)
        if mat.node_tree is None:
            mat.use_nodes = True
        mat.use_backface_culling = not bool(spec.get("doubleSided", True))
        bsdf = mat.node_tree.nodes.get("Principled BSDF")
        if bsdf is None:
            bsdf = mat.node_tree.nodes.new("ShaderNodeBsdfPrincipled")
        bsdf.inputs["Base Color"].default_value = tuple(float(x) for x in spec["baseColor"])
        bsdf.inputs["Metallic"].default_value = float(spec["metallic"])
        bsdf.inputs["Roughness"].default_value = float(spec["roughness"])
        out[name] = mat
    return out


def v_m(x_mm: float, y_mm: float, z_mm: float) -> Vector:
    return Vector((x_mm * MM_TO_M, y_mm * MM_TO_M, z_mm * MM_TO_M))


# ---------------------------------------------------------------------------
# 2D Polygon Offset Ring & Ear-Clipping Triangulation
# ---------------------------------------------------------------------------
def build_shield_offset_ring_xy_mm(shell_cfg: dict[str, Any], inset_mm: float) -> list[tuple[float, float]]:
    """
    Builds the counter-clockwise XY ring at uniform inward offset `inset_mm` from P1..P6:
      P1 (x_rear, y_relief) -> P2 (x_step, y_relief) -> P3 (x_step, y_rh)
      -> P4 (x_front, y_rh) -> P5 (x_front, y_lh) -> P6 (x_rear, y_lh)
    All 5 convex corners share fixed arc centres with radius `R0 - inset_mm`;
    reflex corner P2 shifts to `(x_step + inset_mm, y_relief + inset_mm)`.
    """
    pf = shell_cfg["planformMm"]
    x_rear, y_relief = float(pf[0][0]), float(pf[0][1])
    x_step, y_rh = float(pf[2][0]), float(pf[2][1])
    x_front, y_lh = float(pf[4][0]), float(pf[4][1])

    r0 = float(shell_cfg["convexCornerRadiusMm"])
    arc_segs = int(shell_cfg["convexCornerArcSegments"])
    r = r0 - inset_mm
    assert r > 1.0, f"Convex corner radius collapsed at inset {inset_mm}: r={r}"

    pts: list[tuple[float, float]] = []

    def add_arc(cx: float, cy: float, deg0: float, deg1: float) -> None:
        for k in range(arc_segs + 1):
            ang = math.radians(deg0 + (deg1 - deg0) * (k / arc_segs))
            pts.append((cx + r * math.cos(ang), cy + r * math.sin(ang)))

    # P1 convex (180 -> 270 deg)
    add_arc(x_rear + r0, y_relief + r0, 180.0, 270.0)
    # P2 reflex (exact parallel inward shift)
    pts.append((x_step + inset_mm, y_relief + inset_mm))
    # P3 convex (180 -> 270 deg)
    add_arc(x_step + r0, y_rh + r0, 180.0, 270.0)
    # P4 convex (270 -> 360 deg)
    add_arc(x_front - r0, y_rh + r0, 270.0, 360.0)
    # P5 convex (0 -> 90 deg)
    add_arc(x_front - r0, y_lh - r0, 0.0, 90.0)
    # P6 convex (90 -> 180 deg)
    add_arc(x_rear + r0, y_lh - r0, 90.0, 180.0)

    return pts


def signed_area_2d(poly: list[tuple[float, float]]) -> float:
    n = len(poly)
    acc = 0.0
    for i in range(n):
        x0, y0 = poly[i]
        x1, y1 = poly[(i + 1) % n]
        acc += x0 * y1 - x1 * y0
    return 0.5 * acc


def point_in_tri_2d(
    p: tuple[float, float],
    a: tuple[float, float],
    b: tuple[float, float],
    c: tuple[float, float],
) -> bool:
    def cross(o: tuple[float, float], u: tuple[float, float], w: tuple[float, float]) -> float:
        return (u[0] - o[0]) * (w[1] - o[1]) - (u[1] - o[1]) * (w[0] - o[0])

    c1 = cross(a, b, p)
    c2 = cross(b, c, p)
    c3 = cross(c, a, p)
    return c1 >= -1e-9 and c2 >= -1e-9 and c3 >= -1e-9


def triangulate_ccw_polygon_2d(poly: list[tuple[float, float]]) -> list[tuple[int, int, int]]:
    """Deterministic ear-clipping triangulation of a simple counter-clockwise 2D polygon."""
    assert signed_area_2d(poly) > 0.0, "Expected counter-clockwise 2D polygon"
    remaining = list(range(len(poly)))
    tris: list[tuple[int, int, int]] = []

    guard = 0
    while len(remaining) > 3:
        guard += 1
        assert guard <= len(poly) * len(poly) + 10, "Ear-clipping failed to converge"
        best_ear_pos = -1
        best_min_angle = -1.0
        m = len(remaining)
        for pos in range(m):
            i_prev = remaining[(pos - 1) % m]
            i_curr = remaining[pos]
            i_next = remaining[(pos + 1) % m]
            a, b, c = poly[i_prev], poly[i_curr], poly[i_next]
            cross = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
            if cross <= 1e-7:
                continue
            blocked = False
            for other in remaining:
                if other in (i_prev, i_curr, i_next):
                    continue
                if point_in_tri_2d(poly[other], a, b, c):
                    blocked = True
                    break
            if blocked:
                continue
            # Prefer well-shaped ears over thin slivers
            ab = math.hypot(b[0] - a[0], b[1] - a[1])
            bc = math.hypot(c[0] - b[0], c[1] - b[1])
            ca = math.hypot(a[0] - c[0], a[1] - c[1])
            quality = cross / max(ab * bc + bc * ca + ca * ab, 1e-9)
            if quality > best_min_angle:
                best_min_angle = quality
                best_ear_pos = pos

        assert best_ear_pos >= 0, "No valid ear found in polygon"
        m = len(remaining)
        i_prev = remaining[(best_ear_pos - 1) % m]
        i_curr = remaining[best_ear_pos]
        i_next = remaining[(best_ear_pos + 1) % m]
        tris.append((i_prev, i_curr, i_next))
        remaining.pop(best_ear_pos)

    tris.append((remaining[0], remaining[1], remaining[2]))
    return tris


# ---------------------------------------------------------------------------
# Mesh Construction: Body (Shell + Rear Boss + Integrated Front Mount)
# ---------------------------------------------------------------------------
def add_quad_ring_band(
    bm: bmesh.types.BMesh,
    ring_a: list[bmesh.types.BMVert],
    ring_b: list[bmesh.types.BMVert],
) -> None:
    n = len(ring_a)
    assert len(ring_b) == n
    for i in range(n):
        j = (i + 1) % n
        v00, v01 = ring_a[i], ring_a[j]
        v10, v11 = ring_b[i], ring_b[j]
        bm.faces.new((v00, v01, v11))
        bm.faces.new((v00, v11, v10))


def add_closed_mount_tower(bm: bmesh.types.BMesh, mount_cfg: dict[str, Any]) -> None:
    cx, cy, z_bot = (float(v) for v in mount_cfg["positionMm"])
    r_pad = float(mount_cfg["padRadiusMm"])
    z_mid = float(mount_cfg["midZMm"])
    r_mid = float(mount_cfg["midRadiusMm"])
    z_top = float(mount_cfg["topZMm"])
    r_top = float(mount_cfg["topRadiusMm"])
    segs = int(mount_cfg["radialSegments"])

    stations = [(z_bot, r_pad), (z_mid, r_mid), (z_top, r_top)]
    rings: list[list[bmesh.types.BMVert]] = []
    for z_mm, r_mm in stations:
        ring: list[bmesh.types.BMVert] = []
        for i in range(segs):
            ang = (2.0 * math.pi * i) / segs
            ring.append(bm.verts.new(v_m(cx + r_mm * math.cos(ang), cy + r_mm * math.sin(ang), z_mm)))
        rings.append(ring)

    for k in range(len(rings) - 1):
        add_quad_ring_band(bm, rings[k], rings[k + 1])

    # Bottom cap (-Z normal) and top cap (+Z normal) using central pole vertices
    bot_center = bm.verts.new(v_m(cx, cy, z_bot))
    top_center = bm.verts.new(v_m(cx, cy, z_top))
    for i in range(segs):
        j = (i + 1) % segs
        bm.faces.new((bot_center, rings[0][j], rings[0][i]))
        bm.faces.new((top_center, rings[-1][i], rings[-1][j]))


def finalize_mesh_object(
    name: str,
    bm: bmesh.types.BMesh,
    material: bpy.types.Material,
    crease_deg: float = 34.0,
) -> bpy.types.Object:
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bmesh.ops.triangulate(bm, faces=list(bm.faces), quad_method="BEAUTY", ngon_method="EAR_CLIP")

    # Split edges sharper than crease_deg so flat pads, rims, and stroke prisms export crisp normals
    # without altering `(x, y, z)` vertex coordinates (preserving exact 1e-5 m position welding).
    cos_thresh = math.cos(math.radians(crease_deg))
    sharp_edges = []
    for edge in bm.edges:
        if len(edge.link_faces) == 2:
            n0 = edge.link_faces[0].normal
            n1 = edge.link_faces[1].normal
            if n0.length > 1e-9 and n1.length > 1e-9 and n0.dot(n1) < cos_thresh:
                sharp_edges.append(edge)
    if sharp_edges:
        bmesh.ops.split_edges(bm, edges=sharp_edges)

    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()

    for poly in mesh.polygons:
        poly.use_smooth = True
    mesh.materials.append(material)

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return obj


def build_cover_body_object(
    cd: dict[str, Any],
    mat_plastic: bpy.types.Material,
) -> bpy.types.Object:
    shell_cfg = cd["shell"]
    mounts_cfg = cd["mounts"]
    body_name = str(cd["contract"]["bodyMeshName"])

    z_min = float(shell_cfg["bodyZMinMm"])
    z_max = float(shell_cfg["bodyZMaxMm"])
    wall = float(shell_cfg["wallThicknessMm"])
    z_outer_sh = float(shell_cfg["outerShoulderZMm"])
    d_outer_sh = float(shell_cfg["outerShoulderInsetMm"])
    d_outer_pad = float(shell_cfg["outerPadInsetMm"])
    d_inner_ceil = float(shell_cfg["innerCeilingInsetMm"])
    z_inner_sh = float(shell_cfg["innerShoulderZMm"])
    d_inner_wall = float(shell_cfg["innerWallInsetMm"])
    z_inner_ceil = z_max - wall

    bm = bmesh.new()

    # Component 1: Watertight thin-walled shell with open underside cavity and 2.5 mm bottom rim
    ring_specs = [
        (0.0, z_min),            # 0: outer bottom rim (Z = 370.0)
        (d_outer_sh, z_outer_sh),  # 1: outer upper skirt
        (d_outer_pad, z_max),    # 2: outer flat pad boundary (Z = 417.2)
        (d_inner_ceil, z_inner_ceil),  # 3: inner ceiling boundary (Z = 414.7)
        (d_inner_wall, z_inner_sh),    # 4: inner upper skirt
        (wall, z_min),           # 5: inner bottom rim (Z = 370.0, offset 2.5 mm)
    ]

    xy_rings = [build_shield_offset_ring_xy_mm(shell_cfg, d_mm) for d_mm, _ in ring_specs]
    bm_rings: list[list[bmesh.types.BMVert]] = [
        [bm.verts.new(v_m(x, y, z_mm)) for (x, y) in xy_rings[idx]]
        for idx, (_, z_mm) in enumerate(ring_specs)
    ]

    # Outer skirt + shoulder bevel (outward normals)
    add_quad_ring_band(bm, bm_rings[0], bm_rings[1])
    add_quad_ring_band(bm, bm_rings[1], bm_rings[2])

    # Flat top pad at Z = 417.2 (+Z normal)
    top_tris = triangulate_ccw_polygon_2d(xy_rings[2])
    for i0, i1, i2 in top_tris:
        bm.faces.new((bm_rings[2][i0], bm_rings[2][i1], bm_rings[2][i2]))

    # Inner ceiling at Z = 414.7 (-Z normal into open underside cavity)
    ceil_tris = triangulate_ccw_polygon_2d(xy_rings[3])
    for i0, i1, i2 in ceil_tris:
        bm.faces.new((bm_rings[3][i0], bm_rings[3][i2], bm_rings[3][i1]))

    # Inner bevel + inner skirt (inward normals) + 2.5 mm bottom rim ring (-Z normal)
    add_quad_ring_band(bm, bm_rings[4], bm_rings[3])
    add_quad_ring_band(bm, bm_rings[5], bm_rings[4])
    add_quad_ring_band(bm, bm_rings[0], bm_rings[5])

    # Component 2: Closed rear mounting boss/tower to if_intake_cover_rear_bolt (333.4 mm)
    add_closed_mount_tower(bm, mounts_cfg["rearBolt"])

    # Component 3: Closed simplified integrated front mount/leg to if_intake_cover_duct_clamp (353.4 mm)
    add_closed_mount_tower(bm, mounts_cfg["ductClamp"])

    return finalize_mesh_object(body_name, bm, mat_plastic, crease_deg=34.0)


# ---------------------------------------------------------------------------
# Mesh Construction: 45-Prism Raised Rectilinear Stroke Lettering
# ---------------------------------------------------------------------------
def add_closed_quad_prism_xy_mm(
    bm: bmesh.types.BMesh,
    corners_xy_ccw: list[tuple[float, float]],
    z0_mm: float,
    z1_mm: float,
) -> None:
    """Adds one closed 8-vertex, 12-triangle rectangular prism extruded along Z."""
    assert len(corners_xy_ccw) == 4
    assert signed_area_2d(corners_xy_ccw) > 0.0, f"Prism XY footprint not CCW: {corners_xy_ccw}"
    bot = [bm.verts.new(v_m(x, y, z0_mm)) for (x, y) in corners_xy_ccw]
    top = [bm.verts.new(v_m(x, y, z1_mm)) for (x, y) in corners_xy_ccw]

    # Bottom (-Z) and top (+Z)
    bm.faces.new((bot[0], bot[3], bot[2], bot[1]))
    bm.faces.new((top[0], top[1], top[2], top[3]))
    # Four sides
    for i in range(4):
        j = (i + 1) % 4
        bm.faces.new((bot[i], bot[j], top[j], top[i]))


def glyph_stroke_to_project_xy_ccw(
    stroke: dict[str, Any],
    origin_u_mm: float,
    baseline_x_mm: float,
) -> list[tuple[float, float]]:
    """
    Maps glyph-local `(u, v)` coordinates onto the cover top pad in project `(X, Y)`:
      - Reading left-to-right (`+u`) maps to `+Y` (`y = origin_u_mm + u`).
      - Glyph baseline-to-cap (`+v`) maps to `-X` (`x = baseline_x_mm - v`), so standing in front
        of the engine bay (+X looking toward -X) reads `6.6` above `TURBO` above `DIESEL` upright.
    Note: det([[dx/du, dx/dv], [dy/du, dy/dv]]) = det([[0, -1], [1, 0]]) = +1, so CCW in (u, v)
    maps directly to CCW in project (X, Y).
    """
    if stroke["kind"] == "box":
        u0, u1 = float(stroke["u0"]), float(stroke["u1"])
        v0, v1 = float(stroke["v0"]), float(stroke["v1"])
        uv_ccw = [(u0, v0), (u1, v0), (u1, v1), (u0, v1)]
    elif stroke["kind"] == "seg":
        p0 = stroke["p0"]
        p1 = stroke["p1"]
        w = float(stroke["width"])
        du = float(p1[0]) - float(p0[0])
        dv = float(p1[1]) - float(p0[1])
        length = math.hypot(du, dv)
        assert length > 1e-6
        hw = 0.5 * w
        # Left normal of (du, dv) in (u, v) is (-dv/L, du/L)
        nu = -dv / length * hw
        nv = du / length * hw
        uv_ccw = [
            (float(p0[0]) - nu, float(p0[1]) - nv),
            (float(p1[0]) - nu, float(p1[1]) - nv),
            (float(p1[0]) + nu, float(p1[1]) + nv),
            (float(p0[0]) + nu, float(p0[1]) + nv),
        ]
    else:
        raise ValueError(f"Unsupported stroke kind: {stroke['kind']}")

    return [(baseline_x_mm - v, origin_u_mm + u) for (u, v) in uv_ccw]


def build_cover_lettering_object(
    cd: dict[str, Any],
    mat_letter: bpy.types.Material,
) -> bpy.types.Object:
    let_cfg = cd["lettering"]
    mesh_name = str(cd["contract"]["letteringMeshName"])
    legend: list[str] = list(let_cfg["legend"])
    z0 = float(let_cfg["padZMm"])
    z1 = float(let_cfg["topZMm"])
    cap_h = float(let_cfg["capHeightMm"])
    pitch = float(let_cfg["linePitchMm"])
    cx = float(let_cfg["blockCenterXMm"])
    cy = float(let_cfg["blockCenterYMm"])
    gap = float(let_cfg["glyphGapMm"])
    glyph_defs: dict[str, Any] = let_cfg["glyphs"]

    bm = bmesh.new()
    prism_footprints: list[list[tuple[float, float]]] = []

    line_count = len(legend)
    total_block_h = (line_count - 1) * pitch + cap_h
    # Top line (index 0 = "6.6") sits toward rear (-X); bottom line ("DIESEL") sits toward front (+X)
    first_line_top_x = cx - 0.5 * total_block_h

    for line_idx, line_text in enumerate(legend):
        line_top_x = first_line_top_x + line_idx * pitch
        baseline_x = line_top_x + cap_h
        widths = [float(glyph_defs[ch]["advanceWidthMm"]) for ch in line_text]
        line_w = sum(widths) + gap * max(0, len(line_text) - 1)
        cursor_y = cy - 0.5 * line_w

        for ch, gw in zip(line_text, widths):
            for stroke in glyph_defs[ch]["strokes"]:
                corners_xy = glyph_stroke_to_project_xy_ccw(stroke, cursor_y, baseline_x)
                prism_footprints.append(corners_xy)
                add_closed_quad_prism_xy_mm(bm, corners_xy, z0, z1)
            cursor_y += gw + gap

    expected_prisms = int(cd["contract"]["letteringExpectedComponents"])
    assert len(prism_footprints) == expected_prisms, (
        f"Expected {expected_prisms} stroke prisms, built {len(prism_footprints)}"
    )

    # Assert no two prisms share a corner within 0.20 mm (20x the 1e-5 m weld quantum)
    min_inter_prism_corner_mm = float("inf")
    for i in range(len(prism_footprints)):
        for j in range(i + 1, len(prism_footprints)):
            for ax, ay in prism_footprints[i]:
                for bx, by in prism_footprints[j]:
                    d = math.hypot(ax - bx, ay - by)
                    if d < min_inter_prism_corner_mm:
                        min_inter_prism_corner_mm = d
    assert min_inter_prism_corner_mm >= 0.20, (
        f"Inter-prism corner distance {min_inter_prism_corner_mm:.4f} mm too close; could weld strokes"
    )

    return finalize_mesh_object(mesh_name, bm, mat_letter, crease_deg=25.0)


def create_root_and_markers(
    cd: dict[str, Any],
    child_meshes: list[bpy.types.Object],
) -> bpy.types.Object:
    root_name = str(cd["contract"]["rootName"])
    root = bpy.data.objects.new(root_name, None)
    root.empty_display_type = "PLAIN_AXES"
    root.location = (0.0, 0.0, 0.0)
    bpy.context.collection.objects.link(root)

    for mesh_obj in child_meshes:
        mesh_obj.parent = root

    for key in ("rearBolt", "ductClamp"):
        m_cfg = cd["mounts"][key]
        m_name = str(m_cfg["markerName"])
        px, py, pz = (float(v) for v in m_cfg["positionMm"])
        emp = bpy.data.objects.new(m_name, None)
        emp.empty_display_type = "PLAIN_AXES"
        emp.location = v_m(px, py, pz)
        bpy.context.collection.objects.link(emp)
        emp.parent = root

    return root


def export_cover_glb(filepath: Path) -> None:
    filepath.parent.mkdir(parents=True, exist_ok=True)
    export_kwargs: dict[str, Any] = {
        "filepath": str(filepath),
        "check_existing": False,
        "export_format": "GLB",
        "use_selection": False,
        "export_yup": True,
        "export_apply": False,
        "export_extras": False,
        "export_texcoords": False,
        "export_normals": True,
        "export_animations": False,
        "export_materials": "EXPORT",
        "export_draco_mesh_compression_enable": False,
    }
    if bpy.app.version >= (5, 0, 0):
        export_kwargs["export_meshopt_compression_enable"] = False
    try:
        bpy.ops.export_scene.gltf(**export_kwargs)
    except TypeError:
        export_kwargs.pop("export_meshopt_compression_enable", None)
        export_kwargs.pop("export_texcoords", None)
        bpy.ops.export_scene.gltf(**export_kwargs)


# ---------------------------------------------------------------------------
# Binary GLB Read-Back, Watertightness / Component Audit & Clearance Verification
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


def parse_glb_binary(path: Path) -> tuple[int, str, dict[str, Any], bytes]:
    raw = path.read_bytes()
    sha256 = hashlib.sha256(raw).hexdigest()
    magic, version, total_len = struct.unpack_from("<III", raw, 0)
    assert magic == 0x46546C67 and version == 2 and total_len == len(raw), f"Invalid GLB header in {path}"
    offset = 12
    jb = bb = b""
    while offset < len(raw):
        cl, ct = struct.unpack_from("<II", raw, offset)
        offset += 8
        chunk = raw[offset : offset + cl]
        offset += cl
        if ct == 0x4E4F534A:
            jb = chunk
        elif ct == 0x004E4942:
            bb = chunk
    return len(raw), sha256, json.loads(jb.decode("utf-8")), bb


def read_accessor(doc: dict[str, Any], bin_bytes: bytes, acc_idx: int) -> np.ndarray:
    acc = doc["accessors"][acc_idx]
    bv = doc["bufferViews"][acc["bufferView"]]
    dtype = np.dtype(COMPONENT_DTYPE[acc["componentType"]]).newbyteorder("<")
    comp_n = TYPE_COUNT[acc["type"]]
    count = int(acc["count"])
    elem_size = dtype.itemsize * comp_n
    stride = int(bv.get("byteStride", elem_size))
    base_offset = int(bv.get("byteOffset", 0)) + int(acc.get("byteOffset", 0))
    if stride == elem_size:
        arr = np.frombuffer(bin_bytes, dtype=dtype, count=count * comp_n, offset=base_offset)
        return arr.reshape((count, comp_n)) if comp_n > 1 else arr
    out = np.empty((count, comp_n), dtype=dtype)
    for i in range(count):
        off = base_offset + i * stride
        out[i] = np.frombuffer(bin_bytes, dtype=dtype, count=comp_n, offset=off)
    return out if comp_n > 1 else out[:, 0]


def compute_world_mats(doc: dict[str, Any]) -> dict[int, np.ndarray]:
    nodes = doc.get("nodes", [])
    scene_idx = doc.get("scene", 0)
    roots = doc["scenes"][scene_idx]["nodes"]
    out: dict[int, np.ndarray] = {}

    def local_m(nd: dict[str, Any]) -> np.ndarray:
        if "matrix" in nd:
            return np.asarray(nd["matrix"], dtype=np.float64).reshape((4, 4)).T
        tx, ty, tz = nd.get("translation", [0.0, 0.0, 0.0])
        qx, qy, qz, qw = nd.get("rotation", [0.0, 0.0, 0.0, 1.0])
        sx, sy, sz = nd.get("scale", [1.0, 1.0, 1.0])
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

    def visit(idx: int, parent: np.ndarray) -> None:
        w = parent @ local_m(nodes[idx])
        out[idx] = w
        for ch in nodes[idx].get("children", []):
            visit(ch, w)

    for r in roots:
        visit(r, np.eye(4, dtype=np.float64))
    return out


def gltf_yup_m_to_proj_mm(pts_m: np.ndarray) -> np.ndarray:
    return np.stack([1000.0 * pts_m[:, 0], -1000.0 * pts_m[:, 2], 1000.0 * pts_m[:, 1]], axis=1)


def audit_watertight_and_components(
    verts_m: np.ndarray,
    tris_idx: np.ndarray,
    weld_quantum_m: float,
) -> tuple[int, int, int]:
    """
    Position-welds vertices at `weld_quantum_m` (1e-5 m) and returns:
      (boundary_edges, non_manifold_edges, connected_components)
    """
    quantized = np.round(verts_m / weld_quantum_m).astype(np.int64)
    vert_map: dict[tuple[int, int, int], int] = {}
    welded_ids = np.empty(len(verts_m), dtype=np.int64)
    next_id = 0
    for i, q in enumerate(quantized):
        key = (int(q[0]), int(q[1]), int(q[2]))
        vid = vert_map.get(key)
        if vid is None:
            vid = next_id
            vert_map[key] = vid
            next_id += 1
        welded_ids[i] = vid

    undirected_counts: dict[tuple[int, int], int] = {}
    adj: list[list[int]] = [[] for _ in range(next_id)]
    for t in tris_idx:
        a, b, c = int(welded_ids[t[0]]), int(welded_ids[t[1]]), int(welded_ids[t[2]])
        for u, w in ((a, b), (b, c), (c, a)):
            ek = (u, w) if u < w else (w, u)
            undirected_counts[ek] = undirected_counts.get(ek, 0) + 1
            adj[u].append(w)
            adj[w].append(u)

    boundary_edges = sum(1 for cnt in undirected_counts.values() if cnt == 1)
    non_manifold_edges = sum(1 for cnt in undirected_counts.values() if cnt > 2)

    visited = [False] * next_id
    components = 0
    for start in range(next_id):
        if visited[start] or not adj[start]:
            continue
        components += 1
        stack = [start]
        visited[start] = True
        while stack:
            cur = stack.pop()
            for nb in adj[cur]:
                if not visited[nb]:
                    visited[nb] = True
                    stack.append(nb)

    return boundary_edges, non_manifold_edges, components


def point_on_seg_2d(px: float, py: float, ax: float, ay: float, bx: float, by: float) -> float:
    dx, dy = bx - ax, by - ay
    l2 = dx * dx + dy * dy
    t = 0.0 if l2 == 0.0 else max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / l2))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))


def inside_planform_mm(x: float, y: float, planform: list[list[float]]) -> bool:
    n = len(planform)
    for i in range(n):
        ax, ay = planform[i]
        bx, by = planform[(i + 1) % n]
        if point_on_seg_2d(x, y, ax, ay, bx, by) <= 1e-9:
            return True
    inside = False
    j = n - 1
    for i in range(n):
        xi, yi = planform[i]
        xj, yj = planform[j]
        if (yi > y) != (yj > y) and x < ((xj - xi) * (y - yi)) / (yj - yi) + xi:
            inside = not inside
        j = i
    return inside


def dist_to_envelope_mm(
    x: float,
    y: float,
    z: float,
    planform: list[list[float]],
    z_min: float,
    z_max: float,
) -> float:
    in_xy = inside_planform_mm(x, y, planform)
    dxy = 0.0
    if not in_xy:
        dxy = min(
            point_on_seg_2d(x, y, planform[i][0], planform[i][1], planform[(i + 1) % len(planform)][0], planform[(i + 1) % len(planform)][1])
            for i in range(len(planform))
        )
    dz = (z_min - z) if z < z_min else ((z - z_max) if z > z_max else 0.0)
    if in_xy and dz == 0.0:
        return 0.0
    return math.hypot(dxy, dz)


def verify_and_log_exported_cover(
    out_path: Path,
    cd: dict[str, Any],
    shell_path: Path,
    vd_path: Path,
) -> None:
    byte_len, sha256, doc, bb = parse_glb_binary(out_path)
    contract = cd["contract"]
    env = cd["envelopeMm"]
    shell_cfg = cd["shell"]

    assert byte_len <= int(contract["maxFileBytes"]), (
        f"GLB size {byte_len} B exceeds cap {contract['maxFileBytes']} B"
    )
    assert len(doc.get("images", [])) == 0, "Unexpected images in cover GLB"
    assert len(doc.get("textures", [])) == 0, "Unexpected textures in cover GLB"
    assert len(doc.get("animations", [])) == 0, "Unexpected animations in cover GLB"
    assert len(doc.get("skins", [])) == 0, "Unexpected skins in cover GLB"

    nodes = doc.get("nodes", [])
    meshes = doc.get("meshes", [])
    materials = doc.get("materials", [])
    world_mats = compute_world_mats(doc)

    # Forbid DURAMAX anywhere in node/mesh/material names
    for kind, coll in (("node", nodes), ("mesh", meshes), ("material", materials)):
        for item in coll:
            nm = str(item.get("name", ""))
            assert "duramax" not in nm.lower(), f"Forbidden wordmark in {kind} name: {nm}"

    scene_roots = doc["scenes"][doc.get("scene", 0)]["nodes"]
    assert len(scene_roots) == 1, f"Expected 1 root Group node, got {len(scene_roots)}"
    root_idx = scene_roots[0]
    root_node = nodes[root_idx]
    assert root_node.get("name") == contract["rootName"], f"Root name mismatch: {root_node.get('name')}"
    assert "mesh" not in root_node, "Root node must be a Group without a mesh"

    child_indices = root_node.get("children", [])
    child_by_name = {nodes[i]["name"]: i for i in child_indices}
    expected_children = {
        contract["bodyMeshName"],
        contract["letteringMeshName"],
        cd["mounts"]["rearBolt"]["markerName"],
        cd["mounts"]["ductClamp"]["markerName"],
    }
    assert set(child_by_name.keys()) == expected_children, (
        f"Unexpected root children: {set(child_by_name.keys())} != {expected_children}"
    )

    assert len(materials) == 2, f"Expected 2 materials, got {len(materials)}"
    mat_by_name = {m["name"]: m for m in materials}
    for m_name, m_spec in cd["materials"].items():
        assert m_name in mat_by_name, f"Missing material {m_name}"
        gm = mat_by_name[m_name]
        assert gm.get("doubleSided") is True, f"Material {m_name} must be doubleSided"
        pbr = gm.get("pbrMetallicRoughness", {})
        assert "baseColorTexture" not in pbr and "metallicRoughnessTexture" not in pbr
        assert "normalTexture" not in gm and "occlusionTexture" not in gm and "emissiveTexture" not in gm

    def extract_mesh_world(node_idx: int) -> tuple[np.ndarray, np.ndarray, int]:
        nd = nodes[node_idx]
        m = meshes[nd["mesh"]]
        assert "weights" not in m
        wm = world_mats[node_idx]
        pts_list: list[np.ndarray] = []
        tris_list: list[np.ndarray] = []
        v_offset = 0
        tri_total = 0
        for prim in m["primitives"]:
            assert prim.get("mode", 4) == 4, "Expected TRIANGLES mode=4"
            assert "targets" not in prim, "Unexpected morph targets"
            attrs = set(prim["attributes"].keys())
            assert attrs == {"POSITION", "NORMAL"}, f"Expected POSITION+NORMAL only, got {attrs}"
            assert "indices" in prim, "Expected indexed geometry"
            pos_local = read_accessor(doc, bb, prim["attributes"]["POSITION"]).astype(np.float64)
            idx_raw = read_accessor(doc, bb, prim["indices"]).astype(np.int64).reshape((-1, 3))
            ones = np.ones((len(pos_local), 1), dtype=np.float64)
            pos_world_m = (np.hstack([pos_local, ones]) @ wm.T)[:, :3]
            pts_list.append(pos_world_m)
            tris_list.append(idx_raw + v_offset)
            v_offset += len(pos_local)
            tri_total += len(idx_raw)
        return np.vstack(pts_list), np.vstack(tris_list), tri_total

    body_m, body_tris_idx, body_tris = extract_mesh_world(child_by_name[contract["bodyMeshName"]])
    let_m, let_tris_idx, let_tris = extract_mesh_world(child_by_name[contract["letteringMeshName"]])
    total_tris = body_tris + let_tris

    assert body_tris <= int(contract["bodyTriangleCap"]), f"Body tris {body_tris} > {contract['bodyTriangleCap']}"
    assert let_tris == int(contract["letteringExpectedTriangles"]), (
        f"Lettering tris {let_tris} != {contract['letteringExpectedTriangles']}"
    )
    assert let_tris <= int(contract["letteringTriangleCap"])
    assert total_tris <= int(contract["totalTriangleCap"])

    weld_q = float(contract["weldQuantumM"])
    body_bnd, body_nm, body_comp = audit_watertight_and_components(body_m, body_tris_idx, weld_q)
    let_bnd, let_nm, let_comp = audit_watertight_and_components(let_m, let_tris_idx, weld_q)
    assert body_bnd == 0 and body_nm == 0, f"Body not manifold watertight: bnd={body_bnd}, nm={body_nm}"
    assert body_comp == int(contract["bodyExpectedComponents"]), (
        f"Body components {body_comp} != {contract['bodyExpectedComponents']}"
    )
    assert let_bnd == 0 and let_nm == 0, f"Lettering not manifold watertight: bnd={let_bnd}, nm={let_nm}"
    assert let_comp == int(contract["letteringExpectedComponents"]), (
        f"Lettering components {let_comp} != {contract['letteringExpectedComponents']}"
    )

    body_mm = gltf_yup_m_to_proj_mm(body_m)
    let_mm = gltf_yup_m_to_proj_mm(let_m)
    all_mm = np.vstack([body_mm, let_mm])
    mn = all_mm.min(axis=0)
    mx = all_mm.max(axis=0)
    assert mn[0] >= env["xMin"] - 1e-3 and mx[0] <= env["xMax"] + 1e-3
    assert mn[1] >= env["yMin"] - 1e-3 and mx[1] <= env["yMax"] + 1e-3
    assert mn[2] >= env["zMin"] - 1e-3 and mx[2] <= env["zMax"] + 1e-3

    # Deck / mount Z checks
    shell_rim_mask = body_mm[:, 2] > 365.0
    rim_z = float(body_mm[shell_rim_mask, 2].min())
    body_top_z = float(body_mm[:, 2].max())
    let_top_z = float(let_mm[:, 2].max())
    rear_bot_z = float(body_mm[body_mm[:, 0] < 300.0, 2].min())
    front_bot_z = float(body_mm[(body_mm[:, 0] > 340.0) & (body_mm[:, 2] < 365.0), 2].min())
    assert abs(rim_z - 370.0) <= 0.1
    assert abs(body_top_z - 417.2) <= 0.1
    assert abs(let_top_z - 418.0) <= 0.1
    assert abs(rear_bot_z - 333.4) <= 0.1
    assert abs(front_bot_z - 353.4) <= 0.1

    # Marker checks (translation + identity rotation)
    marker_logs: list[str] = []
    for key in ("rearBolt", "ductClamp"):
        m_cfg = cd["mounts"][key]
        m_name = m_cfg["markerName"]
        m_idx = child_by_name[m_name]
        m_node = nodes[m_idx]
        assert "mesh" not in m_node
        rot = m_node.get("rotation", [0.0, 0.0, 0.0, 1.0])
        assert max(abs(rot[0]), abs(rot[1]), abs(rot[2]), abs(rot[3] - 1.0)) <= 1e-6, (
            f"Marker {m_name} must have identity rotation, got {rot}"
        )
        wm = world_mats[m_idx]
        g_pos = np.array([[wm[0, 3], wm[1, 3], wm[2, 3]]], dtype=np.float64)
        p_mm = gltf_yup_m_to_proj_mm(g_pos)[0]
        exp_mm = np.asarray(m_cfg["positionMm"], dtype=np.float64)
        dev = float(np.linalg.norm(p_mm - exp_mm))
        assert dev <= 0.5, f"Marker {m_name} dev {dev:.4f} mm > 0.5 mm"
        marker_logs.append(
            f"  {m_name:28s}: glb_mm=({p_mm[0]:.3f}, {p_mm[1]:.3f}, {p_mm[2]:.3f})  dev={dev:.4f} mm <= 0.5 mm (PASS)"
        )

    # Shell + V2 clearance audit
    _, shell_sha, s_doc, s_bb = parse_glb_binary(shell_path)
    s_world = compute_world_mats(s_doc)
    s_nodes = s_doc.get("nodes", [])
    s_meshes = s_doc.get("meshes", [])
    pf = shell_cfg["planformMm"]
    inside_shell = 0
    group_clr: dict[str, float] = {}
    for r_idx in s_doc["scenes"][s_doc.get("scene", 0)]["nodes"]:
        gname = s_nodes[r_idx]["name"]
        best = float("inf")
        stk = [r_idx]
        while stk:
            ni = stk.pop()
            nd = s_nodes[ni]
            stk.extend(nd.get("children", []))
            if "mesh" not in nd:
                continue
            wm = s_world[ni]
            for prim in s_meshes[nd["mesh"]]["primitives"]:
                pos_l = read_accessor(s_doc, s_bb, prim["attributes"]["POSITION"]).astype(np.float64)
                pts_w = (np.hstack([pos_l, np.ones((len(pos_l), 1))]) @ wm.T)[:, :3]
                pts_mm = gltf_yup_m_to_proj_mm(pts_w)
                for px, py, pz in pts_mm:
                    d = dist_to_envelope_mm(float(px), float(py), float(pz), pf, 370.0, 417.2)
                    if d == 0.0:
                        inside_shell += 1
                    if d < best:
                        best = d
        group_clr[gname] = best

    assert inside_shell == 0, f"Shell vertices inside cover envelope: {inside_shell}"
    assert group_clr["chargePipeCold"] >= 5.0
    assert group_clr["alternator"] >= 8.0
    assert group_clr["acComp"] >= 8.0
    assert group_clr["resonator"] >= 8.5
    assert group_clr["intakeBridge"] >= 18.0
    assert group_clr["electronics"] >= 25.9
    assert group_clr["intake"] >= 48.0
    assert group_clr["cp3Fuel"] >= 67.0

    vd = json.loads(vd_path.read_text(encoding="utf-8"))
    v2_pts = [[float(vd[f"intakePathP{k}XMm"]), float(vd[f"intakePathP{k}YMm"]), float(vd[f"intakePathP{k}ZMm"])] for k in range(9)]
    min_v2_center = float("inf")
    for seg in range(len(v2_pts) - 1):
        a, b = v2_pts[seg], v2_pts[seg + 1]
        for i in range(4001):
            t = i / 4000.0
            d = dist_to_envelope_mm(
                a[0] + (b[0] - a[0]) * t,
                a[1] + (b[1] - a[1]) * t,
                a[2] + (b[2] - a[2]) * t,
                pf,
                370.0,
                417.2,
            )
            if d < min_v2_center:
                min_v2_center = d
    v2_r58 = min_v2_center - 58.0
    v2_r508 = min_v2_center - 50.8
    assert v2_r58 >= 6.0 and v2_r508 >= 13.0

    print("\n" + "=" * 96)
    print("M12 INTAKE COVER BUILD — LOGGED ASSERTION BLOCK (BINARY GLB READ-BACK)")
    print("=" * 96)
    print(f"Output GLB         : {out_path}")
    print(f"File Size          : {byte_len} B / {contract['maxFileBytes']} B cap ({byte_len / 1024.0:.2f} KiB, PASS)")
    print(f"SHA-256            : {sha256}")
    print(f"Frozen Shell SHA   : {shell_sha}")
    print(f"Triangles          : body={body_tris}/{contract['bodyTriangleCap']}  lettering={let_tris}/{contract['letteringTriangleCap']} (exact 540)  total={total_tris}/{contract['totalTriangleCap']} (PASS)")
    print(f"Materials / Calls  : {len(materials)} untextured DoubleSide MeshStandardMaterials (+2 draw calls, 0 textures/UVs, PASS)")
    print(f"Watertight @ 1e-5m : body boundary_edges={body_bnd} non_manifold={body_nm} components={body_comp}/3 (PASS)")
    print(f"                     lettering boundary_edges={let_bnd} non_manifold={let_nm} components={let_comp}/45 (PASS)")
    print(f"Project Bounds (mm): X[{mn[0]:.2f}, {mx[0]:.2f}]  Y[{mn[1]:.2f}, {mx[1]:.2f}]  Z[{mn[2]:.2f}, {mx[2]:.2f}] (PASS)")
    print(f"Deck & Mount Z (mm): rim={rim_z:.2f}  pad_top={body_top_z:.2f}  letter_top={let_top_z:.2f}  rear_bot={rear_bot_z:.2f}  front_bot={front_bot_z:.2f} (PASS)")
    print("Markers:")
    for row in marker_logs:
        print(row)
    print(
        f"Shell Clearance    : inside={inside_shell}  chargePipeCold={group_clr['chargePipeCold']:.3f}  "
        f"alternator={group_clr['alternator']:.3f}  acComp={group_clr['acComp']:.3f}  "
        f"resonator={group_clr['resonator']:.3f}  intakeBridge={group_clr['intakeBridge']:.3f}  "
        f"electronics={group_clr['electronics']:.3f}  intake={group_clr['intake']:.3f}  cp3Fuel={group_clr['cp3Fuel']:.3f} (PASS)"
    )
    print(f"V2 Tube Clearance  : r58={v2_r58:.3f} mm (>=6.0)  r50.8={v2_r508:.3f} mm (>=13.0) (PASS)")
    print("=" * 96 + "\n")


def main() -> None:
    args = parse_args()
    cd_path = Path(args.cover_dimensions).resolve()
    out_path = Path(args.out).resolve()
    shell_path = Path(args.shell).resolve()
    vd_path = Path(args.variant_dimensions).resolve()

    cd: dict[str, Any] = json.loads(cd_path.read_text(encoding="utf-8"))

    reset_scene()
    mats = build_materials(cd["materials"])
    body_obj = build_cover_body_object(cd, mats["mat_cover_plastic"])
    let_obj = build_cover_lettering_object(cd, mats["mat_cover_letter"])
    create_root_and_markers(cd, [body_obj, let_obj])
    export_cover_glb(out_path)
    verify_and_log_exported_cover(out_path, cd, shell_path, vd_path)


if __name__ == "__main__":
    try:
        main()
    except Exception:
        import traceback

        traceback.print_exc()
        sys.exit(1)
