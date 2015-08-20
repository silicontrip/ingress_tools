#!/usr/bin/php
<?

$thresh = 5;

function getRGB ($h) {

	$v = 1;
	$s = 1;
	$h /= 60;
	$i = floor($h);
	$f = $h - $i;
	$p = (1 - $s);
	$q = (1 - $f);
	$t = $f;	

	$v = 255;
	$t *= 255;
	$p *= 255;
	$q *= 255;

	if ($i == 0) {
		return sprintf ("#%02X%02X%02X",$v,$t,$p);
	} else if ($i == 1) {
		return sprintf ("#%02X%02X%02X",$q,$v,$p);
	} else if ($i == 2) {
		return sprintf ("#%02X%02X%02X",$p,$v,$t);
	} else if ($i == 3) {
		return sprintf ("#%02X%02X%02X",$p,$q,$v);
	} else if ($i == 4) {
		return sprintf ("#%02X%02X%02X",$t,$p,$v);
	} else if ($i == 5) {
		return sprintf ("#%02X%02X%02X",$v,$p,$q);
	}
}

   function getDraw ($s0,$s1,$s2,$colour) {
        
        $point0 = new stdClass();
        $point1 = new stdClass();
        $point2 = new stdClass();

	$p0 = explode(",",$s0);
	$p1 = explode(",",$s1);
	$p2 = explode(",",$s2);
 

        $point0->lat = $p0[0]/1000000;
        $point0->lng = $p0[1]/1000000;
        $point1->lat = $p1[0]/1000000;
        $point1->lng = $p1[1]/1000000;
        $point2->lat = $p2[0]/1000000;
        $point2->lng = $p2[1]/1000000;

        $poly = new stdClass();
        
        $poly->type = 'polygon';
        $poly->latLngs = array($point0,$point1,$point2);
        $poly->color=$colour;
        
	return $poly;
    }



$draw = [];
$handle = fopen($argv[1], "r");
if ($handle) {
    while (($line = fgets($handle)) !== false) {

	$line= trim($line);
	$opt = explode (":",$line);


	if ($opt[4] >= $thresh && $opt[4] <= 1000000) {
		# convert mu/km to colour
		$hue = $opt[5] * 0.1 ;
	
		$colour = getRGB($hue);
	
		array_push ($draw,getDraw($opt[0],$opt[1],$opt[2],$colour));
	}

    }

    fclose($handle);
} else {
    // error opening the file.
	print "cannot open file.\n";
} 

print json_encode($draw) . "\n";

