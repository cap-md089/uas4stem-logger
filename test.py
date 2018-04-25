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

print "Trying to import JSON"

import json