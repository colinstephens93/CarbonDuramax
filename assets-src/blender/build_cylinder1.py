"""
Headless Blender build script for Milestone 2 Cylinder-1 detailed part GLBs
and the 3-axis coordinate-conversion fixture.

Usage:
  blender --background --python assets-src/blender/build_cylinder1.py -- --out public/models

Normative rules (docs/specs/M2-detailed-cylinder.md):
- Reads interface dimensions ONLY from assets-src/dimensions.json (no hard-coded interface numbers).
- Authoring frame in Blender: +Z = bore axis (toward head), +X = crank axis (toward front),
  +Y = W (in-bank-plane perpendicular to bore, + toward valley for RH cylinder 1),
  origin at each moving part's rotation/slide pivot.
- Units: meters in Blender and exported GLBs (dimensions.json values are in mm, multiplied by 1e-3).
- Exported uncompressed with glTF exporter's Y-up option ON (export_yup=True).
"""

from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path

import bmesh
import bpy
from mathutils import Matrix, Vector


MM_TO_M = 1e-3


def parse_args() -> argparse.Namespace:
    argv = sys.argv
    if "--" in argv:
        script_args = argv[argv.index("--") + 1 :]
    else:
        script_args = []

    parser = argparse.ArgumentParser(description="Build Milestone 2 Cylinder-1 GLBs.")
    parser.add_argument(
        "--out",
        required=True,
        help="Output directory for the 10 part GLBs (e.g. public/models).",
    )
    parser.add_argument(
        "--dimensions",
        default=None,
        help="Optional path to dimensions.json (defaults to assets-src/dimensions.json).",
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
) -> bpy.types.Object:
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])

    cos_thresh = math.cos(math.radians(smooth_angle_deg))
    for face in bm.faces:
        face.smooth = True
    for edge in bm.edges:
        if len(edge.link_faces) == 2:
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
) -> None:
    """
    Revolves a 2D (radius, axial_coord) profile around X, Y, or Z by 360 degrees.
    Radius == 0 at start or end merges onto a single pole vertex cleanly.
    """
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
            for i in range(segments):
                i_next = (i + 1) % segments
                f = bm.faces.new((r0[i], r0[i_next], r1[i_next], r1[i]))
                f.material_index = mat_index


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
    transform: Matrix | None = None,
) -> list[bmesh.types.BMVert]:
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
    if transform is not None:
        coords = [transform @ c for c in coords]
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
    return v


def add_extruded_polygon_x(
    bm: bmesh.types.BMesh,
    yz_loop: list[tuple[float, float]],
    x0: float,
    x1: float,
    mat_index: int = 0,
) -> None:
    """Extrudes a CCW 2D polygon in (Y, Z) from X = x0 to X = x1."""
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


def add_extruded_polygon_z(
    bm: bmesh.types.BMesh,
    xy_loop: list[tuple[float, float]],
    z0: float,
    z1: float,
    mat_index: int = 0,
) -> None:
    """Extrudes a CCW 2D polygon in (X, Y) from Z = z0 to Z = z1."""
    n = len(xy_loop)
    v0 = [bm.verts.new((x, y, z0)) for (x, y) in xy_loop]
    v1 = [bm.verts.new((x, y, z1)) for (x, y) in xy_loop]

    f_bot = bm.faces.new(list(reversed(v0)))
    f_bot.material_index = mat_index
    f_top = bm.faces.new(v1)
    f_top.material_index = mat_index

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
        "export_animations": False,
        "export_materials": "EXPORT",
        "export_draco_mesh_compression_enable": False,
    }
    if bpy.app.version >= (5, 0, 0):
        export_kwargs["export_meshopt_compression_enable"] = False

    try:
        bpy.ops.export_scene.gltf(**export_kwargs)
    except TypeError as exc:
        if "export_meshopt_compression_enable" not in str(exc):
            raise
        export_kwargs.pop("export_meshopt_compression_enable", None)
        bpy.ops.export_scene.gltf(**export_kwargs)


