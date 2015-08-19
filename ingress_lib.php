<?php

	function distanceGeoPoints ($p1, $p2) {
		
        $earthRadius = 6371;
		
		
        $lat1= $p1->lat;
        $lng1= $p1->lng;
        $lat2= $p2->lat;
        $lng2= $p2->lng;
		
        #       print "measure distance: $lat1,$lng1 - $lat2,$lng2\n";
		
        $dLat = deg2rad($lat2-$lat1);
        $dLng = deg2rad($lng2-$lng1);
		
		
        $a = sin($dLat/2) * sin($dLat/2) +
        cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
        sin($dLng/2) * sin($dLng/2);
        $c = 2 * atan2(sqrt($a), sqrt(1-$a));
        $dist = $earthRadius * $c;
		
        return $dist;
    }
	
	function areaFromLength($a,$b,$c) 
	{
		$s = ($a + $b + $c) / 2;
		return sqrt($s * ($s-$a) * ($s-$b) * ($s-$c));
	}
	
?>
