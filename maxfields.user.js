// ==UserScript==
// @id             max-fields@silicontrip
// @name           IITC plugin: max fields
// @category       Layer
// @version        0.4.4.20150630.0033
// @updateURL      http://silicontrip.net/~mark/old_site/maxfields.user.js
// @downloadURL    http://silicontrip.net/~mark/old_site/maxfields.user.js
// @description    [jonatkins-2015-05-08-022129] Calculate how to link the portals to create a reasonably tidy set of links/fields. Enable from the layer chooser. 
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @include        https://www.ingress.com/mission/*
// @include        http://www.ingress.com/mission/*
// @match          https://www.ingress.com/mission/*
// @match          http://www.ingress.com/mission/*
// @grant          none
// ==/UserScript==


function wrapper(plugin_info) {
// ensure plugin framework is there, even if iitc is not yet loaded
	if(typeof window.plugin !== 'function') window.plugin = function() {};

//PLUGIN AUTHORS: writing a plugin outside of the IITC build environment? if so, delete these lines!!
//(leaving them in place might break the 'About IITC' page or break update checks)
	plugin_info.buildName = 'jonatkins';
	plugin_info.dateTimeVersion = '20150508.22129';
	plugin_info.pluginId = 'max-fields';
//END PLUGIN AUTHORS NOTE



// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
	window.plugin.maxFields = function() {};

// const values
	window.plugin.maxFields.MAX_PORTALS_TO_LINK = 200;
// zoom level used for projecting points between latLng and pixel coordinates. may affect precision of triangulation
	window.plugin.maxFields.PROJECT_ZOOM = 16;

	window.plugin.maxFields.STROKE_STYLE = {
	  color: '#FF0000',
	  opacity: 1,
	  weight: 1.5,
	  clickable: false,
	  dashArray: [6,4],
	  smoothFactor: 10,
	};
	window.plugin.maxFields.DELETED_STROKE_STYLE = {
	  color: '#000000',
	  opacity: 0.5,
	  weight: 1.5,
	  clickable: false,
	  dashArray: [4,4],
	  smoothFactor: 10,
	};
	window.plugin.maxFields.layer = null;

    window.plugin.maxFields.getEnemy = function() 
    {
        if (window.PLAYER.team == "ENLIGHTENED")
            return "R";
        if (window.PLAYER.team == "RESISTANCE")
            return "E";
        // should never happen.
        return "N";
    };

    window.plugin.maxFields.linkCentre = function(l) 
    {
        return [(l[0][0] + l[1][0] )/2 , (l[0][1] + l[1][1]) / 2];
    };
    
    window.plugin.maxFields.fieldEqual = function(f0,f1) 
    {
        
        if (f0.length ==3 && f1.length==3) {
        // console.log ("compare field: " + f0 + " == " + f1);
      //      console.log ("test: " + f0[0].lat + " == " + f1[1].lat)
        //console.log( f0[0] == f1[1]);
        return (
            (f0[0].lat == f1[0].lat && f0[1].lat == f1[1].lat && f0[2].lat == f1[2].lat && 
             f0[0].lng == f1[0].lng && f0[1].lng == f1[1].lng && f0[2].lng == f1[2].lng) ||
            (f0[0].lat == f1[0].lat && f0[1].lat == f1[2].lat && f0[2].lat == f1[1].lat && 
             f0[0].lng == f1[0].lng && f0[1].lng == f1[2].lng && f0[2].lng == f1[1].lng) ||
            
            (f0[0].lat == f1[1].lat && f0[1].lat == f1[2].lat && f0[2].lat == f1[0].lat && 
             f0[0].lng == f1[1].lng && f0[1].lng == f1[2].lng && f0[2].lng == f1[0].lng) ||
            (f0[0].lat == f1[1].lat && f0[1].lat == f1[0].lat && f0[2].lat == f1[2].lat && 
             f0[0].lng == f1[1].lng && f0[1].lng == f1[0].lng && f0[2].lng == f1[2].lng) ||
            
            (f0[0].lat == f1[2].lat && f0[1].lat == f1[0].lat && f0[2].lat == f1[1].lat && 
             f0[0].lng == f1[2].lng && f0[1].lng == f1[0].lng && f0[2].lng == f1[1].lng) ||
            (f0[0].lat == f1[2].lat && f0[1].lat == f1[1].lat && f0[2].lat == f1[0].lat && 
             f0[0].lng == f1[2].lng && f0[1].lng == f1[1].lng && f0[2].lng == f1[0].lng)
            );
        }
        return false;
         
    };
    
    window.plugin.maxFields.fieldIntersect = function(f0,f1) {
 
        if ( 
            window.plugin.maxFields.intersect([f0[0],f0[1]],[f1[0],f1[1]]) ||
            window.plugin.maxFields.intersect([f0[0],f0[1]],[f1[2],f1[1]]) ||
            window.plugin.maxFields.intersect([f0[0],f0[1]],[f1[0],f1[2]]) ||

            window.plugin.maxFields.intersect([f0[2],f0[1]],[f1[0],f1[1]]) ||
            window.plugin.maxFields.intersect([f0[2],f0[1]],[f1[2],f1[1]]) ||
            window.plugin.maxFields.intersect([f0[2],f0[1]],[f1[0],f1[2]]) ||

            window.plugin.maxFields.intersect([f0[0],f0[2]],[f1[0],f1[1]]) ||
            window.plugin.maxFields.intersect([f0[0],f0[2]],[f1[2],f1[1]]) ||
            window.plugin.maxFields.intersect([f0[0],f0[2]],[f1[0],f1[2]])
        )
        {
            return true;
        }
        return false;

    };

    window.plugin.maxFields.newFieldIntersect = function(list,field)
    {
        for (index =0; index<list.length;index++)
        {
            if (window.plugin.maxFields.fieldIntersect(list[index],field))
            {
                return true;
            }
        }
        return false;
    };
    
    window.plugin.maxFields.intersect = function(l0,l1) {
     
        var p0 = l0[0];
        var p1 = l0[1];
        var p2 = l1[0];
        var p3 = l1[1];

        var s1 = {lat: 0, lng: 0};
        var s2 = {lat: 0, lng: 0};
        s1.lat = p1.lat - p0.lat;
        s1.lng = p1.lng - p0.lng;
        
        s2.lat = p3.lat - p2.lat;
        s2.lng = p3.lng - p2.lng;
        
        base = (( -s2.lng) * s1.lat + s1.lng * s2.lat);
        
        
        if (base === 0)
            return false;
        
        var s = ((-s1.lat) * (p0.lng - p2.lng) + s1.lng * (p0.lat - p2.lat)) / base;
        var t = ( s2.lng * (p0.lat - p2.lat) - s2.lat * (p0.lng - p2.lng)) / base; 

        var roundingNumber = 1000000;

        s =  Math.round(s * roundingNumber)  / roundingNumber;
        t =  Math.round(t * roundingNumber)  / roundingNumber;

        if (s>0 && s<1 && t>0 && t<1) 
            return true;
        
        return false;
    };

    window.plugin.maxFields.intersectWithLinks = function(tfield,ignoreTeam) {
       
        for  (var idx in window.links)
        { 
                if (window.links.hasOwnProperty(idx)) 
                    if (window.links[idx].options.data.team != ignoreTeam) 
                        if (
                            window.plugin.maxFields.intersect([tfield[0],tfield[1]],links[idx]._latlngs) ||
                            window.plugin.maxFields.intersect([tfield[0],tfield[2]],links[idx]._latlngs) ||
                            window.plugin.maxFields.intersect([tfield[1],tfield[2]],links[idx]._latlngs)
                        )
                            return true;
        }
        return false;
    };

    
    window.plugin.maxFields.searchFields = function (list,fields,start,max,depth)
    {
        
       // console.log("Iterate: fields: " + list.length);
        
        if(list.length > 0) {
            thisMax = list.length;
            if (thisMax > max)
            {
                max = thisMax;
                // display field plan
               // console.log(list);
                console.log("Displaying field plan");
                
                	window.plugin.maxFields.layer.clearLayers();
                for (var f=0; f< list.length; f++) {
                    var thisField = list[f];
                 //   console.log("field: " + thisField);
                    var poly = L.polygon([thisField[0], thisField[1], thisField[2]], 
                                         {
                                             stroke: true,
                                             color: '#ff0000',
                                             dashArray: [6,4],
                                             weight: 1.5,
                                             fill: true,
                                             fillColor: '#FF0000',
                                             fillOpacity: 0.25,
                                             clickable: false,
                                         }
                                        );
                    poly.addTo(window.plugin.maxFields.layer);
                }   
            }
        }
    //    console.log("Adding fields...");
        for (fidex = start; fidex < fields.length; fidex++)
        {
            var thisField = fields[fidex];
        //    console.log ("testing field: " + fidex + " == " + thisField);
            if (!window.plugin.maxFields.newFieldIntersect(list,thisField))
            {
           //     console.log("Adding field: " + thisField);
                list.push(thisField);
                               // console.log(list);

                max = window.plugin.maxFields.searchFields(list,fields,fidex+1,max,depth+1);
            }
        }
        return max;
    };
    
    window.plugin.maxFields.getLocations = function(ignoreTeam) {
        var locations = [];
        var bounds = map.getBounds();
        $.each(window.portals, function(guid, portal) {
            var ll = portal.getLatLng();
            if (bounds.contains(ll)) {
                // check if portal is in the ignored team
                if (portal.options.data.team != ignoreTeam) 
                {
                    var p = portal.getLatLng();
                    locations.push(p);
                }
            }
        });
        return locations;
    };

    window.plugin.maxFields.getProposedFields = function(locations) 
    {
        var proposedLinks = [];
        for (kndex = 0; kndex < locations.length-1; kndex++) 
            for (jndex = kndex+1; jndex < locations.length; jndex++)
                for (index = jndex+1; index < locations.length; index++)
                    proposedLinks.push([locations[kndex],locations[jndex],locations[index]]);

        return proposedLinks;
    };

    window.plugin.maxFields.sign = function(p0,p1,p2)
    {
      //  console.log(p0);
        return (p0.lng - p2.lng) * (p1.lat - p2.lat) - (p1.lng - p2.lng) * (p0.lat-p2.lat);
    };
    
    window.plugin.maxFields.insideField =function(point,field) 
    {
     
        var p0= field[0];
        var p1= field[1];
        var p2= field[2];
        
        if (window.plugin.maxFields.sign(p0,p1,p2) > 0)
        {
            var tmp = p0;
            p0 = p1;
            p1 = tmp;
        }
        
        var b1 = window.plugin.maxFields.sign(point,p0,p1) < 0 ;
        var b2 = window.plugin.maxFields.sign(point,p1,p2) < 0 ;
        var b3 = window.plugin.maxFields.sign(point,p2,p0) < 0 ;
        
        return ((b1==b2) && (b2==b3));
        
    };
    
    window.plugin.maxFields.linkUnderField = function(field,ignoreTeam)
    {
      
        for  (var idx in window.fields)
        { 
        //    console.log(window.fields[idx]);
            if (window.fields.hasOwnProperty(idx)) 
                if (window.fields[idx].options.data.team != ignoreTeam) 
                {
                    // unless link already exists...
                    under0 = window.plugin.maxFields.insideField(field[0],window.fields[idx]._latlngs);
                    under1 = window.plugin.maxFields.insideField(field[1],window.fields[idx]._latlngs);
                    under2 = window.plugin.maxFields.insideField(field[2],window.fields[idx]._latlngs);

                 //   console.log("under: " + under0 + ", " + under1 + ", " + under2);
                    
                    if ((under0 && under1) || (under0 && under2) || (under1 && under2))
                        return true;
                }
        }
        return false;
    };
  
    window.plugin.maxFields.existingField = function(tfield,ignoreTeam) {
       
        for  (var idx in window.fields)
        { 
           // console.log(window.fields[idx]);
                if (window.fields.hasOwnProperty(idx)) 
                    if (window.fields[idx].options.data.team != ignoreTeam) 
                        if (window.plugin.maxFields.fieldEqual(tfield,window.fields[idx]._latlngs))
                            return true;
        }
        return false;
    }
    
    window.plugin.maxFields.removeExisting = function(fields,ignoreTeam) 
    {
        var proposedFields = [];
        // iterate through links as prolink
        for (i=0; i < fields.length; i++) {
            var profield = fields[i];
            if (
                !window.plugin.maxFields.intersectWithLinks(profield,ignoreTeam)
                && !window.plugin.maxFields.linkUnderField(profield,ignoreTeam)
                && !window.plugin.maxFields.existingField(profield,ignoreTeam)
               ) 
                proposedFields.push(profield);
        }
        return proposedFields;
    };
    



    
    window.plugin.maxFields.updateLayer = function() {
        if (!window.map.hasLayer(window.plugin.maxFields.layer))
            return;

        var mode = "IGNORE"; // AVOID or IGNORE
        var enemy = window.plugin.maxFields.getEnemy();

        window.plugin.maxFields.layer.clearLayers();

        console.log("maxFields: get Locations");
        var locations = [];
	if (mode == "AVOID") {
		locations = window.plugin.maxFields.getLocations(enemy);
	} else {
		locations = window.plugin.maxFields.getLocations("");
	}
	console.log("maxFields: got " + locations.length + " locations");

	// console.log(locations);
    
	console.log("maxFields: get proposed fields");
	var allFields = window.plugin.maxFields.getProposedFields(locations);

	// check for intersection with existing links
	var proposedFields = [];
	if (mode == "IGNORE") {
		proposedFields = window.plugin.maxFields.removeExisting(allFields,enemy);
	} else {
		proposedFields = window.plugin.maxFields.removeExisting(allFields,"");

	}
    
	console.log("maxFields: got " + proposedFields.length + " fields");
	// console.log(proposedLinks);
	console.log("maxFields: search fields");
	// set this to true for shortest first (tight linking)
	// or false for longest first (possible layered fielding)
	// var finalFields = window.plugin.maxFields.removeIntersectingLinks (proposedLinks,false);
	
   window.plugin.maxFields.searchFields([],proposedFields,0,0,0);
    
 //   console.log("availLinks: got " + finalLinks.length + " links");

	// draw links on layer
//	for (i = 0; i < finalLinks.length; i++) {       
//		var poly = L.polyline(finalLinks[i], window.plugin.maxFields.STROKE_STYLE);
//		poly.addTo(window.plugin.maxFields.layer);
  //   }
};

window.plugin.maxFields.setup = function() {


  window.plugin.maxFields.layer = L.layerGroup([]);

  window.addHook('mapDataRefreshEnd', function(e) {
    window.plugin.maxFields.updateLayer();
  });

  window.map.on('layeradd', function(e) {
    if (e.layer === window.plugin.maxFields.layer)
      window.plugin.maxFields.updateLayer();
  });
//  window.map.on('layerremove', function(e) {
//    if (e.layer === window.plugin.maxFields.layer)
//      window.plugin.maxFields.clearErrorMarker();
//  });

  window.addLayerGroup('max fields', window.plugin.maxFields.layer, false);

  $('head').append('<style>'+
    '.max-links-error { color: #F88; font-size: 20px; font-weight: bold; text-align: center; text-shadow: -1px -1px #000, 1px -1px #000, -1px 1px #000, 1px 1px #000; background-color: rgba(0,0,0,0.6); border-radius: 5px; }'+
    '</style>');

};
var setup = window.plugin.maxFields.setup;

// PLUGIN END //////////////////////////////////////////////////////////


setup.info = plugin_info; //add the script info data to the function as a property
if(!window.bootPlugins) window.bootPlugins = [];
window.bootPlugins.push(setup);
// if IITC has already booted, immediately run the 'setup' function
if(window.iitcLoaded && typeof setup === 'function') setup();
} // wrapper end
// inject code into site context
var script = document.createElement('script');
var info = {};
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) info.script = { version: GM_info.script.version, name: GM_info.script.name, description: GM_info.script.description };
script.appendChild(document.createTextNode('('+ wrapper +')('+JSON.stringify(info)+');'));
(document.body || document.head || document.documentElement).appendChild(script);