# ---------------------------------------------------------------------------
# 1. Piston: rot_piston_c1_stock.glb
# ---------------------------------------------------------------------------
def build_piston(d: dict[str, float], out_dir: Path) -> None:
    reset_scene()

    outer_diam_m = (d["boreMm"] - d["pistonSkirtClearanceMm"]) * MM_TO_M
    r_out = 0.5 * outer_diam_m
    comp_h = d["pistonCompressionHeightMm"] * MM_TO_M
    pin_r = 0.5 * d["wristPinDiameterMm"] * MM_TO_M

    # Skirt extends below wrist-pin centerline within crown-to-skirt allowance.
    skirt_bottom = -(pin_r + 0.165 * d["wristPinDiameterMm"] * MM_TO_M)
    r_inner_cavity = 0.78 * r_out
    cavity_top = 0.56 * comp_h

    # Ring groove proportions derived relative to compression height & radius.
    g_depth = 0.072 * r_out
    g_h1 = 0.048 * comp_h
    g_h2 = 0.048 * comp_h
    g_h3 = 0.072 * comp_h

    z_top_land = comp_h - 0.135 * comp_h
    z_g1_bot = z_top_land - g_h1
    z_land2 = z_g1_bot - 0.065 * comp_h
    z_g2_bot = z_land2 - g_h2
    z_land3 = z_g2_bot - 0.065 * comp_h
    z_g3_bot = z_land3 - g_h3

    bowl_r_lip = 0.54 * r_out
    bowl_r_max = 0.60 * r_out
    bowl_depth = 0.27 * comp_h
    pip_h = 0.11 * comp_h

    mat_alu = make_pbr_material("mat_piston_cast_alu", (0.48, 0.50, 0.54, 1.0), 0.90, 0.38)
    mat_ring = make_pbr_material("mat_piston_rings", (0.12, 0.13, 0.15, 1.0), 0.88, 0.30)
    mat_pin = make_pbr_material("mat_wrist_pin_steel", (0.58, 0.60, 0.64, 1.0), 0.94, 0.20)

    bm = bmesh.new()

    # Main piston body with diesel omega crown bowl, 3 ring grooves, skirt, and inner cavity
    profile = [
        (0.0, comp_h - pip_h),
        (0.16 * r_out, comp_h - 0.55 * bowl_depth),
        (0.38 * r_out, comp_h - bowl_depth),
        (bowl_r_max, comp_h - 0.72 * bowl_depth),
        (bowl_r_lip, comp_h - 0.08 * bowl_depth),
        (bowl_r_lip + 0.02 * r_out, comp_h),
        (r_out - 0.015 * r_out, comp_h),
        (r_out, comp_h - 0.015 * r_out),
        (r_out, z_top_land),
        (r_out - g_depth, z_top_land),
        (r_out - g_depth, z_g1_bot),
        (r_out, z_g1_bot),
        (r_out, z_land2),
        (r_out - g_depth, z_land2),
        (r_out - g_depth, z_g2_bot),
        (r_out, z_g2_bot),
        (r_out, z_land3),
        (r_out - g_depth, z_land3),
        (r_out - g_depth, z_g3_bot),
        (r_out, z_g3_bot),
        (r_out, skirt_bottom + 0.02 * r_out),
        (r_out - 0.02 * r_out, skirt_bottom),
        (r_inner_cavity + 0.03 * r_out, skirt_bottom),
        (r_inner_cavity, skirt_bottom + 0.04 * r_out),
        (r_inner_cavity, cavity_top),
        (0.0, cavity_top + 0.05 * comp_h),
    ]
    add_revolved_profile(bm, profile, segments=56, axis="Z", mat_index=0)

    # 3 piston rings seated inside grooves (outer radius slightly inside r_out so bounds == outer_diam_m)
    r_ring_out = r_out - 0.002 * r_out
    r_ring_in = r_out - 0.88 * g_depth
    for z0, z1 in [
        (z_g1_bot + 0.08 * g_h1, z_top_land - 0.08 * g_h1),
        (z_g2_bot + 0.08 * g_h2, z_land2 - 0.08 * g_h2),
        (z_g3_bot + 0.06 * g_h3, z_land3 - 0.06 * g_h3),
    ]:
        add_tube_along_axis(bm, r_ring_in, r_ring_out, z0, z1, segments=56, axis="Z", mat_index=1)

    # Internal pin bosses flanking the connecting-rod small end along X
    boss_x_in = 0.30 * r_out
    boss_x_out = 0.80 * r_out
    boss_r_out = 1.32 * pin_r
    for sign_x in (-1.0, 1.0):
        x0 = sign_x * boss_x_in
        x1 = sign_x * boss_x_out
        xa, xb = (x0, x1) if x0 < x1 else (x1, x0)
        add_tube_along_axis(bm, pin_r, boss_r_out, xa, xb, segments=32, axis="X", mat_index=0)

    # Hollow tubular wrist pin centered at (0, 0, 0) along X
    pin_half_len = 0.82 * r_out
    add_tube_along_axis(
        bm,
        0.52 * pin_r,
        pin_r * 0.995,
        -pin_half_len,
        pin_half_len,
        segments=36,
        axis="X",
        mat_index=2,
    )

    obj = finalize_bmesh_object("rot_piston_c1_stock", bm, [mat_alu, mat_ring, mat_pin])
    export_glb(out_dir / "rot_piston_c1_stock.glb", [obj])


# ---------------------------------------------------------------------------
# 2. Connecting rod: rot_conrod_c1_stock.glb
# ---------------------------------------------------------------------------
def build_conrod(d: dict[str, float], out_dir: Path) -> None:
    reset_scene()

    rod_len = d["rodLengthMm"] * MM_TO_M
    big_r = 0.5 * d["pinJournalDiameterMm"] * MM_TO_M
    small_r = 0.5 * d["wristPinDiameterMm"] * MM_TO_M

    big_outer_r = 1.34 * big_r
    bush_thick = 0.09 * small_r
    small_bore_housing_r = small_r + bush_thick
    small_outer_r = 1.38 * small_r

    axial_half_w = 0.22 * d["pinJournalDiameterMm"] * MM_TO_M  # fits inside pin journal width

    mat_steel = make_pbr_material("mat_conrod_forged_steel", (0.30, 0.32, 0.36, 1.0), 0.85, 0.42)
    mat_bolt = make_pbr_material("mat_conrod_bolts", (0.09, 0.10, 0.12, 1.0), 0.85, 0.35)
    mat_bush = make_pbr_material("mat_conrod_bushing", (0.56, 0.38, 0.16, 1.0), 0.88, 0.32)

    bm = bmesh.new()

    # Big-end housing + split cap around X at (0, 0, 0)
    add_tube_along_axis(
        bm,
        big_r,
        big_outer_r,
        -axial_half_w,
        axial_half_w,
        segments=44,
        axis="X",
        center=Vector((0.0, 0.0, 0.0)),
        mat_index=0,
    )

    # Small-end eye around X at (0, 0, rod_len)
    small_half_w = 0.88 * axial_half_w
    add_tube_along_axis(
        bm,
        small_bore_housing_r,
        small_outer_r,
        -small_half_w,
        small_half_w,
        segments=36,
        axis="X",
        center=Vector((0.0, 0.0, rod_len)),
        mat_index=0,
    )

    # Tapered H-beam shank connecting big end to small end
    z_shank_0 = 0.88 * big_outer_r
    z_shank_1 = rod_len - 0.82 * small_outer_r
    y_big_flange = 0.62 * big_outer_r
    y_small_flange = 0.68 * small_outer_r
    flange_thick_y = 0.20 * big_r
    web_half_x = 0.32 * axial_half_w
    flange_half_x = 0.78 * axial_half_w

    # Central web along Z
    web_yz = [
        (-y_big_flange + 0.5 * flange_thick_y, z_shank_0),
        (y_big_flange - 0.5 * flange_thick_y, z_shank_0),
        (y_small_flange - 0.5 * flange_thick_y, z_shank_1),
        (-y_small_flange + 0.5 * flange_thick_y, z_shank_1),
    ]
    add_extruded_polygon_x(bm, web_yz, -web_half_x, web_half_x, mat_index=0)

    # Left & right tapered I/H-beam flanges
    for sign_y in (-1.0, 1.0):
        y0_in = sign_y * (y_big_flange - flange_thick_y)
        y0_out = sign_y * y_big_flange
        y1_in = sign_y * (y_small_flange - flange_thick_y)
        y1_out = sign_y * y_small_flange
        if sign_y > 0:
            loop = [(y0_in, z_shank_0), (y0_out, z_shank_0), (y1_out, z_shank_1), (y1_in, z_shank_1)]
        else:
            loop = [(y0_out, z_shank_0), (y0_in, z_shank_0), (y1_in, z_shank_1), (y1_out, z_shank_1)]
        add_extruded_polygon_x(bm, loop, -flange_half_x, flange_half_x, mat_index=0)

    # Big-end bolt ears & cap bolts on ±Y
    bolt_y = big_r + 0.52 * (big_outer_r - big_r) + 0.14 * big_r
    ear_half_w = 0.52 * axial_half_w
    bolt_r = 0.15 * big_r
    for sign_y in (-1.0, 1.0):
        cy = sign_y * bolt_y
        add_box(
            bm,
            (-ear_half_w, cy - 1.55 * bolt_r, -0.78 * big_outer_r),
            (ear_half_w, cy + 1.55 * bolt_r, 0.55 * big_outer_r),
            mat_index=0,
        )
        # Cap bolt head + shank along Z
        bolt_profile = [
            (0.0, -0.96 * big_outer_r),
            (1.45 * bolt_r, -0.96 * big_outer_r),
            (1.45 * bolt_r, -0.78 * big_outer_r),
            (bolt_r, -0.78 * big_outer_r),
            (bolt_r, 0.62 * big_outer_r),
            (0.0, 0.62 * big_outer_r),
        ]
        add_revolved_profile(
            bm,
            bolt_profile,
            segments=12,
            axis="Z",
            center=Vector((0.0, cy, 0.0)),
            mat_index=1,
        )

    rod_obj = finalize_bmesh_object("rot_conrod_c1_stock", bm, [mat_steel, mat_bolt])

    # Child node rot_conrod_smallend_c1_stock at exact (0, 0, rod_len)
    bm_small = bmesh.new()
    add_tube_along_axis(
        bm_small,
        small_r,
        small_bore_housing_r,
        -small_half_w * 1.01,
        small_half_w * 1.01,
        segments=36,
        axis="X",
        center=Vector((0.0, 0.0, 0.0)),
        mat_index=0,
    )
    small_obj = finalize_bmesh_object("rot_conrod_smallend_c1_stock", bm_small, [mat_bush])
    small_obj.parent = rod_obj
    small_obj.matrix_parent_inverse.identity()
    small_obj.location = (0.0, 0.0, rod_len)

    export_glb(out_dir / "rot_conrod_c1_stock.glb", [rod_obj, small_obj])


