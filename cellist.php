#!/usr/bin/php
<?php

$faces=array("NR","AM","AF","AS","PA","ST");
$phonetic =array(
"Alpha",
"Bravo",
"Charlie",
"Delta",
"Echo",
"Foxtrot",
"Golf",
"Hotel",
"Juliet",
"Kilo",
"Lima",
"Mike",
"November",
"Papa",
"Romeo",
"Sierra");


foreach ($faces as $thisface ) 
{
	for ($count1=0; $count1<16; $count1++) {
		foreach ($phonetic as $thisphone) {	
			for ($count2=0; $count2<16; $count2++) {
				printf("$thisface%02d-$thisphone-%02d\n",$count1,$count2);
			}
		}
	}
}
