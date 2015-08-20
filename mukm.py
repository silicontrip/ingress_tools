import json
import time
import math
from libmproxy.protocol.http import decoded

def areaFromLength (a,b,c):
	s = (a + b + c) / 2.0
	area = math.sqrt(s * (s-a) * (s-b) * (s-c))
	return area

def distanceGeoPoints (p1, p2):
                
        earthRadius = 6371

        lat1= p1['latE6'] / 1000000.0
        lng1= p1['lngE6'] / 1000000.0
        lat2= p2['latE6'] / 1000000.0
        lng2= p2['lngE6'] / 1000000.0
                
        dLat = math.radians(lat2-lat1)
        dLng = math.radians(lng2-lng1)
                
        a = math.sin(dLat/2) * math.sin(dLat/2) + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dLng/2) * math.sin(dLng/2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a));
        dist = earthRadius * c
                
        return dist


def response(context, flow):
	if (flow.request.path == "/rpc/gameplay/getObjectsInCells"):
		with decoded(flow.response):
			try:
				data = json.loads(flow.response.content)
			except ValueError, e:
				return 0
			
			items = data['gameBasket']['gameEntities'].__len__()
			#raise ValueError("length: %d " % items)
			if (items > 0):


				epoch_time = int(time.time())
				name = "mukm_0.txt" 
				f = open(name, 'a')

				for item in data['gameBasket']['gameEntities']:
					entity = item[2]
					if 'capturedRegion' in entity.keys():

						l1 = distanceGeoPoints(entity['capturedRegion']['vertexA']['location'],entity['capturedRegion']['vertexB']['location'])
						l2 = distanceGeoPoints(entity['capturedRegion']['vertexB']['location'],entity['capturedRegion']['vertexC']['location'])
						l3 = distanceGeoPoints(entity['capturedRegion']['vertexA']['location'],entity['capturedRegion']['vertexC']['location'])

						a = areaFromLength(l1,l2,l3)
						mukm = (int(entity['entityScore']['entityScore']) * 1.0) / a
						f.write("%s" % entity['capturedRegion']['vertexA']['location']['latE6'])
						f.write(",")
						f.write("%s" % entity['capturedRegion']['vertexA']['location']['lngE6'])
						f.write(":")
						f.write("%s" % entity['capturedRegion']['vertexB']['location']['latE6'])
						f.write(",")
						f.write("%s" % entity['capturedRegion']['vertexB']['location']['lngE6'])
						f.write(":")
						f.write("%s" % entity['capturedRegion']['vertexC']['location']['latE6'])
						f.write(",")
						f.write("%s" % entity['capturedRegion']['vertexC']['location']['lngE6'])
						f.write(":")
						f.write("%s" % a)
						f.write(":")
						f.write("%s" % entity['entityScore']['entityScore'])
						f.write(":")
						f.write("%s" % mukm)
						f.write("\n")

				f.close()