# ---------------------------------------------------------------------------
# 3. Crank throw: rot_crankthrow_c1_stock.glb
# ---------------------------------------------------------------------------
def build_crankthrow(d: dict[str, float], out_dir: Path) -> None:
    reset_scene()

    throw_r = d["crankThrowMm"] * MM_TO_M
    pin_r = 0.5 * d["pinJournalDiameterMm"] * MM_TO_M
    web_t = d["crankWebThicknessMm"] * MM_TO_M
    web_r = d["crankWebRadiusMm"] * MM_TO_M

    # Pin journal half-width accommodates the conrod big end cleanly
    pin_half_w = 0.245 * d["pinJournalDiameterMm"] * MM_TO_M
    main_r = 1.08 * pin_r

    mat_web = make_pbr_material("mat_crank_web_steel", (0.32, 0.34, 0.38, 1.0), 0.90, 0.30)
    mat_journal = make_pbr_material("mat_crank_journal_steel", (0.58, 0.60, 0.64, 1.0), 0.90, 0.30)

    bm = bmesh.new()

    # Build a smooth counterweighted crank-web polygon in (Y, Z)
    # Upper cheek wraps pin at (0, +throw_r) with radius 1.18 * pin_r;
    # Lower counterweight sweeps an arc of radius web_r centered at (0, 0) opposite the pin (-Z).
    cheek_r = 1.16 * pin_r
    yz_pts: list[tuple[float, float]] = []

    # Upper arc around (0, throw_r) from angle -35 deg to +215 deg (in YZ where 0=+Y, 90=+Z)
    upper_steps = 20
    for i in range(upper_steps + 1):
        ang = math.radians(-20.0 + (220.0 * i) / upper_steps)
        yz_pts.append((cheek_r * math.cos(ang), throw_r + cheek_r * math.sin(ang)))

    # Lower counterweight arc around (0, 0) from angle 205 deg to 335 deg (centered around 270 deg = -Z)
    lower_steps = 24
    for i in range(lower_steps + 1):
        ang = math.radians(205.0 + (130.0 * i) / lower_steps)
        yz_pts.append((web_r * math.cos(ang), web_r * math.sin(ang)))

    # Two counterweighted crank webs flanking the pin journal symmetrically in X
    for sign_x in (-1.0, 1.0):
        if sign_x < 0:
            x0 = -(pin_half_w + web_t)
            x1 = -pin_half_w
        else:
            x0 = pin_half_w
            x1 = pin_half_w + web_t
        add_extruded_polygon_x(bm, yz_pts, x0, x1, mat_index=0)

        # Main journal stub on outer side of each web
        stub_len = 0.72 * web_t
        sx0 = x0 - stub_len if sign_x < 0 else x1
        sx1 = x0 if sign_x < 0 else x1 + stub_len
        stub_profile = [
            (0.0, sx0),
            (main_r - 0.03 * main_r, sx0),
            (main_r, sx0 + 0.06 * stub_len),
            (main_r, sx1 - 0.06 * stub_len),
            (main_r - 0.03 * main_r, sx1),
            (0.0, sx1),
        ]
        add_revolved_profile(bm, stub_profile, segments=40, axis="X", mat_index=1)

    throw_obj = finalize_bmesh_object("rot_crankthrow_c1_stock", bm, [mat_web, mat_journal])

    # Child node rot_crankpin_c1_stock at exact (0, 0, throw_r) -> (0, +crankThrowMm, 0) in glTF
    bm_pin = bmesh.new()
    fillet_w = 0.06 * pin_half_w
    pin_profile = [
        (0.0, -pin_half_w),
        (pin_r + 0.05 * pin_r, -pin_half_w),
        (pin_r, -pin_half_w + fillet_w),
        (pin_r, pin_half_w - fillet_w),
        (pin_r + 0.05 * pin_r, pin_half_w),
        (0.0, pin_half_w),
    ]
    add_revolved_profile(bm_pin, pin_profile, segments=44, axis="X", mat_index=0)
    pin_obj = finalize_bmesh_object("rot_crankpin_c1_stock", bm_pin, [mat_journal])
    pin_obj.parent = throw_obj
    pin_obj.matrix_parent_inverse.identity()
    pin_obj.location = (0.0, 0.0, throw_r)

    export_glb(out_dir / "rot_crankthrow_c1_stock.glb", [throw_obj, pin_obj])


