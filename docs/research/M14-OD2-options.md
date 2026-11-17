# M14 OD-2 Options — Vehicle View vs the Three Vehicle-Side Variants

**Branch:** `research/m14-od2-options`, cut from `main` @ `0a1ca79` (the merged M14 planning package).
**Status:** research only. This file changes no code, asset, catalog, test or spec. The M14 build branch is not touched.
**Question:** in the default-off `Vehicle` view, what should happen for `intake_highflow` (V2), `intercooler_upgraded` (V4) and `exhaust_4in` (V3)? OD-2 as drafted is one candidate, not the default. The build's interim rule suspends the Vehicle context for all three; that is also a candidate, not the default.

---

## 0. Bottom line

The 14/6 vertex counts reproduce **exactly**, but they are not a tube-through-radiator story. All 20 vertices belong to the **V2 open-element filter gauze** (primitive 2, `mat_intake_filter_gauze`); the intake tube (primitive 0) and its silicone couplers (primitive 1) have **zero** vertices in either envelope. At triangle level the overlap is larger than 14/6: **49 triangles / 5,339 mm²** of filter surface are inside the radiator solid (after its existing relief) and **29 triangles / 2,027 mm²** inside the intercooler, with maximum penetrations of **26.19 mm** and **11.93 mm**.

The buried fragments are genuinely occluded — **0 of 16** inside-solid vertices are visible from every tested camera, including RF-23…RF-27. But the **entry seam is not invisible**: the filter can be seen meeting the radiator top/RH corner (9 px at RF-23, 24 px from the front, 25 + 9 px from the front three-quarter, 48 + 11 px from top-down, 188 px from rear-right, 59 px from LH). Option 2(a) therefore fails its own "genuinely invisible" condition.

The recommendation is a **resolver-level priority rule with per-variant data**, not a chain of special cases: V1 → no stock part hides; V4 → the stock intercooler hides; V3 → the stock exhaust hides; V2 → `frontStackConflict` and the Vehicle context suspends. This is the drafted OD-2 **outcome** for V1/V3/V4/V2, but with a corrected V2 basis and one testable rule. The interim rule is rejected as over-broad: it withholds the Vehicle view for V3/V4, which have clean, geometrically justified yields and no intersection. Option 3 (interim permanent) is the runner-up only if the owner prefers a strict "stock-only" Vehicle context over seeing V3/V4 in the bay.

---

## 1. Method and coordinate frame

Everything below comes from the committed files, not from the spec's prose.

### 1.1 The shipped conversion

- The four external variant GLBs are **scene-placed, project-frame, Y-up** assets (M8 §3.1; D-038/D-042). `src/renderer/variantLoader.ts` wraps `gltf.scene` once with `wrapInPartLocalFrame()`; `src/renderer/partLoader.ts` sets the wrapper's `rotation.x = +Math.PI / 2`.
- For a glTF point `(g_x, g_y, g_z)` in metres, the wrapper therefore yields the project point `p_mm = (1000·g_x, −1000·g_z, 1000·g_y)`. The GLB is in metres; the envelopes are in millimetres. This is the same conversion the spec/M8 tests use.
- I parsed the GLB binary chunks directly (JSON + BIN, accessors, no node transforms on the V2 mesh node) and applied the conversion manually. V2 has four primitives in one mesh node, four materials, and 2,560 triangles.

### 1.2 Envelopes tested

| Envelope | X (mm) | Y (mm) | Z (mm) | Source |
| --- | ---: | ---: | ---: | --- |
| Stock radiator | 650…706 | −500…500 | −108…420 | M14 spec §2.2/§7.4 |
| Radiator RH rear-corner relief (**removed** from the solid) | 650…690 | −500…−480 | 320…410 | M14 spec §2.1/§2.2/§7.4 |
| Stock intercooler | 712…760 | −520…520 | −100…410 | M14 spec §2.4/§7.4 |
| Stock airbox body (control) | 600…860 | −820…−560 | 240…520 | M14 spec §2.1/§7.4 |
| Stock exhaust (control) | −1,364.45…−161.97 | −345…−101.79 | −220…84.45 | M14 spec §2.5/§7.4 |
| Fan shroud (control) | 610…650 | −252…252 | −96…408 | M14 spec §2.3/§7.4 |

The radiator **solid** is the full box **minus** the relief. I decomposed it into four boxes (inboard of the relief; the forward slab; below the relief; above the relief) so both the triangle test and the ray test use the actual notched solid, not just the AABB.

### 1.3 Tests run

1. **Vertex-inside counts**, with and without the relief, deduplicated by position.
2. **Triangle–box intersection** with the standard separating-axis test (13 axes), cross-checked by barycentric sampling (a triangle counts only if a sample point lies inside the solid). The two methods agree.
3. **Clipped surface area** by dense barycentric sampling on the filter triangles (24–30 subdivisions), and **penetration depth** as the minimum distance to a box face for every inside sample.
4. **Primitive/material attribution** from the GLB JSON and each primitive's material index.
5. **Ray-cast visibility** from the pinned M14 cameras and typical bay angles: first hit among the V2 filter triangles, the four-box radiator solid and the intercooler box. Camera projection is the spec's 42° vertical FOV, 1024×640, look-at.
6. **Visible-pixel classification** at 1024×640: a z-buffered raster of the filter + the notched radiator + the intercooler, with perspective-correct depth; visible filter pixels were classified as inside the solid, within 2 mm outside it, or clear. This measures the seam, not just the buried fragments.

