import mathutils.geometry
import mathutils
import math;

uav_loc = mathutils.Matrix.Translation((0,0,25))
uav_rot = mathutils.Matrix.Rotation(math.radians(10), 4, 'X')
stickend = mathutils.Matrix.Translation((0,0,-500))
nstickend = uav_loc * uav_rot * stickend
nstickend.translation
# Vector((0.0, 86.8240737915039, -467.40386962890625))

geometry.intersect_line_plane(mathutils.Vector((0, 0, alt)), nstickend.translation, mathutils.Vector((0, 0, 0)), mathutils.Vector((0, 0, 1)))
# Vector((0.0, 4.40817403793335, -1.9073486328125e-06))