# ---------------------------------------------------------------------------
# 4. Static head section: sta_head_c1_stock.glb
# ---------------------------------------------------------------------------
def build_head(d: dict[str, float], out_dir: Path) -> None:
    reset_scene()

    pitch = d["borePitch"] * MM_TO_M
    v_pair_half = 0.5 * d["valvePairSpacingMm"] * MM_TO_M
    v_row = d["valveRowOffsetMm"] * MM_TO_M
    v_in_r = 0.5 * d["valveIntakeHeadMm"] * MM_TO_M
    v_ex_r = 0.5 * d["valveExhaustHeadMm"] * MM_TO_M
    v_stem_r = 0.5 * d["valveStemMm"] * MM_TO_M
    v_inset = d["valveInsetMm"] * MM_TO_M
    sp_seat_h = d["springSeatHeightMm"] * MM_TO_M
    sp_r = 0.5 * d["springDiameterMm"] * MM_TO_M
    shaft_h = d["rockerShaftHeightMm"] * MM_TO_M
    inj_r = 0.5 * d["injectorBodyMm"] * MM_TO_M
    cup_x = d["rockerTailXOffsetMm"] * MM_TO_M
    pr_r = 0.5 * d["pushrodDiameterMm"] * MM_TO_M
    half_pitch = 0.5 * pitch  # ±57.5 mm one bore-pitch slice per Revision 2 spec

    mat_head = make_pbr_material("mat_head_cast_alu", (0.42, 0.44, 0.47, 1.0), 0.75, 0.55)
    mat_guide = make_pbr_material("mat_head_guides_shaft", (0.36, 0.38, 0.43, 1.0), 0.85, 0.35)

    bm = bmesh.new()

    # Architectural deck slab spanning one bore-pitch slice X in [-half_pitch, +half_pitch] (-57.5..+57.5 mm),
    # with inter-bore gallery recesses along the ±X faces so pushrods at |X| = cup_x (60 mm, inner edge 55.5 mm)
    # pass completely clear outside the slice faces!
    deck_plate_h = 0.28 * sp_seat_h
    pr_clear_x = min(half_pitch, cup_x - 1.45 * pr_r)
    slab_half_y = v_row + 0.85 * v_in_r
    pr_valley_w = d["pushrodValleyOffsetMm"] * MM_TO_M
    cup_valley_w = d["rockerTailValleyOffsetMm"] * MM_TO_M

    # Full ±half_pitch (-57.5..+57.5 mm) slice with inter-bore pushrod gallery scallops on ±X:
    # +X scallop clears the angled intake pushrod; -X scallop clears the vertical exhaust pushrod.
    deck_xy = [
        (-half_pitch, -slab_half_y),
        (half_pitch, -slab_half_y),
        (half_pitch, -1.20 * cup_valley_w),
        (pr_clear_x, -0.90 * cup_valley_w),
        (pr_clear_x, 0.90 * pr_valley_w),
        (half_pitch, 1.20 * pr_valley_w),
        (half_pitch, slab_half_y),
        (-half_pitch, slab_half_y),
        (-half_pitch, 1.60 * pr_valley_w),
        (-pr_clear_x, 1.42 * pr_valley_w),
        (-pr_clear_x, 0.45 * pr_valley_w),
        (-half_pitch, 0.25 * pr_valley_w),
    ]
    add_extruded_polygon_z(bm, deck_xy, v_inset, deck_plate_h, mat_index=0)

    # Bottom combustion deck land (Z = 0..v_inset) centered on bore
    deck_face_r = 0.49 * d["boreMm"] * MM_TO_M
    add_tube_along_axis(
        bm,
        inj_r + 0.08 * inj_r,
        deck_face_r,
        0.0,
        v_inset,
        segments=48,
        axis="Z",
        mat_index=0,
    )

    # 4 spring-seat towers (Z = deck_plate_h .. sp_seat_h) + 4 valve guides rising inside springs
    guide_top_z = sp_seat_h + 0.38 * d["springFreeLengthMm"] * MM_TO_M
    for sx in (-1.0, 1.0):
        for sy, head_r in ((1.0, v_in_r), (-1.0, v_ex_r)):
            vx = sx * v_pair_half
            vy = sy * v_row
            c_vec = Vector((vx, vy, 0.0))

            # Spring seat boss
            add_tube_along_axis(
                bm,
                v_stem_r + 0.04 * sp_r,
                sp_r * 1.12,
                deck_plate_h,
                sp_seat_h,
                segments=28,
                axis="Z",
                center=c_vec,
                mat_index=0,
            )
            # Valve guide
            add_tube_along_axis(
                bm,
                v_stem_r * 1.04,
                v_stem_r * 1.85,
                sp_seat_h,
                guide_top_z,
                segments=24,
                axis="Z",
                center=c_vec,
                mat_index=1,
            )
            # Valve seat ring at Z = 0..v_inset*2
            add_tube_along_axis(
                bm,
                head_r * 0.86,
                head_r * 1.04,
                0.0,
                2.2 * v_inset,
                segments=28,
                axis="Z",
                center=c_vec,
                mat_index=1,
            )

    # Central injector sleeve boss (Z = deck_plate_h .. sp_seat_h)
    add_tube_along_axis(
        bm,
        inj_r * 1.03,
        inj_r * 1.32,
        deck_plate_h,
        sp_seat_h,
        segments=32,
        axis="Z",
        mat_index=0,
    )

    # Rocker-shaft pedestals & split rocker shaft along X at (Y = 0, Z = shaft_h)
    # Head slice spans strictly X in [-half_pitch, +half_pitch] (-57.5..+57.5 mm);
    # rocker cups at ±cup_x (±60 mm) overhang the slice edges per Revision 2 spec!
    shaft_r = 0.36 * inj_r
    shaft_inner_x = 1.22 * inj_r
    shaft_outer_x = half_pitch
    ped_thick_x = 0.055 * pitch
    ped_half_y = 1.35 * shaft_r

    for sign_x in (-1.0, 1.0):
        # Inner pedestal near injector & outer pedestal inside ±half_pitch slice
        for px_center in (
            sign_x * (shaft_inner_x + 0.55 * ped_thick_x),
            sign_x * (half_pitch - 2.1 * ped_thick_x),
        ):
            add_box(
                bm,
                (px_center - 0.5 * ped_thick_x, -ped_half_y, deck_plate_h),
                (px_center + 0.5 * ped_thick_x, ped_half_y, shaft_h + 1.15 * shaft_r),
                mat_index=0,
            )

        # Rocker shaft segment along X at (Y = 0, Z = shaft_h), flush with ±half_pitch slice faces
        sx0 = shaft_inner_x if sign_x > 0 else -shaft_outer_x
        sx1 = shaft_outer_x if sign_x > 0 else -shaft_inner_x
        shaft_prof = [
            (0.0, sx0),
            (shaft_r, sx0),
            (shaft_r, sx1),
            (0.0, sx1),
        ]
        add_revolved_profile(
            bm,
            shaft_prof,
            segments=28,
            axis="X",
            center=Vector((0.0, 0.0, shaft_h)),
            mat_index=1,
        )

    head_obj = finalize_bmesh_object("sta_head_c1_stock", bm, [mat_head, mat_guide])
    export_glb(out_dir / "sta_head_c1_stock.glb", [head_obj])