The M14 hardware asset does not exist in this clone, so the radiator and intercooler are the **analytic envelopes**, not the built meshes. That is the conservative contract the spec's tests use; the build's actual rounded tanks/details can only reduce the overlap. It is labelled as a limitation in §7.

---

## 2. Re-verified V2 geometry

### 2.1 The counts

| Test | Radiator | Intercooler |
| --- | ---: | ---: |
| Vertices inside the full envelope | **14** | **6** |
| Vertices inside the solid (radiator relief excluded) | **10** | **6** |
| Vertices inside the relief void only (radiator) | 4 | — |
| Triangles intersecting the full envelope | **51** | **29** |
| Triangles intersecting the solid (relief excluded) | **49** | **29** |
| Clipped filter surface inside the full envelope | 7,269 mm² | 2,027 mm² |
| Clipped filter surface inside the solid | **5,339 mm²** | **2,027 mm²** |
| Maximum penetration below the nearest envelope face | **26.19 mm** | **11.93 mm** |
| Deepest inside-vertex nearest-face distance | 15.69 mm | 11.93 mm |
| Shallowest inside-vertex nearest-face distance | 0.89 mm | 1.18 mm |

The counts are **unique vertex positions**, not position records: V2 has 1,884 position records but 1,331 unique positions, and the 14/6 are not doubled by the primitive's seam duplicates. The spec's **14/6 is correct**. It is a *vertex* count on a coarsely tessellated cone: the surface between those vertices penetrates further and over a larger area. The spec's test 6 should keep the 14/6 assertion but must not treat it as the whole overlap.

### 2.2 What the 20 vertices belong to

| Primitive | Material | Triangles | Project AABB (mm) | Inside radiator / IC | What it is |
| ---: | --- | ---: | --- | ---: | --- |
| 0 | `mat_intake_alu_polished` | 1,280 | X −18.0…611.2, Y −556.1…56.1, Z 321.8…547.8 | **0 / 0** | Ø101.6 mm intake tube from compressor inlet to airbox mount |
| 1 | `mat_intake_silicone_black` | 800 | X −17.3…607.2, Y −563.6…54.4, Z 313.6…513.6 | **0 / 0** | silicone couplers and clamp rings at both ends |
| 2 | `mat_intake_filter_gauze` | 384 | X 548.5…771.9, Y −638.8…−436.3, Z 289.1…453.8 | **14 / 6** | open-element filter cone/base and pleats |
| 3 | `mat_intake_filter_cap_steel` | 96 | X 721.5…778.5, Y −639.1…−542.5, Z 290.6…395.4 | **0 / 0** | steel filter end cap |

**All 20 vertices, all 49 solid radiator triangles and all 29 intercooler triangles are primitive 2, the filter gauze.** There is no tube-through-radiator intersection: the tube's maximum X is 611.2 mm (primitive 0) and 607.2 mm (primitive 1), both **behind** the radiator's rear face at X = 650 mm. The filter is mounted at the airbox service point (587.4, −510.5, 371.9), the same point and axis as the stock airbox collar, and points forward/outboard/down along (0.8828, −0.4414, −0.1605). Its wide base (nominal Ø160, radial reach up to ≈83 mm with pleats) crosses the radiator's RH top/rear corner and the intercooler's RH rear edge; its tip centre (Ø100, at axial ≈190 mm, X ≈755, Y ≈−594, Z ≈341) stays outboard of the intercooler in Y; the steel cap rim reaches X 778.5.

This matters for the options: the conflicting object is the **filter**, not the high-flow plumbing. The tube and couplers are clear of both envelopes and of the front stack.

### 2.3 Where and how deep

The axial/radial coordinates below are measured from the filter base at the airbox service point along the filter axis:

| Set | Axial position | Radial distance | Meaning |
| --- | ---: | ---: | --- |
| Radiator-inside vertices | 39.6…81.0 mm | 67.2…76.7 mm | wide base/pleat rim |
| Intercooler-inside vertices | 122.4 mm (one ring) | 60.7…63.7 mm | mid-cone, one tessellation ring |

Radiator solid vertices are **0.89…15.69 mm** from the nearest envelope face; the deepest *surface* point is **26.19 mm** inside the RH face (Y = −500) at (676.86, −473.81, 361.56). The 4 relief-only vertices are at (684.06, −486.31, 332.38), (686.51, −486.35, 345.96), (678.54, −493.59, 322.04) and (689.26, −498.95, 395.76) — exactly in the existing 20 × 90 × 40 mm pocket. The other 10 solid vertices lie inboard of the relief's inner face (Y > −480) or forward of its X = 690 end, or above/below its Z 320…410 span.

The intercooler overlap is shallower: 6 vertices at X 713.2…725.3 (1.2…13.3 mm behind the IC rear face X = 712), Y −507.6…−517.0 (3.0…12.4 mm inside the RH edge Y = −520), Z 319.0…376.3. It is a small rear-corner clip, not a through-core hole.

