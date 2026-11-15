"""Executado pelo Blender em segundo plano durante a geração de retratos."""
import json
import math
from pathlib import Path
import sys

import bpy
from mathutils import Euler, Matrix, Vector


work, library, FORCE = sys.argv[sys.argv.index("--") + 1:]
WORK, LIBRARY = Path(work), Path(library)
CENTERS = {
    "Torso": (0, 3, 0), "Right Arm": (1.5, 3, 0), "Left Arm": (-1.5, 3, 0),
    "Right Leg": (.5, 1, -.08), "Left Leg": (-.5, 1, .035)
}
NAMES = {
    "Torso": "torso", "Right Arm": "rightArm", "Left Arm": "leftArm",
    "Right Leg": "rightLeg", "Left Leg": "leftLeg"
}
SHOULDERS = {
    "Right Arm": Vector((1.12, 0, 3.83)),
    "Left Arm": Vector((-1.12, 0, 3.83)),
}
GRIP = Vector((.47, .44, -1.75))
HANGER = Vector((1.16, -.34, 1.75))
GUARD_Z = -.23
MOUTH_Z = .20
TIP_Z = -1.85
FPS = 30
POSES = {
    # (right shoulder in degrees, blade direction in world coordinates, left shoulder)
    "fab": (
        ((96, -34, -21), (.65, .42, .63), (10, 10, 0)),
        ((82, -37, -27), (.44, .11, .89), (3, 8, 0)),
        ((77, -41, -25), (.76, .40, .52), (-8, 6, 0)),
    ),
    "eb": (
        ((105, -15, -6), (-.32, .46, .83), (11, 4, 0)),
        ((94, 13, 14), (-.14, .15, .97), (-5, 4, 0)),
        ((69, -22, -20), (.63, .57, -.53), (-9, 6, 0)),
    ),
    "mb": (
        ((102, -31, -18), (.74, .59, .32), (12, 13, 0)),
        ((105, -4, 12), (-.16, -.19, .97), (0, 8, 0)),
        ((86, -24, -15), (.43, .86, -.32), (-10, 5, 0)),
    ),
    "pm": (
        ((96, -16, -7), (-.64, .43, .64), (14, 5, 1)),
        ((82, -38, -15), (.42, .82, .38), (4, 12, 0)),
        ((102, -12, 0), (.14, .19, .97), (-5, 5, 0)),
    ),
    "cbm": (
        ((71, -38, -18), (.72, .22, -.65), (10, 15, 0)),
        ((106, -25, -9), (.36, .23, .90), (4, 10, 0)),
        ((98, 3, 8), (-.37, .55, .75), (-7, 6, 0)),
    ),
}
STANCE = {
    "fab": ((-3, -4, -8), (0, -3, -10), (3, 2, -6)),
    "eb": ((-4, 3, 10), (1, 0, 7), (3, -3, -6)),
    "mb": ((-3, -5, -12), (-1, 3, 8), (3, -2, -6)),
    "pm": ((-3, 3, 10), (-3, -6, -11), (0, -2, -4)),
    "cbm": ((4, -5, -10), (-2, -6, -8), (0, 3, 5)),
}


def to_blender(point):
    x, y, z = point
    return Vector((x, -z, y))


def shader(material, image, masked=False):
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    bsdf = next(node for node in nodes if node.type == "BSDF_PRINCIPLED")
    for prop in ("Base Color", "Alpha"):
        for link in list(bsdf.inputs[prop].links):
            links.remove(link)
    image.image.colorspace_settings.name = "sRGB"
    links.new(image.outputs["Color"], bsdf.inputs["Base Color"])
    if masked:
        links.new(image.outputs["Alpha"], bsdf.inputs["Alpha"])
    bsdf.inputs["Metallic"].default_value = 0
    bsdf.inputs["Roughness"].default_value = .84


