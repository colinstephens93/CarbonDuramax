"""
Headless Blender 5.2 build script for Milestone 13 part-local forged connecting-rod
visual variant GLB (rods_forged -> public/models/variants/rot_conrod_c1_forged.glb).

Usage:
  blender --background --factory-startup --python assets-src/blender/build_rod_variant.py

Normative contract (docs/specs/M13-internal-variants.md §§4, 9, 16.2):
- Reads stock interface inputs (rodLengthMm, pinJournalDiameterMm, wristPinDiameterMm,
  rodSeatOffsetMm, boreMm, pistonSkirtClearanceMm) from assets-src/dimensions.json and
  variant shank/fastener parameters from assets-src/rod_variant_dimensions.json.
- Note: assets-src/dimensions.json has no width/flange/web keys; big-end axial width
  (27.676 mm = 2 * 0.22 * 62.9) and outer radii follow the stock conrod model
  (assets-src/blender/build_cylinder1.py / public/models/rot_conrod_c1_stock.glb).
- Authors in the part-local frame (+X crank axis, +Y bank-plane W, +Z bore axis from
  big-end bore pivot at (0,0,0) to small-end bore at (0,0,163.0) mm), exported Y-up
  (export_yup=True) with POSITION + NORMAL indexed triangles only (zero textures,
  images, UVs, skins, morphs, animations, or if_* markers).
- Runs a full binary GLB read-back verification asserting file size (<= 49,152 B),
  triangle cap (<= 1,400), hierarchy/pivot, stock interface agreement against
  rot_conrod_c1_stock.glb, independent vertex-band extraction of the four visible
  signature dimensions (30.343 / 18.568 / 8.177 / 5.258 mm), 3 materials, and
  watertightness (0 boundary edges at 1e-5 m, 10 closed components).
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

MM_TO_M = 1e-3


def parse_args() -> argparse.Namespace:
    argv = sys.argv
    script_args = argv[argv.index("--") + 1 :] if "--" in argv else []
    parser = argparse.ArgumentParser(description="Build Milestone 13 forged connecting-rod variant GLB.")
    parser.add_argument(
        "--out",
        default=str(REPO_ROOT / "public" / "models" / "variants" / "rot_conrod_c1_forged.glb"),
        help="Output path for rot_conrod_c1_forged.glb.",
    )
    parser.add_argument(
        "--dimensions",
        default=str(REPO_ROOT / "assets-src" / "dimensions.json"),
        help="Path to frozen assets-src/dimensions.json (interface inputs).",
    )
    parser.add_argument(
        "--rod-variant-dimensions",
        default=str(REPO_ROOT / "assets-src" / "rod_variant_dimensions.json"),
        help="Path to assets-src/rod_variant_dimensions.json.",
    )
    parser.add_argument(
        "--stock-rod-glb",
        default=str(REPO_ROOT / "public" / "models" / "rot_conrod_c1_stock.glb"),
        help="Path to frozen stock rot_conrod_c1_stock.glb for interface cross-check.",
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


def make_pbr_material(
    name: str,
    base_color: tuple[float, float, float, float],
    metallic: float,
    roughness: float,
) -> bpy.types.Material:
    mat = bpy.data.materials.new(name=name)
    if mat.node_tree is None:
        mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf is None:
        bsdf = mat.node_tree.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = base_color
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    return mat


def finalize_bmesh_object(
    name: str,
    bm: bmesh.types.BMesh,
    materials: list[bpy.types.Material],
    smooth_angle_deg: float = 38.0,
    sharp_edge_set: set[bmesh.types.BMEdge] | None = None,
) -> bpy.types.Object:
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])

    cos_thresh = math.cos(math.radians(smooth_angle_deg))
    for face in bm.faces:
        face.smooth = True
    for edge in bm.edges:
        if sharp_edge_set and edge in sharp_edge_set:
            edge.smooth = False
        elif len(edge.link_faces) == 2:
            n0 = edge.link_faces[0].normal
            n1 = edge.link_faces[1].normal
            if n0.length > 1e-9 and n1.length > 1e-9 and n0.dot(n1) < cos_thresh:
                edge.smooth = False
            else:
                edge.smooth = True
        else:
            edge.smooth = False

    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()

    for mat in materials:
        mesh.materials.append(mat)

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return obj


def add_revolved_profile(
    bm: bmesh.types.BMesh,
    profile_rz: list[tuple[float, float]],
    segments: int = 48,
    axis: str = "Z",
    center: Vector = Vector((0.0, 0.0, 0.0)),
    mat_index: int = 0,
    close_loop: bool = False,
    faceted_band_indices: set[int] | None = None,
    sharp_edges_out: set[bmesh.types.BMEdge] | None = None,
) -> None:
    rings: list[list[bmesh.types.BMVert]] = []

    for r, h in profile_rz:
        if r <= 1e-9:
            if axis == "Z":
                pt = center + Vector((0.0, 0.0, h))
            elif axis == "X":
                pt = center + Vector((h, 0.0, 0.0))
            else:
                pt = center + Vector((0.0, h, 0.0))
            rings.append([bm.verts.new(pt)])
        else:
            ring_verts: list[bmesh.types.BMVert] = []
            for i in range(segments):
                ang = (2.0 * math.pi * i) / segments
                ca = math.cos(ang)
                sa = math.sin(ang)
                if axis == "Z":
                    pt = center + Vector((r * ca, r * sa, h))
                elif axis == "X":
                    pt = center + Vector((h, r * ca, r * sa))
                else:
                    pt = center + Vector((r * ca, h, r * sa))
                ring_verts.append(bm.verts.new(pt))
            rings.append(ring_verts)

    pair_count = len(rings) if close_loop else len(rings) - 1
    for idx in range(pair_count):
        r0 = rings[idx]
        r1 = rings[(idx + 1) % len(rings)]
        if len(r0) == 1 and len(r1) == 1:
            continue
        if len(r0) == 1:
            pole = r0[0]
            for i in range(segments):
                v_a = r1[i]
                v_b = r1[(i + 1) % segments]
                f = bm.faces.new((pole, v_a, v_b))
                f.material_index = mat_index
        elif len(r1) == 1:
            pole = r1[0]
            for i in range(segments):
                v_a = r0[i]
                v_b = r0[(i + 1) % segments]
                f = bm.faces.new((v_a, pole, v_b))
                f.material_index = mat_index
        else:
            band_faces: list[bmesh.types.BMFace] = []
            for i in range(segments):
                i_next = (i + 1) % segments
                f = bm.faces.new((r0[i], r0[i_next], r1[i_next], r1[i]))
                f.material_index = mat_index
                band_faces.append(f)
            if faceted_band_indices and idx in faceted_band_indices and sharp_edges_out is not None:
                for f in band_faces:
                    for e in f.edges:
                        sharp_edges_out.add(e)


def add_tube_along_axis(
    bm: bmesh.types.BMesh,
    r_inner: float,
    r_outer: float,
    h0: float,
    h1: float,
    segments: int = 36,
    axis: str = "Z",
    center: Vector = Vector((0.0, 0.0, 0.0)),
    mat_index: int = 0,
) -> None:
    profile = [
        (r_inner, h0),
        (r_outer, h0),
        (r_outer, h1),
        (r_inner, h1),
    ]
    add_revolved_profile(
        bm,
        profile,
        segments=segments,
        axis=axis,
        center=center,
        mat_index=mat_index,
        close_loop=True,
    )


def add_box(
    bm: bmesh.types.BMesh,
    min_pt: tuple[float, float, float],
    max_pt: tuple[float, float, float],
    mat_index: int = 0,
) -> None:
    x0, y0, z0 = min_pt
    x1, y1, z1 = max_pt
    coords = [
        Vector((x0, y0, z0)),
        Vector((x1, y0, z0)),
        Vector((x1, y1, z0)),
        Vector((x0, y1, z0)),
        Vector((x0, y0, z1)),
        Vector((x1, y0, z1)),
        Vector((x1, y1, z1)),
        Vector((x0, y1, z1)),
    ]
    v = [bm.verts.new(c) for c in coords]
    quads = [
        (0, 3, 2, 1),
        (4, 5, 6, 7),
        (0, 1, 5, 4),
        (1, 2, 6, 5),
        (2, 3, 7, 6),
        (3, 0, 4, 7),
    ]
    for q in quads:
        f = bm.faces.new((v[q[0]], v[q[1]], v[q[2]], v[q[3]]))
        f.material_index = mat_index


def add_extruded_polygon_x(
    bm: bmesh.types.BMesh,
    yz_loop: list[tuple[float, float]],
    x0: float,
    x1: float,
    mat_index: int = 0,
) -> None:
    n = len(yz_loop)
    v0 = [bm.verts.new((x0, y, z)) for (y, z) in yz_loop]
    v1 = [bm.verts.new((x1, y, z)) for (y, z) in yz_loop]

    f_neg = bm.faces.new(list(reversed(v0)))
    f_neg.material_index = mat_index
    f_pos = bm.faces.new(v1)
    f_pos.material_index = mat_index

    for i in range(n):
        j = (i + 1) % n
        f_side = bm.faces.new((v0[i], v0[j], v1[j], v1[i]))
        f_side.material_index = mat_index


def export_glb(filepath: Path, objects: list[bpy.types.Object]) -> None:
    filepath.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]

    export_kwargs: dict[str, object] = {
        "filepath": str(filepath),
        "check_existing": False,
        "export_format": "GLB",
        "use_selection": True,
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


def build_forged_rod(
    d: dict[str, float],
    rv: dict[str, Any],
    out_path: Path,
) -> None:
    reset_scene()

    contract = rv["contract"]
    ratios = rv["stockDerivedRatios"]
    shank = rv["shankPlaceholdersMm"]
    fastener = rv["fastenerPlaceholder"]
    mat_specs = rv["materials"]

    rod_len = float(d["rodLengthMm"]) * MM_TO_M
    big_r = 0.5 * float(d["pinJournalDiameterMm"]) * MM_TO_M
    small_r = 0.5 * float(d["wristPinDiameterMm"]) * MM_TO_M

    big_outer_r = float(ratios["bigEndOuterRadiusFactor"]) * big_r
    bush_thick = float(ratios["smallEndBushingThicknessFactor"]) * small_r
    small_bore_housing_r = small_r + bush_thick
    small_outer_r = float(ratios["smallEndOuterRadiusFactor"]) * small_r

    axial_half_w = float(ratios["bigEndAxialHalfWidthJournalFactor"]) * float(d["pinJournalDiameterMm"]) * MM_TO_M
    small_half_w = float(ratios["smallEndHalfWidthFactor"]) * axial_half_w

    mat_steel = make_pbr_material(
        "mat_conrod_forged_steel",
        tuple(float(x) for x in mat_specs["mat_conrod_forged_steel"]["baseColor"]),  # type: ignore[arg-type]
        float(mat_specs["mat_conrod_forged_steel"]["metallic"]),
        float(mat_specs["mat_conrod_forged_steel"]["roughness"]),
    )
    mat_bolt = make_pbr_material(
        "mat_conrod_bolts",
        tuple(float(x) for x in mat_specs["mat_conrod_bolts"]["baseColor"]),  # type: ignore[arg-type]
        float(mat_specs["mat_conrod_bolts"]["metallic"]),
        float(mat_specs["mat_conrod_bolts"]["roughness"]),
    )
    mat_bush = make_pbr_material(
        "mat_conrod_bushing",
        tuple(float(x) for x in mat_specs["mat_conrod_bushing"]["baseColor"]),  # type: ignore[arg-type]
        float(mat_specs["mat_conrod_bushing"]["metallic"]),
        float(mat_specs["mat_conrod_bushing"]["roughness"]),
    )

    bm = bmesh.new()
    sharp_edges: set[bmesh.types.BMEdge] = set()

    # 1. Big-end housing + split cap around X at (0, 0, 0) — stock interface preserved
    add_tube_along_axis(
        bm,
        big_r,
        big_outer_r,
        -axial_half_w,
        axial_half_w,
        segments=int(ratios["bigEndSegments"]),
        axis="X",
        center=Vector((0.0, 0.0, 0.0)),
        mat_index=0,
    )

    # 2. Small-end eye around X at (0, 0, rod_len) — stock interface preserved
    add_tube_along_axis(
        bm,
        small_bore_housing_r,
        small_outer_r,
        -small_half_w,
        small_half_w,
        segments=int(ratios["smallEndSegments"]),
        axis="X",
        center=Vector((0.0, 0.0, rod_len)),
        mat_index=0,
    )

    # 3. Heavier H-beam shank (labeled placeholder flange/web magnitudes)
    z_shank_0 = float(ratios["shankStartBigOuterFactor"]) * big_outer_r
    z_shank_1 = rod_len - float(ratios["shankEndSmallOuterFactor"]) * small_outer_r
    y_big_flange = float(shank["beamFlangeBigEndOuterYMm"]) * MM_TO_M
    y_small_flange = float(shank["beamFlangeSmallEndOuterYMm"]) * MM_TO_M
    flange_thick_y = float(shank["flangeThicknessYMm"]) * MM_TO_M
    web_half_x = float(shank["webHalfWidthXMm"]) * MM_TO_M
    flange_half_x = float(ratios["flangeHalfWidthAxialFactor"]) * axial_half_w

    web_yz = [
        (-y_big_flange + 0.5 * flange_thick_y, z_shank_0),
        (y_big_flange - 0.5 * flange_thick_y, z_shank_0),
        (y_small_flange - 0.5 * flange_thick_y, z_shank_1),
        (-y_small_flange + 0.5 * flange_thick_y, z_shank_1),
    ]
    add_extruded_polygon_x(bm, web_yz, -web_half_x, web_half_x, mat_index=0)

    for sign_y in (-1.0, 1.0):
        y0_in = sign_y * (y_big_flange - flange_thick_y)
        y0_out = sign_y * y_big_flange
        y1_in = sign_y * (y_small_flange - flange_thick_y)
        y1_out = sign_y * y_small_flange
        if sign_y > 0:
            loop = [
                (y0_in, z_shank_0),
                (y0_out, z_shank_0),
                (y1_out, z_shank_1),
                (y1_in, z_shank_1),
            ]
        else:
            loop = [
                (y0_out, z_shank_0),
                (y0_in, z_shank_0),
                (y1_in, z_shank_1),
                (y1_out, z_shank_1),
            ]
        add_extruded_polygon_x(bm, loop, -flange_half_x, flange_half_x, mat_index=0)

    # 4. Big-end bolt ears (stock envelope preserved) & stepped 12-point cap fasteners (placeholder)
    bolt_y = big_r + 0.52 * (big_outer_r - big_r) + 0.14 * big_r
    ear_half_w = float(ratios["boltEarHalfWidthAxialFactor"]) * axial_half_w
    bolt_r = float(ratios["boltRadiusBigBoreFactor"]) * big_r
    ear_half_y = float(ratios["boltEarHalfYBoltRadiusFactor"]) * bolt_r
    ear_z_min = float(ratios["boltEarZMinBigOuterFactor"]) * big_outer_r
    ear_z_max = float(ratios["boltEarZMaxBigOuterFactor"]) * big_outer_r

    r_pilot = float(fastener["pilotRadiusBoltFactor"]) * bolt_r
    r_wrench = float(fastener["wrenchHeadRadiusBoltFactor"]) * bolt_r
    r_washer = float(fastener["washerFlangeRadiusBoltFactor"]) * bolt_r
    z_tip = float(fastener["zTipBigOuterFactor"]) * big_outer_r
    z_pilot_step = float(fastener["zPilotStepBigOuterFactor"]) * big_outer_r
    z_washer_bot = float(fastener["zWasherBotBigOuterFactor"]) * big_outer_r
    z_seat = float(fastener["zSeatBigOuterFactor"]) * big_outer_r
    z_shank_top = float(fastener["zShankTopBigOuterFactor"]) * big_outer_r
    bolt_segments = int(fastener["segments"])

    for sign_y in (-1.0, 1.0):
        cy = sign_y * bolt_y
        add_box(
            bm,
            (-ear_half_w, cy - ear_half_y, ear_z_min),
            (ear_half_w, cy + ear_half_y, ear_z_max),
            mat_index=0,
        )
        # Stepped 12-sided head (faceted pilot + 12-sided wrenching collar + integral washer flange + shank)
        bolt_profile = [
            (0.0, z_tip),
            (r_pilot, z_tip),
            (r_pilot, z_pilot_step),
            (r_wrench, z_pilot_step),
            (r_wrench, z_washer_bot),
            (r_washer, z_washer_bot),
            (r_washer, z_seat),
            (bolt_r, z_seat),
            (bolt_r, z_shank_top),
            (0.0, z_shank_top),
        ]
        # Facet bands 1 (pilot cylinder) and 3 (12-sided wrenching head) so the 12 wrenching flats read crisply
        add_revolved_profile(
            bm,
            bolt_profile,
            segments=bolt_segments,
            axis="Z",
            center=Vector((0.0, cy, 0.0)),
            mat_index=1,
            faceted_band_indices={1, 3},
            sharp_edges_out=sharp_edges,
        )

    rod_obj = finalize_bmesh_object(
        str(contract["rootName"]),
        bm,
        [mat_steel, mat_bolt],
        smooth_angle_deg=38.0,
        sharp_edge_set=sharp_edges,
    )

    # 5. Child node rot_conrod_smallend_c1_forged at exact (0, 0, rod_len)
    bm_small = bmesh.new()
    bush_half_w = small_half_w * float(ratios["smallEndBushingWidthFactor"])
    add_tube_along_axis(
        bm_small,
        small_r,
        small_bore_housing_r,
        -bush_half_w,
        bush_half_w,
        segments=int(ratios["smallEndSegments"]),
        axis="X",
        center=Vector((0.0, 0.0, 0.0)),
        mat_index=0,
    )
    small_obj = finalize_bmesh_object(str(contract["smallEndName"]), bm_small, [mat_bush])
    small_obj.parent = rod_obj
    small_obj.matrix_parent_inverse.identity()
    small_obj.location = (0.0, 0.0, rod_len)

    export_glb(out_path, [rod_obj, small_obj])


# ---------------------------------------------------------------------------
# Binary GLB Read-Back, Signature Extraction, Watertightness & Interface Audit
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


def quat_to_mat3(q: list[float]) -> np.ndarray:
    x, y, z, w = q
    return np.array(
        [
            [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
            [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
            [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)],
        ],
        dtype=np.float64,
    )


def node_local_matrix(node: dict[str, Any]) -> np.ndarray:
    if "matrix" in node:
        return np.array(node["matrix"], dtype=np.float64).reshape((4, 4)).T
    t = np.array(node.get("translation", [0.0, 0.0, 0.0]), dtype=np.float64)
    r = quat_to_mat3(node.get("rotation", [0.0, 0.0, 0.0, 1.0]))
    s = np.array(node.get("scale", [1.0, 1.0, 1.0]), dtype=np.float64)
    m = np.eye(4, dtype=np.float64)
    m[:3, :3] = r @ np.diag(s)
    m[:3, 3] = t
    return m


def compute_world_matrices(doc: dict[str, Any]) -> dict[int, np.ndarray]:
    nodes = doc.get("nodes", [])
    world: dict[int, np.ndarray] = {}

    def visit(idx: int, parent: np.ndarray) -> None:
        cur = parent @ node_local_matrix(nodes[idx])
        world[idx] = cur
        for c in nodes[idx].get("children", []):
            visit(c, cur)

    scene_idx = doc.get("scene", 0)
    for root_idx in doc["scenes"][scene_idx]["nodes"]:
        visit(root_idx, np.eye(4, dtype=np.float64))
    return world


def gltf_yup_m_to_part_local_mm(pts_gltf_m: np.ndarray) -> np.ndarray:
    """
    Converts glTF Y-up metres (g_x, g_y, g_z) to part-local millimetres (x, y, z)
    via wrapInPartLocalFrame (+90 deg around +X): (x, y, z) = 1000 * (g_x, -g_z, g_y).
    """
    out = np.empty_like(pts_gltf_m, dtype=np.float64)
    out[:, 0] = pts_gltf_m[:, 0] * 1000.0
    out[:, 1] = -pts_gltf_m[:, 2] * 1000.0
    out[:, 2] = pts_gltf_m[:, 1] * 1000.0
    return out


def extract_all_meshes_part_local_mm(
    doc: dict[str, Any],
    bin_bytes: bytes,
) -> tuple[np.ndarray, np.ndarray, int]:
    world = compute_world_matrices(doc)
    all_verts_gltf: list[np.ndarray] = []
    all_tris: list[np.ndarray] = []
    v_offset = 0
    prim_count = 0

    for node_idx, w_mat in sorted(world.items()):
        node = doc["nodes"][node_idx]
        if "mesh" not in node:
            continue
        mesh = doc["meshes"][node["mesh"]]
        for prim in mesh["primitives"]:
            prim_count += 1
            mode = prim.get("mode", 4)
            assert mode == 4, f"Expected TRIANGLES mode=4, got {mode}"
            attrs = prim["attributes"]
            assert set(attrs.keys()) == {"POSITION", "NORMAL"}, f"Unexpected attributes {attrs.keys()}"
            assert "indices" in prim, "Primitive must be indexed"
            pos = read_accessor(doc, bin_bytes, attrs["POSITION"]).astype(np.float64)
            idx = read_accessor(doc, bin_bytes, prim["indices"]).astype(np.int64).reshape((-1, 3))
            hom = np.hstack([pos, np.ones((len(pos), 1), dtype=np.float64)])
            pos_world_m = (hom @ w_mat.T)[:, :3]
            all_verts_gltf.append(pos_world_m)
            all_tris.append(idx + v_offset)
            v_offset += len(pos_world_m)

    verts_gltf_m = np.vstack(all_verts_gltf)
    tris = np.vstack(all_tris)
    return verts_gltf_m, gltf_yup_m_to_part_local_mm(verts_gltf_m), tris, prim_count  # type: ignore[return-value]


def audit_watertight_and_components(
    verts_m: np.ndarray,
    tris: np.ndarray,
    quantum_m: float = 1e-5,
) -> tuple[int, int, int]:
    quantized = np.round(verts_m / quantum_m).astype(np.int64)
    _, welded_idx = np.unique(quantized, axis=0, return_inverse=True)
    w_tris = welded_idx[tris]

    edge_counts: dict[tuple[int, int], int] = {}
    vert_to_tris: dict[int, list[int]] = {}
    for t_i, (a, b, c) in enumerate(w_tris):
        if a == b or b == c or c == a:
            continue
        for u, v in ((a, b), (b, c), (c, a)):
            key = (int(min(u, v)), int(max(u, v)))
            edge_counts[key] = edge_counts.get(key, 0) + 1
        for vx in (int(a), int(b), int(c)):
            vert_to_tris.setdefault(vx, []).append(t_i)

    boundary_edges = sum(1 for c in edge_counts.values() if c == 1)
    non_manifold_edges = sum(1 for c in edge_counts.values() if c > 2)

    visited = [False] * len(w_tris)
    components = 0
    for start in range(len(w_tris)):
        if visited[start]:
            continue
        a0, b0, c0 = w_tris[start]
        if a0 == b0 or b0 == c0 or c0 == a0:
            visited[start] = True
            continue
        components += 1
        stack = [start]
        visited[start] = True
        while stack:
            cur = stack.pop()
            for vx in w_tris[cur]:
                for nb in vert_to_tris.get(int(vx), ()):
                    if not visited[nb]:
                        visited[nb] = True
                        stack.append(nb)

    return boundary_edges, non_manifold_edges, components


def extract_rod_signature_and_interface_mm(
    pts_mm: np.ndarray,
) -> dict[str, float]:
    # 1. Big-end bore radius (vertices near Z=0, Y^2+Z^2 in [20^2, 36^2], |X| > 13.0)
    big_bore_mask = (np.abs(pts_mm[:, 0]) > 13.0) & (pts_mm[:, 2] < 36.0) & (pts_mm[:, 2] > -36.0)
    big_radii = np.hypot(pts_mm[big_bore_mask, 1], pts_mm[big_bore_mask, 2])
    big_journal_diam_mm = 2.0 * float(np.min(big_radii))
    big_axial_width_mm = float(np.max(pts_mm[:, 0]) - np.min(pts_mm[:, 0]))

    # 2. Small-end bore diameter around Z = 163.0 mm (bushing inner bore)
    small_mask = pts_mm[:, 2] > 144.5
    small_radii = np.hypot(pts_mm[small_mask, 1], pts_mm[small_mask, 2] - 163.0)
    wrist_pin_diam_mm = 2.0 * float(np.min(small_radii))

    # 3. Shank flange vertices: isolated in Z in [36.0, 144.2] mm and |X| in [9.5, 11.5] mm
    flange_pos_y = pts_mm[
        (pts_mm[:, 2] >= 36.0)
        & (pts_mm[:, 2] <= 144.2)
        & (np.abs(pts_mm[:, 0]) >= 9.5)
        & (np.abs(pts_mm[:, 0]) <= 11.5)
        & (pts_mm[:, 1] > 0.0)
    ]
    assert len(flange_pos_y) >= 8, f"Failed to isolate shank flange vertices (found {len(flange_pos_y)})"
    z_min_shank = float(np.min(flange_pos_y[:, 2]))
    z_max_shank = float(np.max(flange_pos_y[:, 2]))

    big_end_band = flange_pos_y[np.abs(flange_pos_y[:, 2] - z_min_shank) < 0.5]
    small_end_band = flange_pos_y[np.abs(flange_pos_y[:, 2] - z_max_shank) < 0.5]
    assert len(big_end_band) >= 4 and len(small_end_band) >= 4

    flange_big_y_out = float(np.max(big_end_band[:, 1]))
    flange_big_y_in = float(np.min(big_end_band[:, 1]))
    flange_small_y_out = float(np.max(small_end_band[:, 1]))
    flange_small_y_in = float(np.min(small_end_band[:, 1]))
    flange_thickness_big = flange_big_y_out - flange_big_y_in
    flange_thickness_small = flange_small_y_out - flange_small_y_in
    assert abs(flange_thickness_big - flange_thickness_small) < 0.02
    flange_thickness_mm = 0.5 * (flange_thickness_big + flange_thickness_small)

    # 4. Central web half-width: isolated in Z in [36.0, 144.2] mm and |X| < 9.0 mm
    web_pts = pts_mm[
        (pts_mm[:, 2] >= 36.0)
        & (pts_mm[:, 2] <= 144.2)
        & (np.abs(pts_mm[:, 0]) < 9.0)
    ]
    assert len(web_pts) >= 8, f"Failed to isolate central web vertices (found {len(web_pts)})"
    web_half_x_mm = float(np.max(np.abs(web_pts[:, 0])))

    return {
        "bigJournalDiamMm": big_journal_diam_mm,
        "wristPinDiamMm": wrist_pin_diam_mm,
        "bigAxialWidthMm": big_axial_width_mm,
        "beamFlangeBigOuterYMm": flange_big_y_out,
        "beamFlangeSmallOuterYMm": flange_small_y_out,
        "flangeThicknessYMm": flange_thickness_mm,
        "webHalfWidthXMm": web_half_x_mm,
    }


def verify_and_log_exported_rod(
    out_path: Path,
    d: dict[str, float],
    rv: dict[str, Any],
    stock_glb_path: Path,
) -> None:
    contract = rv["contract"]
    shank = rv["shankPlaceholdersMm"]
    exp_bounds = rv["expectedBoundsMm"]

    byte_len, sha256, doc, bin_bytes = parse_glb_binary(out_path)
    assert byte_len <= int(contract["maxFileBytes"]), (
        f"File size {byte_len} B exceeds cap {contract['maxFileBytes']} B"
    )

    # No textures, images, skins, animations, or if_* markers
    assert len(doc.get("images", [])) == 0
    assert len(doc.get("textures", [])) == 0
    assert len(doc.get("skins", [])) == 0
    assert len(doc.get("animations", [])) == 0
    nodes = doc.get("nodes", [])
    for n in nodes:
        assert not str(n.get("name", "")).startswith("if_"), f"Unexpected marker node {n.get('name')}"
        if "mesh" in n:
            for p in doc["meshes"][n["mesh"]]["primitives"]:
                assert "targets" not in p, "Unexpected morph targets"

    materials = doc.get("materials", [])
    assert len(materials) == int(contract["expectedMaterials"]), (
        f"Expected {contract['expectedMaterials']} materials, got {len(materials)}"
    )

    scene_roots = doc["scenes"][doc.get("scene", 0)]["nodes"]
    assert len(scene_roots) == 1, f"Expected 1 scene root node, got {len(scene_roots)}"
    root_node = nodes[scene_roots[0]]
    assert root_node.get("name") == contract["rootName"], f"Unexpected root {root_node.get('name')}"
    root_t = root_node.get("translation", [0.0, 0.0, 0.0])
    assert max(abs(float(c)) for c in root_t) <= 1e-6, f"Root pivot not at origin: {root_t}"

    children = root_node.get("children", [])
    assert len(children) == 1, f"Expected 1 child node, got {len(children)}"
    child_node = nodes[children[0]]
    assert child_node.get("name") == contract["smallEndName"], f"Unexpected child {child_node.get('name')}"
    # In glTF Y-up export, Blender +Z (163.0 mm) exports as +Y (0, +0.163, 0) m -> part-local (0, 0, +163.0) mm
    child_t_gltf = np.array(child_node.get("translation", [0.0, 0.0, 0.0]), dtype=np.float64).reshape((1, 3))
    child_t_local_mm = gltf_yup_m_to_part_local_mm(child_t_gltf)[0]
    assert abs(child_t_local_mm[0]) <= 0.001 and abs(child_t_local_mm[1]) <= 0.001
    assert abs(child_t_local_mm[2] - float(d["rodLengthMm"])) <= 0.001, (
        f"Small-end child Z {child_t_local_mm[2]} != {d['rodLengthMm']}"
    )

    verts_gltf_m, pts_mm, tris, prim_count = extract_all_meshes_part_local_mm(doc, bin_bytes)
    total_tris = len(tris)
    assert prim_count == int(contract["expectedPrimitives"]), f"Expected 3 primitives, got {prim_count}"
    assert total_tris <= int(contract["triangleCap"]), (
        f"Triangle count {total_tris} exceeds cap {contract['triangleCap']}"
    )

    mn = np.min(pts_mm, axis=0)
    mx = np.max(pts_mm, axis=0)
    assert abs(mn[0] - float(exp_bounds["xMin"])) <= 0.10
    assert abs(mx[0] - float(exp_bounds["xMax"])) <= 0.10
    assert abs(mn[1] - float(exp_bounds["yMin"])) <= 0.10
    assert abs(mx[1] - float(exp_bounds["yMax"])) <= 0.10
    assert abs(mn[2] - float(exp_bounds["zMin"])) <= 0.10
    assert abs(mx[2] - float(exp_bounds["zMax"])) <= 0.10

    sig = extract_rod_signature_and_interface_mm(pts_mm)
    assert abs(sig["bigAxialWidthMm"] - float(exp_bounds["bigEndAxialWidthMm"])) <= 0.05
    assert abs(sig["beamFlangeBigOuterYMm"] - float(shank["beamFlangeBigEndOuterYMm"])) <= 0.20
    assert abs(sig["beamFlangeSmallOuterYMm"] - float(shank["beamFlangeSmallEndOuterYMm"])) <= 0.20
    assert abs(sig["flangeThicknessYMm"] - float(shank["flangeThicknessYMm"])) <= 0.20
    assert abs(sig["webHalfWidthXMm"] - float(shank["webHalfWidthXMm"])) <= 0.20

    # Cross-check stock interface preservation against frozen rot_conrod_c1_stock.glb
    _, stock_sha, stock_doc, stock_bin = parse_glb_binary(stock_glb_path)
    _, stock_pts_mm, stock_tris, _ = extract_all_meshes_part_local_mm(stock_doc, stock_bin)
    stock_sig = extract_rod_signature_and_interface_mm(stock_pts_mm)
    assert len(stock_tris) == 1180
    assert abs(sig["bigJournalDiamMm"] - stock_sig["bigJournalDiamMm"]) <= 0.05
    assert abs(sig["wristPinDiamMm"] - stock_sig["wristPinDiamMm"]) <= 0.05
    assert abs(sig["bigAxialWidthMm"] - stock_sig["bigAxialWidthMm"]) <= 0.05
    assert abs(sig["bigJournalDiamMm"] - float(d["pinJournalDiameterMm"])) <= 0.05
    assert abs(sig["wristPinDiamMm"] - float(d["wristPinDiameterMm"])) <= 0.05

    bnd, nm, comp = audit_watertight_and_components(
        verts_gltf_m,
        tris,
        float(contract["weldQuantumM"]),
    )
    assert bnd == 0, f"Expected 0 boundary edges, got {bnd}"
    assert nm == 0, f"Expected 0 non-manifold edges, got {nm}"
    assert comp == int(contract["expectedComponents"]), (
        f"Expected {contract['expectedComponents']} closed components, got {comp}"
    )

    # Clearances (Spec §4.5)
    inter_rod_gap_mm = 2.0 * float(d["rodSeatOffsetMm"]) - sig["bigAxialWidthMm"]
    bore_r_mm = 0.5 * float(d["boreMm"])
    piston_outer_r_mm = 0.5 * (float(d["boreMm"]) - float(d["pistonSkirtClearanceMm"]))
    outer_bore_clr_mm = bore_r_mm - float(mx[1])
    beam_bore_clr_mm = bore_r_mm - sig["beamFlangeBigOuterYMm"]
    beam_piston_clr_mm = piston_outer_r_mm - sig["beamFlangeBigOuterYMm"]
    assert inter_rod_gap_mm > 0.70
    assert outer_bore_clr_mm > 2.70
    assert beam_bore_clr_mm > 21.0
    assert beam_piston_clr_mm > 21.0

    # Per-node triangle breakdown
    rod_mesh_tris = sum(
        int(doc["accessors"][p["indices"]]["count"]) // 3
        for p in doc["meshes"][root_node["mesh"]]["primitives"]
    )
    small_mesh_tris = sum(
        int(doc["accessors"][p["indices"]]["count"]) // 3
        for p in doc["meshes"][child_node["mesh"]]["primitives"]
    )

    print("\n" + "=" * 96)
    print("M13 FORGED ROD VARIANT BUILD — LOGGED ASSERTION BLOCK (BLENDER 5.2.3 LTS READ-BACK)")
    print("=" * 96)
    print(f"Blender Version    : {bpy.app.version_string} ({bpy.app.build_hash.decode('utf-8', errors='replace')})")
    print(f"Output GLB         : {out_path}")
    print(f"File Size          : {byte_len} B / {contract['maxFileBytes']} B cap ({byte_len / 1024.0:.2f} KiB, PASS)")
    print(f"SHA-256            : {sha256}")
    print(f"Frozen Stock SHA   : {stock_sha} (1,180 tris)")
    print(
        f"Triangles          : rod={rod_mesh_tris} + smallend={small_mesh_tris} = "
        f"{total_tris} / {contract['triangleCap']} cap "
        f"(scene delta = +{(total_tris - 1180) * 8} across 8 rods, PASS)"
    )
    print(f"Primitives / Mats  : {prim_count} primitives / {len(materials)} MeshStandardMaterials (0 textures/UVs/markers, PASS)")
    print(f"Watertight @ 1e-5m : boundary_edges={bnd}  non_manifold={nm}  closed_components={comp}/10 (PASS)")
    print(f"Pivot & Small-End  : root=(0.000, 0.000, 0.000) mm  smallend=({child_t_local_mm[0]:.3f}, {child_t_local_mm[1]:.3f}, {child_t_local_mm[2]:.3f}) mm (PASS)")
    print(f"Part-Local Bounds  : X[{mn[0]:.3f}, {mx[0]:.3f}]  Y[{mn[1]:.3f}, {mx[1]:.3f}]  Z[{mn[2]:.3f}, {mx[2]:.3f}] mm (PASS)")
    print(
        f"Stock Interface    : c2c={child_t_local_mm[2]:.3f} mm  journal={sig['bigJournalDiamMm']:.3f} mm "
        f"(stock {stock_sig['bigJournalDiamMm']:.3f})  pin={sig['wristPinDiamMm']:.3f} mm "
        f"(stock {stock_sig['wristPinDiamMm']:.3f})  width={sig['bigAxialWidthMm']:.3f} mm (PASS)"
    )
    print(
        f"Signature (mm)     : flange_Y_big={sig['beamFlangeBigOuterYMm']:.3f} (stock {stock_sig['beamFlangeBigOuterYMm']:.3f})  "
        f"flange_Y_small={sig['beamFlangeSmallOuterYMm']:.3f} (stock {stock_sig['beamFlangeSmallOuterYMm']:.3f})  "
        f"flange_thick={sig['flangeThicknessYMm']:.3f} (stock {stock_sig['flangeThicknessYMm']:.3f})  "
        f"web_half_X={sig['webHalfWidthXMm']:.3f} (stock {stock_sig['webHalfWidthXMm']:.3f}) (PASS)"
    )
    print(
        f"Clearances (mm)    : inter_rod_gap={inter_rod_gap_mm:.3f}  outer_to_bore={outer_bore_clr_mm:.3f}  "
        f"beam_to_bore={beam_bore_clr_mm:.3f}  beam_to_piston={beam_piston_clr_mm:.3f} (PASS)"
    )
    print("=" * 96 + "\n")


def main() -> None:
    args = parse_args()
    dim_path = Path(args.dimensions).resolve()
    rv_path = Path(args.rod_variant_dimensions).resolve()
    out_path = Path(args.out).resolve()
    stock_path = Path(args.stock_rod_glb).resolve()

    d: dict[str, float] = json.loads(dim_path.read_text(encoding="utf-8"))
    rv: dict[str, Any] = json.loads(rv_path.read_text(encoding="utf-8"))

    build_forged_rod(d, rv, out_path)
    verify_and_log_exported_rod(out_path, d, rv, stock_path)


if __name__ == "__main__":
    try:
        main()
    except Exception:
        import traceback

        traceback.print_exc()
        sys.exit(1)