### 2.4 The relief already clears part of it — but only part

The radiator's RH rear-corner relief was designed for the stock airbox collar (r 44.45 mm), which shares the filter's axis. The filter is wider (r ≈80 mm at the base), so the same relief removes **4 of the 14 vertices** and **1,930 mm² of the 7,269 mm² full-envelope overlap** (26.6 %). The remaining **5,339 mm²** is in the radiator solid.

To clear the filter by relief alone the pocket would have to grow from 20 mm deep / 40 mm long / 90 mm tall to roughly 41 mm deep / 42 mm long / 110 mm tall (the solid overlap reaches Y ≈ −459, X ≈ 692, Z ≈ 310 and 419). That is a large notch in the RH side tank — a visibly modified radiator, not a stock one — and it would still not address the intercooler. This is not a clean fix and is not recommended.

### 2.5 Control: V2 against the stock airbox, exhaust and shroud

| Stock part | V2 triangles inside | V2 vertices inside | Note |
| --- | ---: | ---: | --- |
| Airbox body envelope | 240 | 125 | Expected: the open filter replaces the stock airbox and occupies its space. M8 already hides the stock `intake` group for V2, and OD-2 hides the M14 airbox with it. **The two must never be shown together.** |
| Full airbox group (body + collar + boss) | **750** | **353** | The coaxial collar/boss is inside the filter's base cone; hiding only the body would still leave an overlap. |
| Stock exhaust envelope | 0 | 0 | No interaction |
| Shroud envelope | 0 | 0 | No interaction |

The airbox result is a warning for option 2(b)/(c): showing the M14 stock airbox with the V2 filter is not a small fix — the body envelope overlaps by 240 triangles and the full group (body + collar + boss) by 750. The whole V2 group (or the whole stock intake) must be hidden, not just a seam.

### 2.6 V1, V3 and V4 — what the spec may have missed

| Variant | Triangles | Envelope interaction with the stock radiator / intercooler | Minimum vertex distance | Other stock parts |
| --- | ---: | --- | ---: | --- |
| **V1 turbo_large** | 3,204 | **0 / 0** vertices and triangles | 602.88 mm radiator, 664.88 mm IC | Clear of airbox/exhaust/shroud |
| **V3 exhaust_4in** | 2,436 | **0 / 0** | 763.80 mm radiator, 825.80 mm IC | **938 triangles / 411 vertices inside the stock exhaust envelope** — the yield is required, not optional |
| **V4 intercooler_upgraded** | 1,520 | **0 / 0** | 45.00 mm radiator, 48.88 mm IC (30.00 mm X to the stock IC at 712 vs 682) | Clear of airbox/exhaust/shroud |

The V4/radiator AABB overlap looks alarming on paper — V4's AABB is X 80.55…682.00, Y 472.68…696.00, Z −20…338, and the radiator is X 650…706, Y ±500, so the boxes overlap in X 650…682, Y 472…500, Z −20…338. But the actual V4 mesh does not fill that corner: it has **0 triangles** inside the radiator box, and its nearest vertex is (670, 545, −8), **45.00 mm outboard** of the radiator's Y = +500 face. The spec's statement that V4 and the stock intercooler do not intersect is correct (30 mm X); the V4/radiator AABB overlap is a false positive, now checked at triangle level. No missed V4/radiator conflict exists in the frozen asset.

V1 and V3 are far behind the front stack (≥602.88 mm and ≥763.80 mm); no missed envelope interaction.

**The one interaction the spec did not state explicitly is V2 vs the stock airbox body (240 triangles).** It is harmless under the recommended rule because V2 suspends the Vehicle context and the airbox hides under M8, but it rules out any "show the stock airbox next to the V2 filter" hybrid.

---

## 3. Visibility: can the intersection actually be seen?

### 3.1 Cameras

The five pinned M14 frames are used exactly as in spec §8; the typical views are my chosen bay angles, all at 42° vertical FOV, 1024×640.

| Label | Camera (m) → target (m) | Note |
| --- | --- | --- |
| RF-23 / RF-27 | (1.400, −1.900, 1.000) → (0.350, −0.150, 0.300) | RH front three-quarter; the primary Vehicle beauty pose |
| RF-24 | (0.450, 1.250, 0.750) → (0.580, 0.000, 0.220) | LH outboard profile (fan/shroud) |
| RF-25 | (0.350, −1.350, 0.750) → (−0.850, −0.200, −0.120) | rear-right, exhaust; the front stack is **behind** this camera |
| RF-26 | (1.600, 0.700, 0.900) → (0.600, 0.000, 0.250) | front-left section X = 690 (section cut not modelled in this ray test) |
| front | (2.000, 0.000, 0.500) → (0.500, 0.000, 0.300) | straight front |
| front34_RH | (1.600, −1.300, 0.800) → (0.500, −0.150, 0.320) | slightly wider RH three-quarter |
| top | (0.500, 0.000, 2.000) → (0.500, 0.000, 0.250) | top-down into the bay |
| rear_RH | (−0.700, −1.200, 0.700) → (0.500, −0.300, 0.350) | behind-right, looking forward |
| LH | (0.400, 1.600, 0.800) → (0.500, 0.000, 0.300) | LH side |

### 3.2 The buried fragments are fully occluded

