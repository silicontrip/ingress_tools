<?
function ap_bonus($lev,$per)
{
	$glyphs_lev = array(1,2,3,3,3,4,4,5);
	$glyphs = $glyphs_lev[$lev-1];
	$bonus =  floor( pow(2, $glyphs/2+1) * 10);
	return ($glyphs * 50 + $bonus + $per);
}

function time_remain($lev,$per) 
{
	$time_lev = array(20,20,20,19,18,17,16,15);
	$time = $time_lev[$lev-1];
	return sprintf("%02.2f",($time * ($per/100.0)));
}

?>
<html>
<body>
<table border=1>
<tr><th></th>
<th colspan=2>1</th>
<th colspan=2>2</th>
<th colspan=2>3</th>
<th colspan=2>4</th>
<th colspan=2>5</th>
<th colspan=2>6</th>
<th colspan=2>7</th>
<th colspan=2>8</th>
</tr>
<tr>
<td>percent</td>
<td>seconds</td><td>AP</td>
<td>seconds</td><td>AP</td>
<td>seconds</td><td>AP</td>
<td>seconds</td><td>AP</td>
<td>seconds</td><td>AP</td>
<td>seconds</td><td>AP</td>
<td>seconds</td><td>AP</td>
<td>seconds</td><td>AP</td>
</tr>
<? for ($n=99; $n>0; $n--) { ?>
<tr><td><?=$n?>%</td>
<? for ($lev=1; $lev<9; $lev++) { ?>
<td><?=time_remain($lev,$n)?></td><td><?=ap_bonus($lev,$n)?></td><? } ?>
</tr><? } ?>
</table>
</body>
</html>