# ---------------------------------------------------------------------------
# 5 & 6. Valves + Helical Springs: val_valve_intake_stock.glb / exhaust
# ---------------------------------------------------------------------------
def build_valve_and_spring(
    d: dict[str, float],
    out_dir: Path,
    channel: str,
    head_diam_key: str,
) -> None:
    reset_scene()

    head_r = 0.5 * d[head_diam_key] * MM_TO_M
    stem_r = 0.5 * d["valveStemMm"] * MM_TO_M
    # Valve underside sits valveInsetMm above deck; stem tip sits valveStemLengthMm above deck
    stem_total_h = (d["valveStemLengthMm"] - d["valveInsetMm"]) * MM_TO_M

    sp_free_len = d["springFreeLengthMm"] * MM_TO_M
    sp_outer_r = 0.5 * d["springDiameterMm"] * MM_TO_M

    mat_valve = make_pbr_material(f"mat_valve_{channel}_steel", (0.56, 0.58, 0.62, 1.0), 0.90, 0.25)
    mat_spring = make_pbr_material(f"mat_spring_{channel}_blued", (0.10, 0.14, 0.22, 1.0), 0.80, 0.45)
    mat_retainer = make_pbr_material(
        f"mat_retainer_{channel}_steel", (0.38, 0.40, 0.44, 1.0), 0.85, 0.35
    )

    # Node 1: Valve (origin at valve head underside center (0, 0, 0))
    bm_v = bmesh.new()
    margin_h = 0.095 * head_r
    seat_bevel_h = 0.20 * head_r
    tulip_h = 0.52 * head_r
    keeper_z = stem_total_h - 0.08 * stem_total_h

    valve_profile = [
        (0.0, 0.0),
        (head_r * 0.96, 0.0),
        (head_r, 0.25 * margin_h),
        (head_r, margin_h),
        (head_r * 0.76, margin_h + seat_bevel_h),
        (stem_r * 1.65, margin_h + seat_bevel_h + 0.55 * tulip_h),
        (stem_r * 1.15, margin_h + seat_bevel_h + tulip_h),
        (stem_r, margin_h + seat_bevel_h + 1.35 * tulip_h),
        (stem_r, keeper_z),
        (stem_r * 0.82, keeper_z + 0.008 * stem_total_h),
        (stem_r * 0.82, keeper_z + 0.025 * stem_total_h),
        (stem_r, keeper_z + 0.033 * stem_total_h),
        (stem_r, stem_total_h - 0.15 * stem_r),
        (stem_r * 0.78, stem_total_h),
        (0.0, stem_total_h),
    ]
    add_revolved_profile(bm_v, valve_profile, segments=40, axis="Z", mat_index=0)
    valve_obj = finalize_bmesh_object(f"val_valve_{channel}_stock", bm_v, [mat_valve])

    # Node 2: Helical coil spring + top retainer (origin at fixed spring seat (0, 0, 0))
    bm_s = bmesh.new()
    wire_r = 0.135 * sp_outer_r
    helix_r = sp_outer_r - wire_r
    turns = 6.25
    path_steps = 150
    wire_segs = 10

    z_start = wire_r
    z_end = sp_free_len - wire_r
    rings: list[list[bmesh.types.BMVert]] = []

    for step in range(path_steps + 1):
        u = step / path_steps
        theta = 2.0 * math.pi * turns * u
        # Flattened end-coil pitch transition using smoothstep-like flattening near ends
        if u < 0.10:
            z_norm = 0.03 * (u / 0.10)
        elif u > 0.90:
            z_norm = 0.97 + 0.03 * ((u - 0.90) / 0.10)
        else:
            z_norm = 0.03 + 0.94 * ((u - 0.10) / 0.80)

        cz = z_start + (z_end - z_start) * z_norm
        center_pt = Vector((helix_r * math.cos(theta), helix_r * math.sin(theta), cz))
        radial_dir = Vector((math.cos(theta), math.sin(theta), 0.0))
        tangent_xy = Vector((-math.sin(theta), math.cos(theta), 0.0))
        binormal = radial_dir.cross(tangent_xy).normalized()

        ring: list[bmesh.types.BMVert] = []
        for k in range(wire_segs):
            phi = (2.0 * math.pi * k) / wire_segs
            pt = center_pt + wire_r * (math.cos(phi) * radial_dir + math.sin(phi) * binormal)
            ring.append(bm_s.verts.new(pt))
        rings.append(ring)

    for step in range(path_steps):
        r0 = rings[step]
        r1 = rings[step + 1]
        for k in range(wire_segs):
            kn = (k + 1) % wire_segs
            f = bm_s.faces.new((r0[k], r0[kn], r1[kn], r1[k]))
            f.material_index = 0

    # Cap both wire ends
    f_cap0 = bm_s.faces.new(list(reversed(rings[0])))
    f_cap0.material_index = 0
    f_cap1 = bm_s.faces.new(rings[-1])
    f_cap1.material_index = 0

    # Retainer seated at top of spring (underside flange at sp_free_len)
    ret_profile = [
        (stem_r * 1.06, sp_free_len - 1.6 * wire_r),
        (sp_outer_r * 0.72, sp_free_len - 1.6 * wire_r),
        (sp_outer_r * 0.76, sp_free_len),
        (sp_outer_r * 0.96, sp_free_len),
        (sp_outer_r * 0.96, sp_free_len + 0.9 * wire_r),
        (sp_outer_r * 0.62, sp_free_len + 1.7 * wire_r),
        (stem_r * 1.06, sp_free_len + 1.7 * wire_r),
    ]
    add_revolved_profile(
        bm_s,
        ret_profile,
        segments=32,
        axis="Z",
        mat_index=1,
        close_loop=True,
    )

    spring_obj = finalize_bmesh_object(
        f"val_spring_{channel}_stock",
        bm_s,
        [mat_spring, mat_retainer],
    )

    export_glb(out_dir / f"val_valve_{channel}_stock.glb", [valve_obj, spring_obj])