I ray-cast from each camera to all 16 unique inside-solid points (10 radiator + 6 intercooler) and recorded the first hit. **0 of 16 are visible from every camera.** The first hit is always the filter's own outboard surface or a stack face in front of the point.

| Camera | Representative point | First occluder | Occluder distance vs point distance |
| --- | --- | --- | --- |
| RF-23 | radiator deep surface (676.86, −473.81, 361.56) | filter's own outboard surface | hit 118.4 mm in front, at (726.6, −571.9, 405.5) |
| RF-23 | intercooler deep surface (723.93, −507.58, 352.25) | intercooler RH face Y = −520 | hit 15.0 mm in front, at (730.0, −520.0, 358.0) |
| front | radiator deep surface | intercooler front face X = 760 | hit 88.7 mm in front, at (760.0, −444.0, 370.3) |
| front | intercooler deep surface | intercooler front face X = 760 | hit 39.0 mm in front, at (760.0, −493.2, 356.4) |
| front34_RH | radiator deep surface | intercooler RH face Y = −520 | hit 73.5 mm in front, at (728.5, −520.0, 386.1) |
| front34_RH | intercooler deep surface | filter's own outboard surface | hit 47.1 mm in front, at (756.6, −537.1, 369.0) |
| top | radiator deep surface | radiator top face Z = 420 | hit 61.2 mm in front, at (670.6, −456.9, 420.0) |
| top | intercooler deep surface | intercooler top face Z = 410 | hit 60.9 mm in front, at (716.1, −489.8, 410.0) |
| rear_RH | radiator deep surface | radiator rear face X = 650 | hit 13.6 mm in front, at (665.1, −480.0, 364.4) |
| rear_RH | intercooler deep surface | filter's own outboard surface | hit 180.6 mm in front, at (565.3, −584.7, 391.0) |
| LH / RF-24 | radiator deep surface | radiator (RH side tank / top) | hit 210.9 mm in front |
| RF-26 | radiator deep surface | intercooler (clipped-away in the real section) | hit 142.8 mm in front |

RF-25 is not a test of the front seam: the camera is at X = 0.35 m, in front of the radiator (X 0.65 m), looking rearward; the front stack is behind it. Every inside point there is occluded by the filter itself.

### 3.3 The entry seam is visible

The buried fragments are not the visual problem. The **entry seam** — where the filter surface meets the radiator/IC surface — is. I classified every visible filter pixel by its distance to the notched radiator solid and the IC box. The table counts visible filter pixels **within 2 mm outside** the solid; those are the pixels adjacent to the entry line, i.e. the visible tell. (The exact intersection line is the boundary between those pixels and the occluded interior.)

| Camera | Visible seam px, radiator | Visible seam px, intercooler | Screen region (px) |
| --- | ---: | ---: | --- |
| **RF-23 / RF-27** | **9** | **1** | rad X 554…563, Y 334…344; IC X 583, Y 373 |
| front | 24 | 0 | rad X 199…215, Y 258…259 (a 2-px line) |
| front34_RH | 25 | 9 | rad X 430…443, Y 322…344; IC X 443…453, Y 349…368 |
| **top** | **48** | **11** | rad X 588…603, Y 552…584; IC X 621…622, Y 580…591 |
| **rear_RH** | **188** | 0 | rad X 625…652, Y 287…342 |
| LH / RF-24 | 59 | 0 | rad X 498…504, Y 138…194 (a 7 × 57 px sliver) |
| RF-26 (section) | 28 | 0 | rad X 265…280, Y 175…176 (the section cut is not modelled) |
| RF-25 | 0 | 0 | front stack behind the camera |

RF-27 shares RF-23's pose; the 9/1 counts are the **opaque** geometry at that pose, not the X-Ray render (X-Ray ghosting is not modelled; §7.4). RF-26 is the opaque geometry at its pose; the X = 690 section cut is not modelled.

The seam is the filter's upper/inboard rim crossing the radiator top face (Z ≈ 420) and the RH face (Y ≈ −500), plus the mid-cone ring crossing the intercooler's RH rear corner. In RF-23 the visible radiator seam occupies 9 pixels in a 10 × 11 px bounding box at the centre-left of the frame; the intercooler seam is a single pixel. From top-down the radiator seam is 48 pixels in a 16 × 33 px box and the IC seam 11 pixels in a 2 × 12 px box; from rear-right it is 188 pixels in a 28 × 56 px box. The buried fragments are invisible, but the **surface visibly enters the stack**.

Two caveats on the counts: (a) they are upper bounds on the seam footprint, because pixels "within 2 mm outside" include the surface immediately adjacent to the entry line; (b) they use the analytic envelopes, not the built M14 tanks. A rounded tank corner or a real relief could reduce them. They cannot make the seam zero if the built tank still fills the envelope at the entry line.

### 3.4 What this means for option 2(a)

Option 2(a) is allowed **only if the intersection is genuinely invisible in Vehicle view**. It is not:

- The buried volume is invisible, so a naive "can you see inside the envelope?" test passes.
- The entry seam is visible from the primary RH three-quarter frame (9 px), the front (24 px), the front three-quarter (25 + 9 px), top-down (48 + 11 px), rear-right (188 px) and LH (59 px).
- The strongest tell is top-down into the bay and rear-right, not RF-23. A 9-pixel seam in a 10 × 11 px box in RF-23 is marginal on its own; the top/rear views make it a real artifact, not a pixel-hunting one.