def body_material(name):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    node = material.node_tree.nodes.new("ShaderNodeTexImage")
    node.image = bpy.data.images.load(str(WORK / f"{NAMES[name]}.png"), check_existing=True)
    shader(material, node)
    return material


def rotation(angles):
    return Euler(tuple(map(math.radians, angles)), "XYZ").to_quaternion()


def fabric_uv(name, face, positions, atlas):
    points = [Vector(positions[index]) for index in face]
    normal = (points[1] - points[0]).cross(points[2] - points[0])
    axis = max(range(3), key=lambda i: abs(normal[i]))
    if axis == 0:
        direction = "R" if normal.x > 0 else "L"
    elif axis == 1:
        direction = "U" if normal.y > 0 else "D"
    else:
        direction = "F" if normal.z < 0 else "B"
    key = "T" if name == "Torso" else name[0]
    left, top, width, height = atlas[key][direction]
    scale = 2 if name == "Torso" else 1
    for point in points:
        x, y, z = point.x / scale + .5, point.y / 2 + .5, point.z + .5
        u, t = {
            "F": (1-x, 1-y), "B": (x, 1-y), "R": (1-z, 1-y),
            "L": (z, 1-y), "U": (1-x, 1-z), "D": (1-x, z)
        }[direction]
        yield ((left + .4 + u*(width-.8))/585, 1-(top+.4+t*(height-.8))/559)


def add_body(rig, atlas):
    scene = bpy.context.scene
    parts = {}
    for name, center in CENTERS.items():
        body = rig[name]
        anchor = Vector(center)
        pivot = SHOULDERS.get(name, Vector((0, 0, 0)))
        co = [to_blender(Vector(point) + anchor) - pivot for point in body["v"]]
        mesh = bpy.data.meshes.new(name)
        mesh.from_pydata(co, [], body["f"])
        mesh.update()
        uv = mesh.uv_layers.new(name="Roupa clássica")
        for poly in mesh.polygons:
            coords = fabric_uv(name, body["f"][poly.index], body["v"], atlas)
            for corner, point in zip(poly.loop_indices, coords):
                uv.data[corner].uv = point
        obj = bpy.data.objects.new(name, mesh)
        obj.data.materials.append(body_material(name))
        scene.collection.objects.link(obj)
        obj.location = pivot
        obj.rotation_mode = "QUATERNION"
        parts[name] = obj
    return parts


def finish(name, color, metallic, roughness):
    material = bpy.data.materials.new(name)
    material.diffuse_color = (*color, 1)
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    return material


def prop(name, parent, material, smooth=True):
    obj = bpy.context.object
    obj.name = name
    obj.parent = parent
    obj.data.materials.append(material)
    if smooth:
        for polygon in obj.data.polygons:
            polygon.use_smooth = True
    return obj


def oval(name, parent, material, center, shape):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, location=center)
    obj = prop(name, parent, material)
    obj.scale = shape
    return obj


def collar(name, parent, material, z, radius, depth, aspect=1):
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=radius, depth=depth, location=(0, 0, z))
    obj = prop(name, parent, material)
    obj.scale.y = aspect
    bevel = obj.modifiers.new("Borda arredondada", "BEVEL")
    bevel.width, bevel.segments = min(.012, depth * .28), 3
    obj.modifiers.new("Normais das bordas", "WEIGHTED_NORMAL")
    return obj


def tube(name, parent, material, points, radius):
    return strokes(name, parent, material, (points,), radius)


def strokes(name, parent, material, paths, radius):
    curve = bpy.data.curves.new(name, "CURVE")
    curve.dimensions = "3D"
    curve.bevel_depth, curve.bevel_resolution = radius, 3
    curve.resolution_u = 8
    for path in paths:
        spline = curve.splines.new("BEZIER")
        spline.bezier_points.add(len(path) - 1)
        for point, co in zip(spline.bezier_points, path):
            point.co = co
            point.handle_left_type = point.handle_right_type = "AUTO"
    obj = bpy.data.objects.new(name, curve)
    bpy.context.scene.collection.objects.link(obj)
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.convert(target="MESH")
    return prop(name, parent, material)


