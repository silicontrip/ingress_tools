import json
import time
from libmproxy.protocol.http import decoded

def formatms (sec):
	s, ms = divmod(int(sec), 1000)
	return '%s.%03d' % (time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(s)), ms)


def inventory (entity):
	try:
		resource=""
		level=""
		time=formatms(entity['inInventory']['acquisitionTimestampMs'])
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
		capser = entity['moniker']['differentiator']
		object = "Capsule(" + capser + ")"
		if (resource == 'INTEREST_CAPSULE'):
			object = "MUFG Capsule(" + capser + ")"
	elif (resource == "PORTAL_LINK_KEY"):
		key = entity['portalCoupler']['portalTitle']
		object = "Key(" + key + ")"
	elif (level or rare or resource == 'FLIP_CARD'):
		object = entity['displayName']['displayName']
		object += "({0}{1})".format(level,rare)

	object = time + ":" + object
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
				name = "time_%d.txt" % epoch_time

				f = open(name,'w')
				for item in data['gameBasket']['inventory']:
					object = inventory(item[2])
					ptime=formatms(item[1])
					out= u'{1}:{0}\n'.format(ptime,object)
					f.write(out.encode("utf-8"))

                                        if 'resource' in item[2].keys():
                                                resource = item[2]['resource']['resourceType']

						if (resource == 'CAPSULE' or resource == 'INTEREST_CAPSULE'):
							capacity = item[2]['container']['currentCount']
							capsuleItems = item[2]['container']['stackableItems']
							capser = item[2]['moniker']['differentiator']

							if (capacity > 0):
								for itemc in capsuleItems:
									object = inventory(itemc['exampleGameEntity'][2])
					#				#ptime=formatms(itemc[1])
									out=u'{1}:{0}\n'.format(capser,object)
									f.write(out.encode("utf-8"))


				f.close()