**2(a) is rejected.** The filter visibly plunges into the radiator's RH top/rear corner. If the owner's only criterion were RF-23 at normal viewing size, 9 px might be argued away; the task's condition is "genuinely invisible", and it is not met.

---

## 4. The options

### 4.1 Behaviour matrix

| Option | V2 `intake_highflow` | V3 `exhaust_4in` | V4 `intercooler_upgraded` | V1 `turbo_large` |
| --- | --- | --- | --- | --- |
| **1. OD-2 as drafted** | Vehicle suspends; all five stock parts withheld; internals visible | stock exhaust hides; V3 shows | stock intercooler hides; V4 shows | no stock part hides |
| **2(a) tolerate V2** | V2 and the stock stack co-render; airbox hides under M8 | stock exhaust hides | stock intercooler hides | no yield |
| **2(b) stock intake in Vehicle** | V2 group hidden; stock M10 intake + M14 airbox shown | stock exhaust hides | stock intercooler hides | no yield |
| **2(c) filter-only yield** | V2 filter meshes hidden; V2 tube + stock airbox shown | stock exhaust hides | stock intercooler hides | no yield |
| **3. Interim permanent** | Vehicle suspends | Vehicle suspends | Vehicle suspends | no yield |
| **4. Resolver priority (recommended)** | `frontStackConflict`; Vehicle suspends | stock exhaust yields | stock intercooler yields | no yield |

### 4.2 Cost matrix

| Option | Geometry basis | Budget impact | Test/spec impact | Effect on interim rule | Verdict |
| --- | --- | --- | --- | --- | --- |
| **1. OD-2 as drafted** | V2 filter intersects both envelopes (49/29 tri, 5,339/2,027 mm², 26.19/11.93 mm); V3 overlaps stock exhaust (938 tri); V4 is a second core 30 mm from the stock IC and its nearest vertex is 45.00 mm from the radiator envelope | None. Engine state unchanged (310,900 / 319,128 / 872); vehicle guard 70,364 / 81,164 already includes V2's 2,600 cap. Hiding the IC or exhaust reduces the vehicle state; V2 suspends it. No D-033 amendment. | `computeStockHardwareVisibility` yields; `frontStackConflict` V2-only; test 6 per-part expectations; geometry audit strengthened to 10/6 solid vertices, 49/29 tri and primitive 2; acceptance 8; UI note; spec §2.4/§6.7/§9/§10.2/§12.2/§2.8/§15.5/§15.7. | Replaces it; narrows suspension to V2; adds V3/V4 yields. | **Recommended outcome** (formulated as option 4) |
| **2(a) tolerate** | Same V2 geometry; the seam is visible (9/24/25+9/48+11/188/59 px) | No cap issue: vehicle actual 70,364 + 2,560 = 72,924 < 81,164. V2 adds 4 draw calls; still < 120. | Remove `frontStackConflict`; test 6 shows V2 co-visible; geometry audit becomes a recorded limitation; acceptance 8 adds V2 + Vehicle; UI note removed; spec §2.4/§6.7 rewritten to "tolerated". | Removed. | **Rejected**: fails the "genuinely invisible" condition |
| **2(b) stock intake** | V2 group hidden; stock intake/airbox shown. The stock airbox overlaps the V2 filter by 240 tri, so the whole V2 group must hide. | Lower: V2's 2,560 tri not rendered; vehicle state ≈69,604 + V3/V4 effects. | New context override in the M8 variant visibility; test 6 and M8 visibility tests; UI note "Vehicle shows the stock intake; high-flow is in Engine view"; spec §6.7/§9/§10.2. | Replaced with a context override + V3/V4 yields. | **Rejected**: the Vehicle view would show a stock intake while the build has a high-flow one; contradicts M8's replacement and misrepresents the build |
| **2(c) filter-only** | Filter meshes hidden by material; V2 tube + stock airbox shown. New sub-mesh rule; the tube/coupler vs airbox corner is a small residual overlap. | Lower: filter's 480 tri hidden; tube/couplers 2,080 tri remain. | New rule keyed to `mat_intake_filter_gauze`/`mat_intake_filter_cap_steel`; asset-contract dependency; test 6; UI note; spec §6.7/§9/§10.2. | Replaced with a filter-only yield + V3/V4 yields. | **Rejected**: fabricates a "high-flow tube + stock airbox" configuration that is not the selected kit; removes the open filter that is V2's signature; more code than suspension |
| **3. Interim permanent** | V3/V4 have clean per-part yields but are suspended for a strict stock-only context; V2 conflicts. | No D-033 change; engine state unchanged; vehicle guard unchanged for the stock/V1 state; no new triangles. | Rewrite test 6 to suspension-for-all; remove the V4/V3 yield text; UI note; spec §2.4/§6.7/§9/§10.2/§12.2. | Makes it permanent. | **Runner-up, rejected**: over-broad. V3/V4 have clean, necessary yields and no intersection; suspension withholds two usable combinations for no geometric reason and costs the owner the fun of seeing those builds in the bay. |
| **4. Resolver priority** | Same as option 1 (V2 conflict; V3/V4 yields; V1 no-op), expressed as one data table. | Same as option 1: no D-033 change. | `computeStockHardwareVisibility` is a table lookup; test 6 is table-driven; acceptance 8; UI note; spec §2.4/§6.7/§9/§10.2/§12.2. | Replaces it with one rule; suspension only V2; yields V3/V4. | **Recommended** |