# ---------------------------------------------------------------------------
# 7. Pushrod + Lifter: val_pushrod_stock.glb
# ---------------------------------------------------------------------------
def build_pushrod_and_lifter(d: dict[str, float], out_dir: Path) -> None:
    reset_scene()

    pr_len = d["pushrodLengthMm"] * MM_TO_M
    pr_r = 0.5 * d["pushrodDiameterMm"] * MM_TO_M

    mat_steel = make_pbr_material("mat_pushrod_lifter_steel", (0.38, 0.40, 0.44, 1.0), 0.85, 0.35)
    mat_roller = make_pbr_material("mat_lifter_roller_steel", (0.58, 0.60, 0.64, 1.0), 0.92, 0.22)

    # Node 1: Pushrod from spherical ball center (0, 0, 0) to spherical ball center (0, 0, pr_len)
    bm_pr = bmesh.new()
    ball_r = 0.96 * pr_r
    neck_r = 0.78 * pr_r
    pr_profile: list[tuple[float, float]] = [(0.0, -ball_r)]
    for i in range(1, 7):
        ang = -0.5 * math.pi + (0.72 * math.pi * i) / 6
        pr_profile.append((ball_r * math.cos(ang), ball_r * math.sin(ang)))
    pr_profile.extend(
        [
            (neck_r, 1.6 * ball_r),
            (pr_r, 3.2 * ball_r),
            (pr_r, pr_len - 3.2 * ball_r),
            (neck_r, pr_len - 1.6 * ball_r),
        ]
    )
    for i in range(6):
        ang = 0.22 * math.pi + (0.28 * math.pi * i) / 5
        pr_profile.append((ball_r * math.cos(ang), pr_len + ball_r * math.sin(ang)))
    pr_profile[-1] = (0.0, pr_len + ball_r)

    add_revolved_profile(bm_pr, pr_profile, segments=28, axis="Z", mat_index=0)
    pr_obj = finalize_bmesh_object("val_pushrod_stock", bm_pr, [mat_steel])

    # Node 2: Roller lifter with origin (0, 0, 0) at pushrod-seat cup center
    bm_lf = bmesh.new()
    lifter_r = 2.65 * pr_r
    lifter_h = 7.8 * pr_r
    lifter_profile = [
        (0.0, 0.0),
        (ball_r * 1.08, 0.35 * pr_r),
        (lifter_r * 0.76, 0.65 * pr_r),
        (lifter_r, 0.45 * pr_r),
        (lifter_r, -lifter_h * 0.78),
        (lifter_r * 0.85, -lifter_h * 0.84),
        (0.0, -lifter_h * 0.84),
    ]
    add_revolved_profile(bm_lf, lifter_profile, segments=32, axis="Z", mat_index=0)

    # Roller wheel at bottom of lifter along X
    roller_r = 0.72 * lifter_r
    roller_half_x = 0.52 * lifter_r
    roller_z = -lifter_h * 0.88
    roller_profile = [
        (0.0, -roller_half_x),
        (roller_r, -roller_half_x),
        (roller_r, roller_half_x),
        (0.0, roller_half_x),
    ]
    add_revolved_profile(
        bm_lf,
        roller_profile,
        segments=28,
        axis="X",
        center=Vector((0.0, 0.0, roller_z)),
        mat_index=1,
    )

    lf_obj = finalize_bmesh_object("val_lifter_stock", bm_lf, [mat_steel, mat_roller])
    export_glb(out_dir / "val_pushrod_stock.glb", [pr_obj, lf_obj])


