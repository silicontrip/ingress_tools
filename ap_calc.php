#!/usr/bin/php
<?php

function print_total ($current) 
{

	$numact = 0;
	foreach ($current as $act => $times) $numact = $numact +  $times;
	print "$numact ";
	foreach ($current as $act => $times) print "$act => $times, ";
	print "\n";
}

function search($ap_values,$current,$needed,$total,$start)
{

	if ($total == $needed) {
		print_total($current);
	} else if ($total < $needed) {
		for ($n=$start; $n < count($ap_values); $n++)
		{
			$value = array_values($ap_values);
			$action = array_keys($ap_values);
			$ttotal = $value[$n] + $total;
			$newcurrent = $current;
			$newcurrent[$action[$n]]++;
			search	($ap_values,$newcurrent,$needed,$ttotal,$n);
		}

	}

}

$current = $argv[1];
$needed =  $argv[2];

$ap_values = ['capdeploymod'=>2000, 'field'=>1563, 'link'=>313, 'mod/deploy' => 125, 'dirtyhack' =>100, 'upgrade'=>65, 'glyph'=>50,'recharge'=>10];
$action = ['capdeploymod'=>0, 'field'=>0, 'link'=>0, 'mod/deploy' => 0, 'dirtyhack' =>0, 'upgrade'=>0, 'glyph'=>0,'recharge'=>0];

search($ap_values,$action,$needed,$current,0);
?>
