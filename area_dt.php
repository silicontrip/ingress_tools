#!/usr/bin/php
<?php
include 'ingress_lib.php';
	
	$drawtool=json_decode($argv[1]);

	foreach ($drawtool as $poly)
	{
		
		# print_r($poly);
		
		if($poly->type=="polygon")
		{
			
			# $p0 = array();
			$p0 = new stdClass();
			$p1 = new stdClass();
			$p2 = new stdClass();
			$l1 = new stdClass();
			$l2 = new stdClass();
			
			$dist1 = distanceGeoPoints ($poly->latLngs[0],$poly->latLngs[1]);
			$dist2 = distanceGeoPoints ($poly->latLngs[1],$poly->latLngs[2]);
			$dist3 = distanceGeoPoints ($poly->latLngs[2],$poly->latLngs[0]);

			$area = areaFromLength($dist1,$dist2,$dist3);
			
			print "area: $area\n";
			
			
		}
	}
	

?>