# ---------------------------------------------------------------------------
# 8. Two Rocker Castings: val_rocker_stock.glb
# ---------------------------------------------------------------------------
def build_single_rocker_casting(
    name: str,
    pad_y: float,
    cup_x: float,
    cup_y: float,
    shaft_inner_x: float,
    shaft_outer_x: float,
    shaft_r: float,
    pr_r: float,
    mat_body: bpy.types.Material,
    mat_adj: bpy.types.Material,
) -> bpy.types.Object:
    """
    Builds one forged rocker casting with origin (0, 0, 0) on the rocker shaft axis:
    - Shaft boss along X inside the head slice [shaft_inner_x, shaft_outer_x]
    - Swept valve-side arm reaching curved pad contact at (0, pad_y, 0)
    - Overhanging pushrod-side arm web reaching cup contact + lash adjuster at (cup_x, cup_y, 0)
    """
    bm = bmesh.new()
    sign_x = 1.0 if cup_x >= 0.0 else -1.0
    sign_pad_y = 1.0 if pad_y >= 0.0 else -1.0
    sign_cup_y = 1.0 if cup_y >= 0.0 else -1.0

    boss_r_in = shaft_r * 1.03
    boss_r_out = shaft_r * 1.58
    boss_x_near = sign_x * shaft_inner_x
    boss_x_far = sign_x * (shaft_outer_x - 0.35 * pr_r)
    xa, xb = (boss_x_near, boss_x_far) if boss_x_near < boss_x_far else (boss_x_far, boss_x_near)

    # 1. Rocker shaft boss around X axis at (Y=0, Z=0)
    add_tube_along_axis(bm, boss_r_in, boss_r_out, xa, xb, segments=32, axis="X", mat_index=0)

    # 2. Curved valve-bridge contact pad centered at (0, pad_y, 0), bottom tangent to Z = 0
    pad_half_x = 1.35 * pr_r
    pad_crown_r = 2.4 * pr_r
    pad_yz: list[tuple[float, float]] = []
    for i in range(13):
        ang = math.radians(-38.0 + (76.0 * i) / 12.0)
        py = pad_y + pad_crown_r * math.sin(ang)
        pz = pad_crown_r * (1.0 - math.cos(ang))
        pad_yz.append((py, pz))
    pad_yz.append((pad_y + 0.85 * pad_crown_r * math.sin(math.radians(38.0)), 1.9 * pr_r))
    pad_yz.append((pad_y - 0.85 * pad_crown_r * math.sin(math.radians(38.0)), 1.9 * pr_r))
    add_extruded_polygon_x(bm, pad_yz, -pad_half_x, pad_half_x, mat_index=1)

    # 3. Swept forged arm connecting shaft boss around central injector to pad at (0, pad_y, 0)
    arm_z0 = 0.35 * pr_r
    arm_z1 = 2.15 * pr_r
    x_root_in = boss_x_near + sign_x * (0.15 * pr_r)
    x_root_out = boss_x_near + sign_x * (2.65 * pr_r)

    arm_xy = [
        (x_root_in, sign_pad_y * 0.65 * boss_r_out),
        (x_root_out, sign_pad_y * 0.55 * boss_r_out),
        (sign_x * pad_half_x, pad_y + sign_pad_y * 0.65 * pr_r),
        (-sign_x * pad_half_x, pad_y + sign_pad_y * 0.65 * pr_r),
        (-sign_x * 0.65 * pad_half_x, pad_y - sign_pad_y * 0.85 * pr_r),
    ]
    area2 = 0.0
    for i in range(len(arm_xy)):
        x_i, y_i = arm_xy[i]
        x_j, y_j = arm_xy[(i + 1) % len(arm_xy)]
        area2 += x_i * y_j - x_j * y_i
    if area2 < 0.0:
        arm_xy.reverse()
    add_extruded_polygon_z(bm, arm_xy, arm_z0, arm_z1, mat_index=0)

    # 4. Overhanging pushrod-side arm web from outer shaft boss out to cup boss at (cup_x, cup_y, 0)
    cup_boss_r = 1.65 * pr_r
    root_cup_in = boss_x_far - sign_x * (2.6 * pr_r)
    root_cup_out = boss_x_far
    y_boss_edge = sign_cup_y * 0.65 * boss_r_out
    cup_web_xy = [
        (root_cup_in, y_boss_edge),
        (root_cup_out, y_boss_edge),
        (cup_x + sign_x * 0.92 * cup_boss_r, cup_y),
        (cup_x - sign_x * 0.92 * cup_boss_r, cup_y),
    ]
    area2 = 0.0
    for i in range(len(cup_web_xy)):
        x_i, y_i = cup_web_xy[i]
        x_j, y_j = cup_web_xy[(i + 1) % len(cup_web_xy)]
        area2 += x_i * y_j - x_j * y_i
    if area2 < 0.0:
        cup_web_xy.reverse()
    add_extruded_polygon_z(bm, cup_web_xy, -0.35 * pr_r, 1.85 * pr_r, mat_index=0)

    # 5. Cup socket boss + threaded lash adjuster screw & locknut at (cup_x, cup_y, 0)
    adj_profile = [
        (0.0, 0.0),
        (pr_r * 1.05, -0.42 * pr_r),
        (cup_boss_r, -0.42 * pr_r),
        (cup_boss_r, 1.95 * pr_r),
        (1.18 * pr_r, 1.95 * pr_r),
        (1.18 * pr_r, 2.75 * pr_r),
        (0.68 * pr_r, 2.75 * pr_r),
        (0.68 * pr_r, 3.65 * pr_r),
        (0.0, 3.65 * pr_r),
    ]
    add_revolved_profile(
        bm,
        adj_profile,
        segments=20,
        axis="Z",
        center=Vector((cup_x, cup_y, 0.0)),
        mat_index=1,
    )

    return finalize_bmesh_object(name, bm, [mat_body, mat_adj])


def build_rockers(d: dict[str, float], out_dir: Path) -> None:
    reset_scene()

    v_row = d["valveRowOffsetMm"] * MM_TO_M
    cup_x = d["rockerTailXOffsetMm"] * MM_TO_M
    cup_w = d["rockerTailValleyOffsetMm"] * MM_TO_M
    inj_r = 0.5 * d["injectorBodyMm"] * MM_TO_M
    pr_r = 0.5 * d["pushrodDiameterMm"] * MM_TO_M
    half_pitch = 0.5 * d["borePitch"] * MM_TO_M

    shaft_r = 0.36 * inj_r
    shaft_inner_x = 1.28 * inj_r
    shaft_outer_x = half_pitch

    mat_body = make_pbr_material("mat_rocker_forged_steel", (0.38, 0.40, 0.44, 1.0), 0.85, 0.35)
    mat_adj = make_pbr_material("mat_rocker_adjuster_steel", (0.20, 0.22, 0.26, 1.0), 0.85, 0.35)

    # Intake casting: pad at (X 0, W +23), cup at (X +60, W -19)
    intake_obj = build_single_rocker_casting(
        "val_rocker_intake_stock",
        pad_y=+v_row,
        cup_x=+cup_x,
        cup_y=-cup_w,
        shaft_inner_x=shaft_inner_x,
        shaft_outer_x=shaft_outer_x,
        shaft_r=shaft_r,
        pr_r=pr_r,
        mat_body=mat_body,
        mat_adj=mat_adj,
    )

    # Exhaust casting: pad at (X 0, W -23), cup at (X -60, W +19)
    exhaust_obj = build_single_rocker_casting(
        "val_rocker_exhaust_stock",
        pad_y=-v_row,
        cup_x=-cup_x,
        cup_y=+cup_w,
        shaft_inner_x=shaft_inner_x,
        shaft_outer_x=shaft_outer_x,
        shaft_r=shaft_r,
        pr_r=pr_r,
        mat_body=mat_body,
        mat_adj=mat_adj,
    )

    export_glb(out_dir / "val_rocker_stock.glb", [intake_obj, exhaust_obj])


# ---------------------------------------------------------------------------
# 9. Valve Bridge: val_bridge_stock.glb
# ---------------------------------------------------------------------------
def build_bridge(d: dict[str, float], out_dir: Path) -> None:
    reset_scene()

    v_pair_half = 0.5 * d["valvePairSpacingMm"] * MM_TO_M
    t_bridge = d["bridgeThicknessMm"] * MM_TO_M
    stem_r = 0.5 * d["valveStemMm"] * MM_TO_M

    mat_steel = make_pbr_material("mat_bridge_steel", (0.38, 0.40, 0.44, 1.0), 0.85, 0.35)
    mat_pad = make_pbr_material("mat_bridge_pad_steel", (0.56, 0.58, 0.62, 1.0), 0.85, 0.35)

    bm = bmesh.new()

    # Origin (0, 0, 0) at top pad boss contact surface center; bridge bar spans Z = -t_bridge .. -pad_boss_h
    pad_boss_h = 0.18 * t_bridge
    bar_half_x = v_pair_half + 2.1 * stem_r
    bar_half_y = 1.85 * stem_r

    add_box(
        bm,
        (-bar_half_x, -bar_half_y, -t_bridge),
        (bar_half_x, bar_half_y, -pad_boss_h),
        mat_index=0,
    )

    # Top hardened contact pad boss rising to Z = 0 with >= 5.5 mm W-half-width (>= 3 mm overlap allowance)
    pad_half_x = 2.4 * stem_r
    pad_half_y = 1.65 * stem_r  # 5.775 mm half-width -> 11.55 mm total W pad width
    add_box(
        bm,
        (-pad_half_x, -pad_half_y, -pad_boss_h),
        (pad_half_x, pad_half_y, 0.0),
        mat_index=1,
    )

    # Two stem-tip guide posts/skirts on underside at X = ±v_pair_half
    skirt_depth = 0.35 * t_bridge
    for sign_x in (-1.0, 1.0):
        add_tube_along_axis(
            bm,
            stem_r * 1.04,
            stem_r * 1.95,
            -t_bridge - skirt_depth,
            -t_bridge,
            segments=24,
            axis="Z",
            center=Vector((sign_x * v_pair_half, 0.0, 0.0)),
            mat_index=0,
        )

    bridge_obj = finalize_bmesh_object("val_bridge_stock", bm, [mat_steel, mat_pad])
    export_glb(out_dir / "val_bridge_stock.glb", [bridge_obj])