### 4.3 Why the interim rule is over-broad

The interim rule suspends for **any** of V2/V3/V4. That is defensible as a build convenience, but not as a realism rule:

- **V3 and V4 have no intersection with the stock front stack.** V3's only conflict is the stock exhaust (938 triangles) — exactly the part the yield hides. V4's only conflict is the stock intercooler conceptually (two cores, 30 mm apart in X); its nearest vertex is 45.00 mm from the radiator envelope (vertex-level). Neither has a V2-style through-stack problem.
- **V3 and V4 are the app's established M8 displays.** V4 is shown at its documented `if_hot_side_inlet` service point in every exterior view; V3 is a representative 4-inch section. The owner already sees both in Engine view (RF-8/RF-9). The Vehicle view adds the stock truck hardware around them; it does not create a new falsehood. The M8 known limitations (service point, representative section) remain recorded, but they are not made worse by the Vehicle context.
- **Suspension costs the fun the view exists for.** The owner's goal is a simulation for fun: if the build has a 4-inch exhaust or an upgraded intercooler, the owner wants to see it with the truck hardware. Suspending for V3/V4 withholds exactly that, while the geometry supports a clean yield.

The one part of the interim rule that survives is the V2 suspension, for the reasons in §2–§3. The recommendation is therefore: **keep the interim rule's V2 behaviour, drop its V3/V4 behaviour.**

If the owner's priority is a strict "stock-only" Vehicle context (no modified vehicle-side part in the bay at all), option 3 is the clean alternative and is the only other defensible choice. The report does not recommend it because it withholds two clean combinations and because the V3/V4 representations are already accepted in Engine view.

### 4.4 Why 2(b) and 2(c) fail

- **2(b)** hides the V2 group and re-shows the stock intake/airbox. It is geometrically clean, but it shows a **stock intake while the Build panel says high-flow**. That is the same class of misrepresentation as showing the stock intercooler with V4 selected. It also requires overriding M8's replacement rule in the Vehicle context and hiding the whole V2 group; the stock airbox cannot coexist with the V2 filter (240-triangle body overlap, 750-triangle full-group overlap), so a "show both" version is impossible.
- **2(c)** hides only the filter and keeps the V2 tube, mating it to the stock airbox collar. This is geometrically almost plausible (the collar and the V2 end coupler share the axis), but it fabricates a **high-flow tube + stock airbox** configuration that the catalog does not describe; the open-element filter is the visual signature of the high-flow kit. It needs a new sub-mesh/material rule, a new test, and a new asset-contract dependency, and it still leaves a small tube/coupler vs airbox-corner overlap. More complexity, less fidelity than suspension.

### 4.5 Other 2(c) geometry resolutions considered

The task's 2(c) is a catch-all. Besides the filter-only yield above, the geometry work suggests three other ways to remove the V2 intersection; all are rejected:

| Resolution | What it does | Why it is rejected |
| --- | --- | --- |
| Hide the stock radiator + intercooler when V2 is selected | Removes the intersecting stock parts instead of the filter | Deletes the front stack, the centrepiece of the Vehicle view; the shroud and airbox would float around a missing stack, and the truck would read as having no cooling system. Worse than suspension. |
| Enlarge the radiator relief and notch the IC end tank | Cuts the filter's path out of the stock parts | The radiator relief would grow from 20 × 90 × 40 mm to roughly 41 × 42 × 110 mm, and the IC would need a separate ~15 × 15 × 70 mm notch. Both are visibly modified stock parts, not a stock truck; the relief no longer looks like the collar clearance it was designed for. It also changes the M14 asset/test bounds for a variant interaction, not a stock requirement. |
| Move the front stack forward (radiator/IC) | Moves the stock parts out of the filter's path | The radiator rear face is registered 32.2 mm ahead of the measured M10 fan (X 617.8) and the shroud flange is at X 650. Moving the stack ~50 mm forward detaches the shroud from the fan and changes the whole front-stack layout, bounds and RF-23/RF-26 framing. The fan and shroud are frozen/measured; this is not an M14 change. |

The clean alternatives are therefore the **V2 suspension** (option 1/4) or a **build misrepresentation** (2b/2c). The report chooses suspension.

---

## 5. Recommendation

**Adopt one resolver-level priority rule with per-variant data.** The rule belongs in the planned `src/renderer/vehicleHardware.ts` / `sceneContext.ts` seam (R1), not in a chain of `if (variant === ...)` statements in `engineScene.ts`:

```ts
// One table, one resolver. A stock part yields to the variant that owns its slot.
// A variant with a verified geometric conflict and no yielding stock part suspends
// the Vehicle context; all five stock parts are withheld, and the internals stay visible.
const STOCK_PART_YIELDS = {
  intercooler: 'intercooler_upgraded',
  exhaust: 'exhaust_4in',
} as const;

const VARIANT_CONFLICTS = {
  intake_highflow: ['radiator', 'intercooler'], // verified: filter gauze, not the tube
} as const;

export function computeStockHardwareVisibility(activeVariantIds: readonly string[]): {
  visible: Readonly<Record<StockHardwarePart, boolean>>;
  frontStackConflict: boolean;
};
```

The data produces:

| Active variant(s) | Visible stock hardware | `frontStackConflict` |
| --- | --- | --- |
| none / V1 / pistons / rods | all five | false |
| V4 | airbox, radiator, shroud, exhaust (IC hidden) | false |
| V3 | airbox, radiator, shroud, intercooler (exhaust hidden) | false |
| V3 + V4 | airbox, radiator, shroud | false |
| V2 (alone or with V3/V4) | none | true |

**Why this is the recommendation, in realism terms:**

1. **V2 cannot be shown with the stock stack without a visible seam.** The conflict is the filter's wide base rim, not the tube. The tube is clear; the filter is not, and the existing relief only clears 26.6 % of the overlap. Hiding the V2 group (2b) or the filter (2c) would show a build the owner did not select; tolerating (2a) leaves a visible seam. Suspension is the honest state, and the UI note tells the owner why.
2. **V3 and V4 can be shown cleanly.** V3's stock exhaust must hide (938 triangles of overlap), and V4's stock intercooler must hide (two cores); those are exactly the per-part yields. The rest of the truck hardware stays, the modified part shows at its established M8 position, and the vehicle budget is unchanged.
3. **The rule is one table, not four special cases.** A future fifth variant, a changed asset, or a new stock part is a data edit plus the existing tests, not a new branch in `engineScene.ts`.

The cost is stated plainly: V2 + Vehicle is unavailable; the owner can see V2 in Engine view. V3/V4 keep their M8 service-point/representative-section limitations, recorded in M8 and unchanged by M14.

---

## 6. Drafted OD-2 resolution text for D-049

