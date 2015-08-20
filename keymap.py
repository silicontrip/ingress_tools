import json
import time
from libmproxy.protocol.http import decoded

def keymap (entity,colour):
	resource = ""
	if 'resource' in entity.keys():
		resource = entity['resource']['resourceType']

	if (resource == "PORTAL_LINK_KEY"):
		location = entity['portalCoupler']['portalLocation']
		loc = location.split(",")

		point = {}
		lat = int(loc[0],16)
		lng = int(loc[1],16)
		if (lat > 2147483648):
			lat = lat - 4294967296
		if (lng > 2147483648):
			lng = lng - 4294967296
	
		point["lat"] = lat/1000000.0
		point["lng"] = lng/1000000.0

		poly = {}
		poly["type"] = "marker"
		poly["latLng"] = point
		poly["color"] = colour

		return poly

	return None

def response(context, flow):
	if (flow.request.path == "/rpc/playerUndecorated/getInventory"):
		with decoded(flow.response):
			try:
				data = json.loads(flow.response.content)
			except ValueError, e:
				return 0
			items = data['gameBasket']['inventory'].__len__()
			#raise ValueError("length: %d " % items)
			if (items > 0):
				epoch_time = int(time.time())
				name = "keymap_%d.json" % epoch_time

				markermap = []
				for item in data['gameBasket']['inventory']:
					marker = keymap(item[2],"#00a0a0")
					if marker is not None:
						markermap.append(marker)

					if 'resource' in item[2].keys():
						resource = item[2]['resource']['resourceType']

						if (resource == 'CAPSULE' or resource == 'INTEREST_CAPSULE'):
							capacity = item[2]['container']['currentCount']
							capsuleItems = item[2]['container']['stackableItems']

							if (capacity > 0):
								for itemc in capsuleItems:
									marker = keymap(itemc['exampleGameEntity'][2],"#a000a0")
									if marker is not None:
										markermap.append(marker)

				f = open(name,'w')
				f.write(json.dumps(markermap))
				f.close()