# ---------------------------------------------------------------------------
# 10. Center Fuel Injector: fuel_injector_c1_stock.glb
# ---------------------------------------------------------------------------
def build_injector(d: dict[str, float], out_dir: Path) -> None:
    reset_scene()

    inj_r = 0.5 * d["injectorBodyMm"] * MM_TO_M
    inj_len = d["injectorLengthMm"] * MM_TO_M

    mat_steel = make_pbr_material("mat_injector_body_steel", (0.48, 0.50, 0.54, 1.0), 0.88, 0.30)
    mat_poly = make_pbr_material("mat_injector_top_polymer", (0.035, 0.04, 0.05, 1.0), 0.40, 0.60)

    bm = bmesh.new()

    # Stepped common-rail diesel injector body (nozzle tip protruding slightly below deck Z=0)
    tip_protrusion = 0.018 * inj_len
    z_solenoid = 0.76 * inj_len

    steel_profile = [
        (0.0, -tip_protrusion),
        (0.26 * inj_r, -0.75 * tip_protrusion),
        (0.30 * inj_r, 0.0),
        (0.56 * inj_r, 0.03 * inj_len),
        (0.56 * inj_r, 0.28 * inj_len),
        (0.76 * inj_r, 0.31 * inj_len),
        (0.76 * inj_r, 0.44 * inj_len),
        (inj_r, 0.47 * inj_len),
        (inj_r, 0.64 * inj_len),
        (0.84 * inj_r, 0.66 * inj_len),
        (0.84 * inj_r, z_solenoid),
        (0.0, z_solenoid),
    ]
    add_revolved_profile(bm, steel_profile, segments=36, axis="Z", mat_index=0)

    # Dark polymer solenoid cap + electrical connector housing up to inj_len
    poly_profile = [
        (0.0, z_solenoid),
        (0.92 * inj_r, z_solenoid),
        (0.92 * inj_r, 0.94 * inj_len),
        (0.74 * inj_r, inj_len),
        (0.0, inj_len),
    ]
    add_revolved_profile(bm, poly_profile, segments=32, axis="Z", mat_index=1)

    # Angled electrical plug boss on valley (+Y) side of polymer top
    plug_xform = Matrix.Translation((0.0, 0.75 * inj_r, 0.88 * inj_len)) @ Matrix.Rotation(
        math.radians(-32.0), 4, "X"
    )
    add_box(
        bm,
        (-0.42 * inj_r, 0.0, -0.35 * inj_r),
        (0.42 * inj_r, 1.05 * inj_r, 0.35 * inj_r),
        mat_index=1,
        transform=plug_xform,
    )

    inj_obj = finalize_bmesh_object("fuel_injector_c1_stock", bm, [mat_steel, mat_poly])
    export_glb(out_dir / "fuel_injector_c1_stock.glb", [inj_obj])


# ---------------------------------------------------------------------------
# Axis-conversion fixture: assets-src/fixture/axis_fixture.glb
# ---------------------------------------------------------------------------
def build_axis_fixture(fixture_path: Path) -> None:
    """
    Builds three thin boxes along Blender +X (30 mm), +Y (60 mm), and +Z (90 mm).
    With Y-up export ON, glTF file-space extents must be X=30 mm, Y=90 mm, Z=60 mm.
    """
    reset_scene()

    mat_x = make_pbr_material("mat_axis_x", (0.90, 0.20, 0.20, 1.0), 0.2, 0.5)
    mat_y = make_pbr_material("mat_axis_y", (0.20, 0.85, 0.25, 1.0), 0.2, 0.5)
    mat_z = make_pbr_material("mat_axis_z", (0.20, 0.45, 0.95, 1.0), 0.2, 0.5)

    bm = bmesh.new()
    thick = 2.0 * MM_TO_M
    add_box(bm, (0.0, 0.0, 0.0), (30.0 * MM_TO_M, thick, thick), mat_index=0)
    add_box(bm, (0.0, 0.0, 0.0), (thick, 60.0 * MM_TO_M, thick), mat_index=1)
    add_box(bm, (0.0, 0.0, 0.0), (thick, thick, 90.0 * MM_TO_M), mat_index=2)

    fix_obj = finalize_bmesh_object("axis_fixture", bm, [mat_x, mat_y, mat_z])
    export_glb(fixture_path, [fix_obj])


def main() -> None:
    args = parse_args()
    script_path = Path(__file__).resolve()
    assets_src_dir = script_path.parent.parent
    dims_path = Path(args.dimensions) if args.dimensions else (assets_src_dir / "dimensions.json")
    out_dir = Path(args.out).resolve()
    fixture_path = assets_src_dir / "fixture" / "axis_fixture.glb"

    with dims_path.open("r", encoding="utf-8") as fh:
        dims: dict[str, float] = json.load(fh)

    build_piston(dims, out_dir)
    build_conrod(dims, out_dir)
    build_crankthrow(dims, out_dir)
    build_head(dims, out_dir)
    build_valve_and_spring(dims, out_dir, "intake", "valveIntakeHeadMm")
    build_valve_and_spring(dims, out_dir, "exhaust", "valveExhaustHeadMm")
    build_pushrod_and_lifter(dims, out_dir)
    build_rockers(dims, out_dir)
    build_bridge(dims, out_dir)
    build_injector(dims, out_dir)
    build_axis_fixture(fixture_path)

    print(f"Successfully built 10 part GLBs in {out_dir} and axis fixture at {fixture_path}")


if __name__ == "__main__":
    main()
