"""Executado pelo Blender em segundo plano durante a geração de retratos."""
import json
import math
from pathlib import Path
import sys

import bpy
from mathutils import Euler, Vector


WORK, LIBRARY = map(Path, sys.argv[sys.argv.index("--") + 1:])
CENTERS = {
    "Torso": (0, 3, 0), "Right Arm": (1.5, 3, 0), "Left Arm": (-1.5, 3, 0),
    "Right Leg": (.5, 1, -.08), "Left Leg": (-.5, 1, .035)
}
NAMES = {
    "Torso": "torso", "Right Arm": "rightArm", "Left Arm": "leftArm",
    "Right Leg": "rightLeg", "Left Leg": "leftLeg"
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


def posed(positions, name):
    if name not in ("Right Arm", "Left Arm"):
        return positions
    side = 1 if name == "Right Arm" else -1
    pivot = Vector((side * 1.08, 0, 3.87))
    angles = ((8 if side == 1 else -6), -4 * side, 0)
    transform = Euler(tuple(math.radians(angle) for angle in angles), "XYZ").to_matrix()
    return [pivot + transform @ (vertex - pivot) for vertex in positions]


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
    for name, center in CENTERS.items():
        body = rig[name]
        anchor = Vector(center)
        co = [to_blender(Vector(point) + anchor) for point in body["v"]]
        mesh = bpy.data.meshes.new(name)
        mesh.from_pydata(posed(co, name), [], body["f"])
        mesh.update()
        uv = mesh.uv_layers.new(name="Roupa clássica")
        for poly in mesh.polygons:
            coords = fabric_uv(name, body["f"][poly.index], body["v"], atlas)
            for corner, point in zip(poly.loop_indices, coords):
                uv.data[corner].uv = point
        obj = bpy.data.objects.new(name, mesh)
        obj.data.materials.append(body_material(name))
        scene.collection.objects.link(obj)


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


def aim(obj, target):
    obj.rotation_euler = (Vector(target)-obj.location).to_track_quat("-Z", "Y").to_euler()


def render():
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = 16
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 720
    scene.render.resolution_y = 900
    scene.render.resolution_percentage = 100
    scene.render.threads_mode = "FIXED"
    scene.render.threads = min(4, scene.render.threads)
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
    bpy.ops.object.camera_add(location=(-5.6, 12.4, 5))
    camera = bpy.context.object
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = 6.73
    aim(camera, (0, 0, 2.95))
    scene.camera = camera
    scene.render.filepath = str(WORK / "retrato.png")
    bpy.ops.render.render(write_still=True)


bpy.ops.wm.read_factory_settings(use_empty=True)
add_body(json.loads((LIBRARY / "R6.json").read_text()), json.loads((LIBRARY / "UV.json").read_text()))
add_identity()
bpy.ops.export_scene.gltf(filepath=str(WORK / "avatar-r6.glb"), export_format="GLB")
render()