> **Owner Decision OD-2 (for owner approval): Vehicle-view stock-hardware precedence.** Stock-hardware visibility in the `Vehicle` context is resolved by **one priority rule**: a stock part yields to the variant that owns its slot; a variant with a verified geometric conflict and no yielding stock part **suspends the Vehicle context** (`frontStackConflict`), with the internals visible and all five stock parts withheld. The per-variant outcomes are:
>
> - **V1 `turbo_large`:** no stock part hides; airbox, radiator, shroud, intercooler and exhaust all show. V1 clears the front stack by ≥602.9 mm (nearest vertex).
> - **V4 `intercooler_upgraded`:** the **stock intercooler core hides**; V4 shows at its frozen `if_hot_side_inlet` service point; airbox, radiator, shroud and exhaust show. V4 and the stock IC are two different cores 30.0 mm apart in X; V4's nearest vertex is 45.0 mm from the radiator envelope (vertex-level). V4 is not moved to the stock-core position.
> - **V3 `exhaust_4in`:** the **stock exhaust continuation hides**; V3 shows; airbox, radiator, shroud and intercooler show. V3 overlaps the stock exhaust envelope (938 triangles), so the yield is required; V3 clears the radiator/intercooler by ≥763.8 mm (nearest vertex).
> - **V2 `intake_highflow`:** the **Vehicle context suspends** (`frontStackConflict = true`); the internals stay visible and **all five stock parts are withheld**; no V2/hardware intersection renders. The UI note says the Vehicle view is unavailable with the high-flow intake; deselecting V2 resumes it. Any combination containing V2 suspends; V3 + V4 hides both of their stock parts and leaves airbox/radiator/shroud.
>
> **Geometry basis (re-verified from the frozen GLB, not the spec's first wording).** The conflict is the V2 **filter gauze** (primitive 2, `mat_intake_filter_gauze`), not the intake tube. After the project conversion, V2 has **14 vertices inside the stock radiator envelope and 6 inside the stock intercooler envelope**; the radiator's existing 20 × 90 × 40 mm RH rear-corner relief leaves **10 / 6** inside the solid; the triangle-level audit gives **49 / 29** intersecting triangles, **5,339 / 2,027 mm²** of filter surface, and maximum penetrations of **26.19 / 11.93 mm**. The intake tube (primitive 0) and silicone couplers (primitive 1) have **0** vertices/triangles in either envelope; the tube ends at X = 611.2 mm, behind the radiator rear face at X = 650 mm. The buried filter fragments are fully occluded (0 of 16 inside-solid vertices visible from RF-23…RF-27 and the typical front/front-three-quarter/top/LH/rear views), but the entry seam is visible (9 px at RF-23, 24 px at front, 25 + 9 px at front three-quarter, 48 + 11 px top-down, 188 px rear-right, 59 px LH), so tolerating the intersection is rejected.
>
> **Interim rule:** **not** made permanent. It is replaced by the rule above; suspension is narrowed to V2, and V3/V4 use their per-part yields.
>
> **If approved after the interim build, the minimal changes are:** (1) `computeStockHardwareVisibility()` gains the `intercooler ← intercooler_upgraded` and `exhaust ← exhaust_4in` yield entries and sets `frontStackConflict` only for an active/loaded V2; (2) `src/renderer/vehicleHardware.test.ts` test 6 is restored to the per-part expectations (`['intake_highflow']` shows none; `['intercooler_upgraded']` hides the IC; `['exhaust_4in']` hides the exhaust; combinations as above) and its geometry audit is strengthened from **14/6 vertices** to **10/6 solid vertices, 49/29 triangles, and primitive 2 / `mat_intake_filter_gauze`**, with V1/V3/V4 at zero; (3) browser acceptance 8 and the §10.2 UI note are updated — the note's "its frozen tract occupies the stock front-stack space" becomes "its frozen filter occupies the stock front-stack space"; (4) spec §2.4/§6.7/§9 test 6/§12.2 wording is aligned. No asset, catalog, budget, D-033, interface or frozen-file change is needed. The planned `src/renderer/sceneContext.test.ts` truth table keys `frontStackConflict` as an input, so it needs no new row; only the value's source changes.
>
> **Frozen:** the V2 tract GLB is **not** re-authored; the catalog is **not** changed; the M8 assets are **not** moved; the V2 filter is **not** relocated; the M14 hardware asset, its bounds and its radiator relief are unchanged. The V4/V3 service-point/representative-section limitations recorded in M8 remain, and the Vehicle view does not claim they are truck-installation geometry.
>
> **Residual risk:** the M14 radiator and intercooler are analytic envelopes/placeholders; the built tanks may be rounded or locally smaller, which can only reduce the measured overlap. The build should re-run the 10/6 + 49/29 audit against the built GLB and re-check the RF-23/top/rear seam before closing G-FRAME-M14. If the built radiator's relief or the IC's end-tank shape removes the seam entirely, option 2(a) could be revisited; until then it is rejected.

---

## 7. What I could not verify

1. **No WebGL render.** The visibility numbers are a software ray cast and a 1024×640 z-buffered classification, not the production renderer. The app's materials, shadows, X-Ray ghosting and tone mapping can change the salience of a 9–188 px seam; the build's G-FRAME-M14 captures are the real gate.
2. **No built M14 hardware asset in this clone.** The radiator and intercooler are the spec's analytic envelopes, including the 20 × 90 × 40 mm relief. The actual `vehicle_hardware_stock.glb` may have rounded tanks, a different local corner, or a larger effective relief; that can only reduce the overlap, but it is not measured here. The intercooler's **76.2 mm stubs** are also outside the core envelope and are not modelled; if a stub sits at the RH end tank near the filter's entry, the real overlap could be larger than the envelope test. The build must re-run the audit against the built GLB and check the stubs.
3. **The V2 filter is a coarse tessellation.** The 14/6 vertices and 49/29 triangles are exact for the committed mesh; the true surface (a smooth cone with pleats) would have a slightly different clipped area. The 5,339/2,027 mm² and 26.19/11.93 mm are sampling estimates (24–30 subdivisions), not an analytic integral; the triangle counts and vertex counts are exact.
4. **X-Ray and Section were not modelled.** RF-27 ghosts the hardware and shell; a ghosted radiator changes the read of the buried filter (it may be visible through the ghost), which is not modelled here, so no claim is made either way. RF-26 cuts the radiator at X = 690 and clips the intercooler away; the filter is an external variant and its clipping behaviour under Section is not verified here. These are additional reasons not to rely on 2(a).
5. **The M14 build branch's actual interim implementation is not in this clone.** The recommendation names the functions/tests from the planning spec; the build's exact names may differ. The minimal-change list in §6 is written against the spec's `computeStockHardwareVisibility` / test 6.
6. **Human perception was not tested.** A 9 px seam in RF-23 may be below the owner's notice threshold; the 48/188 px top/rear seams are more likely to be noticed. The report states the geometry, not a perceptual threshold.
7. **The stock airbox body is a placeholder.** Its 240-triangle body / 750-triangle group overlap with the V2 filter is a property of the placeholder envelope; the real stock airbox is not measured. It does not affect the recommended rule because V2 suspends the context, but it rules out any "show both" hybrid.

---

## 8. Closing summary

- **Verified counts:** V2 has **14 vertices inside the stock radiator envelope and 6 inside the stock intercooler envelope** (exact, project-converted frozen GLB). Excluding the radiator's existing 20 × 90 × 40 mm relief, **10 / 6** remain in the solids; at triangle level **49 / 29** triangles and **5,339 / 2,027 mm²** of filter surface intersect, with maximum penetrations of **26.19 / 11.93 mm**. All 20 vertices belong to the **filter gauze** (primitive 2); the intake tube and couplers have **0**.
- **Recommendation in two sentences:** Adopt a resolver-level priority rule — V4 yields the stock intercooler, V3 yields the stock exhaust, V2 suspends the Vehicle context — because V3/V4 have clean, necessary per-part yields while V2's filter visibly enters the radiator/IC and has no clean fix; the interim rule's suspension for V3/V4 is over-broad. The V2 suspension is the only part of the interim rule that survives, and the build's minimal post-interim change is the two yield entries plus the V2-only conflict and the corrected test 6.
- **Branch head:** `research/m14-od2-options` at the commit that adds this file (the branch is cut from `main` @ `0a1ca79`; the exact head is the commit hash in the closing message).
