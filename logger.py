print "Start"

import sys

print "SYS libraries imported"

sys.path.extend([
    "C:\\Python27", 
    "C:\\Python27\\DLLs", 
    "C:\\Python27\\Lib", 
    "C:\\Python27\\Lib\\plat-win", 
    "C:\\Python27\\Lib\\site-packages", 
    "C:\\WINDOWS\\SYSTEM32\\python27.zip"
])

sys.path = list(set(sys.path))

# import json
# print "JSON imported"
import socket
print "Socket imported"
# import mathutils
# print "Mathutils imported"
# import mathutils.geometry
# print "Geometry imported"
import math
print "Math imported"
import thread
print "Threads imported"

print "Running"

sending = socket.socket()
sending.connect(('127.0.0.1', 54248))
receiving = socket.socket()
receiving.connect(('127.0.0.1', 1337))

print "Connected"

def buffer (string) :
    ret = []
    for i in string :
        ret.append(ord(i))
    return ret

def receiveCommand (socket) :
    while True :
        returnValue = socket.recv(4096)
        data = buffer(returnValue)
        func = data[0]

        print "Received command: ",
        print data

        if func == 1 :
            servo = data[1]
            position = data[2] * 1000
            MAV.doCommand(MAV.MAV_CMD.DO_SET_SERVO, servo, position, 0, 0, 0, 0, 0)

try :
    thread.start_new_thread(receiveCommand, tuple([receiving]))
except Exception as e :
    print "Thread error: {0}".format(e)

while True :
    # uav_loc = mathutils.Matrix.Translation((0,0,25))
    # uav_xrot = mathutils.Matrix.Rotation(math.radians(cs.pitch), 4, 'X')
    # uav_yrot = mathutils.Matrix.Rotation(math.radians(cs.roll), 4, 'Y')
    # uav_zrot = mathutils.Matrix.Rotation(math.radians(cs.yaw), 4, 'Z')
    # nstickend = uav_loc * uav_xrot * uav_yrot * uav_zrot * stickend

    # offset = geometry.intersect_line_plane(
    #     uav_loc,
    #     nstickend.translation,
    #     mathutils.Vector((0, 0, 0)),
    #     mathutils.Vector((0, 0, 1))
    # )

    csv = ','.join([
        str(cs.timeInAir),
        str(cs.lat),
        str(cs.lng),
        "true" if cs.armed else "false",
        str(cs.battery_voltage),
        str(cs.alt),
        str(cs.battery_remaining),
        str(cs.groundspeed),
        str(cs.ch3percent),
        str(cs.DistToHome),
        str(cs.verticalspeed),
        str(Script.GetParam('WPNAV_SPEED')/100),
        str(((float(Script.GetParam('LAND_SPEED'))+float(Script.GetParam('LAND_SPEED_HIGH'))+float(Script.GetParam("LAND_SPEED_HIGH")))/3)/100),
        str(cs.roll),
        str(cs.yaw),
        str(cs.pitch),
        str(cs.DistToHome / (Script.GetParam('WPNAV_SPEED')/100) + 20 + (((cs.alt - 10) / Script.GetParam('LAND_SPEED')) if cs.alt > 10 else 0) + (10 if cs.alt > 10 else cs.alt) / Script.GetParam('LAND_SPEED'))
    ]) + '\n'
    data = sending.send(csv)
    if data == 0 :
        print "Packet failed to send"

    
print "Done"