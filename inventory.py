import json
import time
from libmproxy.protocol.http import decoded

def inventory (entity):
	try:
		resource=""
		level=""
		if 'resourceWithLevels' in entity.keys():
			resource = entity['resourceWithLevels']['resourceType']
			level = entity['resourceWithLevels']['level']

		if 'resource' in entity.keys():
			resource = entity['resource']['resourceType']

		rare = ""
		if 'modResource' in entity.keys():
			rare = entity['modResource']['rarity']

	except KeyError, e:
		raise KeyError(entity)
	
	object = 'UNKNOWN'
	if (resource == 'MEDIA'):
		medianame = entity['storyItem']['shortDescription']
		object = "Media(" + medianame + ")"
	
	elif (resource == 'CAPSULE' or resource == 'INTEREST_CAPSULE'):
		capsuleItems = entity['container']['stackableItems']
		capacity = entity['container']['currentCount']
		capser = entity['moniker']['differentiator']
		object = "Capsule()"
		if (capacity > 0):
			summary = {}
			for item in capsuleItems:
				size = item['itemGuids'].__len__()
				thisObject = inventory(item['exampleGameEntity'][2])
				summary[thisObject] = size

			if (resource == 'CAPSULE'):
				object = "Capsule(" + capser + "\n"
			else:
				object = "MUFG Capsule(" + capser + "\n"
			# ksort summary
			for k1 in sorted(summary.keys()):
				object += "    " + k1 + ":" + str(summary[k1]) + "\n"

			object += ")"

	elif (resource == "PORTAL_LINK_KEY"):
		key = entity['portalCoupler']['portalTitle']
		object = "Key(" + key + ")"
	elif (level or rare or resource == 'FLIP_CARD'):
		object = entity['displayName']['displayName']
		object += "({0}{1})".format(level,rare)

	return object

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
				name = "inv_%d.txt" % epoch_time

				summary = {}
				markermap = []
				for item in data['gameBasket']['inventory']:
					object = inventory(item[2])

					if object not in summary.keys():
						summary[object] = 0
					summary[object] += 1

				f = open(name, 'w')
				for k1 in sorted(summary.keys()):
					#f.write(u'{0}:{1}\n'.format(k1,summary[k1]))
					out = k1 + ":" + str(summary[k1]) + "\n" 
					f.write(out.encode("utf-8"))
				f.close()