def loft(name, parent, material, rings):
    size = len(rings[0])
    faces = [tuple(reversed(range(size)))]
    for start in range(0, (len(rings) - 1) * size, size):
        for i in range(size):
            a, b = start+i, start+(i+1) % size
            faces.append((a, b, b+size, a+size))
    faces.append(tuple(range((len(rings) - 1) * size, len(rings) * size)))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata([point for ring in rings for point in ring], [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.parent = parent
    mesh.materials.append(material)
    return obj


def group(name):
    obj = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(obj)
    obj.rotation_mode = "QUATERNION"
    return obj


def upper_body(parts, identity, sword, sheath):
    pivot = group("Postura do tronco")
    pivot.location.z = 1.99
    bpy.context.view_layer.update()
    shift = pivot.matrix_world.inverted()
    for obj in (parts["Torso"], parts["Right Arm"], parts["Left Arm"], *identity, sword, sheath,
                bpy.data.objects["Presilhas de couro"]):
        obj.parent = pivot
        obj.matrix_parent_inverse = shift
    return pivot


def scrollwork(x, y, start, end, width, count):
    step = (end - start) / count
    paths = [[(x + width*.18*math.sin(i*math.pi/2), y, start+i*step/4)
              for i in range(count*4 + 1)]]
    for i in range(count):
        z = start + (i+.5)*step
        direction = width if i % 2 == 0 else -width
        paths.append([(x, y, z-step*.29), (x+direction*.88, y, z-step*.1),
                      (x+direction, y, z+step*.16), (x+direction*.36, y, z+step*.29),
                      (x+direction*.23, y, z+step*.08)])
    return paths


def sword_hilt(sword, gold, rim, pearl, engraving):
    oval("Punho marfim", sword, pearl, (0, 0, .022), (.084, .075, .211))
    for i in range(9):
        collar("Friso do punho", sword, gold, -.146+i*.039, .083, .009, .89)
    tube("Espinha dourada do punho", sword, gold, [(-.064, 0, -.193), (-.075, 0, -.09),
         (-.088, 0, .085), (-.106, 0, .18), (-.091, 0, .236)], .031)
    oval("Pomo em voluta", sword, gold, (-.067, 0, .233), (.105, .086, .079))
    oval("Florão do pomo", sword, rim, (-.087, .069, .245), (.063, .027, .058))
    oval("Centro do pomo", sword, engraving, (-.087, .092, .245), (.037, .009, .035))

    # Swept crossguard, with a crest and matching terminals.
    section = ((-.052,-.022), (.052,-.022), (.05,.017), (-.05,.017))
    for side in (1, -1):
        rings = [[(side*x,y,GUARD_Z+shift+z) for y,z in section]
                 for x,shift in ((0,0), (.11,0), (.19,.024), (.255,.060), (.286,.080))]
        guard = loft("Ala da guarda em cruz", sword, gold, rings if side == 1 else list(reversed(rings)))
        bevel = guard.modifiers.new("Friso da guarda", "BEVEL")
        bevel.width, bevel.segments = .012, 3
        oval("Florão da guarda", sword, rim, (side*.273, .018, GUARD_Z+.08), (.053, .066, .041))
        paths = [[(side*.274, .08, GUARD_Z+.078),
                  (side*.274+.032*math.cos(i*math.tau/7), .073, GUARD_Z+.078+.025*math.sin(i*math.tau/7))]
                 for i in range(7)]
        paths.append([(side*.105, .055, GUARD_Z), (side*.17, .057, GUARD_Z+.03),
                      (side*.22, .058, GUARD_Z+.05), (side*.237, .059, GUARD_Z+.07)])
        strokes("Gravação da guarda", sword, engraving, paths, .004)
    oval("Medalhão central da guarda", sword, gold, (0, .018, GUARD_Z), (.108, .087, .060))
    oval("Brasão em relevo", sword, rim, (0, .102, GUARD_Z), (.068, .013, .042))
    strokes("Raios do brasão", sword, engraving,
            [[(0,.115,GUARD_Z), (.04*math.cos(i*math.tau/8), .11, GUARD_Z+.025*math.sin(i*math.tau/8))]
             for i in range(8)], .003)


def sword_blade(sword, steel, gold, engraving):
    section = ((-1,0), (-.71,1), (.66,1), (1,0), (.66,-1), (-.71,-1))
    sizes = ((GUARD_Z,.077,.039), (-.37,.077,.037), (-.45,.076,.035),
             (-1.44,.060,.026), (-1.52,.055,.022), (-1.73,.042,.014), (TIP_Z,.007,.005))
    blade = loft("Lâmina facetada", sword, steel,
                 [[(x*w,y*d,z) for x, y in section] for z,w,d in sizes])
    blade.data.materials.append(gold)
    for polygon in blade.data.polygons:
        if polygon.index in (14, 17, 20, 23):
            polygon.material_index = 1
    for side in (1,-1):
        paths = scrollwork(0, 0, -.435, -1.48, .032, 8)
        strokes("Arabescos da lâmina", sword, engraving,
                [[(x,side*(.0355 + (z+.45)*.0091),z) for x,_,z in path] for path in paths], .0034)


def sword_scabbard(sheath, gold, rim, case, engraving):

    # Inner and outer surfaces share the mouth, leaving an opening for the blade.
    rings = [
        [(w*math.cos(i*math.tau/24), d*math.sin(i*math.tau/24), z) for i in range(24)]
        for z, w, d in ((MOUTH_Z, .122, .095), (MOUTH_Z, .095, .063), (.12, .095, .063),
                        (-1.42, .070, .05), (-1.49, .055, .046))
    ]
    outer = [
        [(w*math.cos(i*math.tau/24), d*math.sin(i*math.tau/24), z) for i in range(24)]
        for z, w, d in ((MOUTH_Z, .122, .095), (-.26, .114, .087),
                        (-1.45, .088, .074), (-1.53, .068, .063))
    ]
    # Join the outer wall to the inner bevel around the open rim.
    profile = list(reversed(outer)) + rings[1:]
    shell = loft("Corpo da bainha", sheath, case, profile)
    shell.data.materials.append(gold)
    for polygon in shell.data.polygons:
        if polygon.index:
            segment = (polygon.index - 1) // 24
            polygon.material_index = int(segment in (0, 2, 3))
            polygon.use_smooth = segment in (1, 5, 6)
    collar("Ponteira dourada", sheath, gold, -1.49, .091, .125, .82)
    collar("Abraçadeira gravada", sheath, gold, -.67, .113, .147, .79)
    collar("Passador da argola", sheath, rim, -.02, .126, .043, .75)
    strokes("Arabescos da bainha", sheath, engraving,
            scrollwork(0,.091,.14,-.239,.046,4) + scrollwork(0,.089,-.603,-.736,.039,2), .004)
    ring = [(-.135 + .055*math.cos(i*math.tau/16), .055*math.sin(i*math.tau/16), -.007)
            for i in range(17)]
    tube("Argola lateral", sheath, rim, ring, .013)


def add_sabre():
    gold = finish("Dourado polido", (.70, .385, .075), .74, .29)
    rim = finish("Relevos dourados", (.91, .59, .22), .67, .26)
    engraving = finish("Gravação bronze escuro", (.245, .105, .027), .68, .41)
    pearl = finish("Punho cor de marfim", (.88, .81, .58), .08, .39)
    steel = finish("Aço polido", (.69, .79, .87), .72, .23)
    case = finish("Corpo escuro da bainha", (.015, .020, .026), .46, .26)
    strap = finish("Couro das presilhas", (.035, .024, .020), .03, .76)
    sword, sheath = group("Espada cerimonial"), group("Bainha da espada")
    sword_hilt(sword, gold, rim, pearl, engraving)
    sword_blade(sword, steel, gold, engraving)
    sword_scabbard(sheath, gold, rim, case, engraving)
    straps = [[(.98,y,2.39), (1.00, y-.045,2.24), (1.014,-.31,1.89),
               tuple(HANGER - Vector((.128, 0, 0)))] for y in (-.425,-.17)]
    strokes("Presilhas de couro", None, strap, straps, .029)
    return sword, sheath


def sword_rotation(up):
    up = up.normalized()
    lateral = Vector((1, 0, 0)) - up * up.x
    lateral.normalize()
    return Matrix((lateral, up.cross(lateral), up)).transposed().to_quaternion()


def in_scabbard(draw):
    shoulder = SHOULDERS["Right Arm"]
    offset = shoulder - HANGER
    radius = math.sqrt(GRIP.length_squared - offset.x**2)
    offset.x = 0
    distance = MOUTH_Z - GUARD_Z + draw * (GUARD_Z - TIP_Z + .034)
    along = (distance**2 + offset.length_squared - radius**2) / (2*distance*offset.length)
    towards_shoulder = offset.normalized()
    forward = Vector((0, towards_shoulder.z, -towards_shoulder.y))
    up = towards_shoulder*along + forward*math.sqrt(1 - along**2)
    grip = HANGER + up*distance
    arm = GRIP.rotation_difference(grip - shoulder)
    rotation = sword_rotation(up)
    return arm, rotation, grip


def animate(parts, sword, sheath, body):
    idle_right, idle_left = rotation((10, -14, -1)), rotation((-8, 6, 0))
    grasp, resting_sword, parked = in_scabbard(0)
    released_arm, released_sword, _ = in_scabbard(1)
    left_open = rotation((18, 12, 0))
    high, salute, recover = [
        (rotation(arm), sword_rotation(-Vector(blade)), rotation(left))
        for arm, blade, left in POSES[FORCE]
    ]
    rest = rotation((0, 0, 0))
    draw_stance = rotation((3, -3, -5))
    high_stance, salute_stance, return_stance = map(rotation, STANCE[FORCE])
    body_poses = (rest, draw_stance, draw_stance, high_stance, salute_stance, salute_stance,
                  return_stance, draw_stance, draw_stance, rest)
    scene = bpy.context.scene
    scene.render.fps = FPS
    scene.frame_end = 207
    knots = (1, 19, 39, 62, 81, 103, 124, 147, 180, scene.frame_end)
    for start, end, phase in zip(knots, knots[1:], range(len(knots)-1)):
        for frame in range(start, end + int(end == scene.frame_end)):
            t = (frame - start) / (end - start)
            t = t*t*(3 - 2*t)
            sheath_rotation = resting_sword
            if phase in (0, 8):
                approach = t if phase == 0 else 1-t
                arm = idle_right.slerp(grasp, approach)
                left = idle_left.slerp(left_open, approach)
                blade, location = resting_sword, parked
            elif phase in (1, 7):
                draw = t if phase == 1 else 1-t
                arm, blade, location = in_scabbard(draw)
                left = left_open
                sheath_rotation = blade
            else:
                ready = released_arm, released_sword, left_open
                display = (ready, high, salute, salute, recover, ready)
                current, following = display[phase-2:phase]
                arm, blade, left = (a.slerp(b, t) for a, b in zip(current, following))
                location = SHOULDERS["Right Arm"] + arm @ GRIP
                # Finish tilting the empty scabbard after the draw and raise its mouth for the return.
                amount = (1-t, 0, 0, 0, t)[phase-2]
                sheath_rotation = resting_sword.slerp(released_sword, amount)
            sword.location, sheath.location = location, HANGER
            posture = body_poses[phase].slerp(body_poses[phase+1], t)
            for obj, value in ((body, posture), (parts["Right Arm"], arm), (parts["Left Arm"], left),
                               (sword, blade), (sheath, sheath_rotation)):
                obj.rotation_quaternion = value
                obj.keyframe_insert(data_path="rotation_quaternion", frame=frame)
            sword.keyframe_insert(data_path="location", frame=frame)
    scene.frame_set(1)


def add_identity():
    bpy.ops.wm.obj_import(filepath=str(WORK / "identidade.obj"), forward_axis="NEGATIVE_Z",
                         up_axis="Y", use_split_groups=True)
    imported = [obj for obj in bpy.context.selected_objects if obj.type == "MESH"]
    head = next(obj for obj in imported if obj.name == "Player1")
    vertices = [head.matrix_world @ vertex.co for vertex in head.data.vertices]
    lower = Vector(tuple(min(point[i] for point in vertices) for i in range(3)))
    upper = Vector(tuple(max(point[i] for point in vertices) for i in range(3)))
    width = upper.x - lower.x
    if not .65 < width < 2.2:
        raise ValueError("Largura inesperada da cabeça na miniatura")
    scale = 1.2 / width
    origin = (lower + upper) / 2
    anchor = Vector((0, 0, 4 + (upper.z-lower.z)*scale/2 - .01))
    for obj in imported:
        world = obj.matrix_world.copy()
        for vertex in obj.data.vertices:
            vertex.co = (world @ vertex.co - origin) * scale + anchor
        obj.matrix_world.identity()
        for material in obj.data.materials:
            if not material or not material.use_nodes:
                continue
            image = next(node for node in material.node_tree.nodes
                         if node.type == "TEX_IMAGE" and node.image)
            shader(material, image, masked=obj is not head)
        obj.name = "Head" if obj is head else "Acessório " + obj.name
    return imported


def aim(obj, target):
    obj.rotation_euler = (Vector(target)-obj.location).to_track_quat("-Z", "Y").to_euler()


def render():
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = 12
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 720
    scene.render.resolution_y = 900
    scene.render.resolution_percentage = 100
    scene.render.threads_mode = "FIXED"
    scene.render.threads = min(8, scene.render.threads)
    scene.render.film_transparent = True
    scene.render.image_settings.color_mode = "RGBA"
    scene.view_settings.view_transform = "Standard"
    scene.world = bpy.data.worlds.new("Luz ambiente")
    scene.world.use_nodes = True
    scene.world.node_tree.nodes["Background"].inputs[0].default_value = (.74, .82, 1, 1)
    scene.world.node_tree.nodes["Background"].inputs[1].default_value = .36
    for location, energy, size, color in (
        ((-4.1, 6.5, 8), 1050, 5, (1, .9, .76)),
        ((4.2, 5.3, 5.5), 520, 4, (.78, .88, 1)),
        ((2, -4, 7), 980, 3.6, (.69, .85, 1)),
    ):
        bpy.ops.object.light_add(type="AREA", location=location)
        light = bpy.context.object
        light.data.energy, light.data.size, light.data.color = energy, size, color
        aim(light, (0, 0, 3))
    bpy.ops.object.camera_add(location=(5.6, 12.4, 5))
    camera = bpy.context.object
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = 6.73
    aim(camera, (0, 0, 2.95))
    scene.camera = camera
    scene.render.filepath = str(WORK / "retrato.png")
    bpy.ops.render.render(write_still=True)


bpy.ops.wm.read_factory_settings(use_empty=True)
parts = add_body(json.loads((LIBRARY / "R6.json").read_text()), json.loads((LIBRARY / "UV.json").read_text()))
identity = add_identity()
sword, sheath = add_sabre()
body = upper_body(parts, identity, sword, sheath)
animate(parts, sword, sheath, body)
bpy.ops.export_scene.gltf(filepath=str(WORK / "avatar-r6.glb"), export_format="GLB",
                         export_animation_mode="ACTIVE_ACTIONS", export_nla_strips_merged_animation_name="apresentacao",
                         export_anim_slide_to_zero=True, export_apply=True)
render()
