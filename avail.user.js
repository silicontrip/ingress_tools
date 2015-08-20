// ==UserScript==
// @id             available-fields@silicontrip
// @name           IITC plugin: avail Links
// @category       Layer
// @version        0.4.4.20150628.1641
// @updateURL      http://silicontrip.net/~mark/old_site/avail.user.js
// @downloadURL    http://silicontrip.net/~mark/old_site/avail.user.js
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
    plugin_info.dateTimeVersion = '20150628.22129';
    plugin_info.pluginId = 'avail-fields';
    //END PLUGIN AUTHORS NOTE



    // PLUGIN START ////////////////////////////////////////////////////////

    // use own namespace for plugin
    window.plugin.availLinks = function() {};

    // const values
    window.plugin.availLinks.MAX_PORTALS_TO_LINK = 200;
    // zoom level used for projecting points between latLng and pixel coordinates. may affect precision of triangulation
    window.plugin.availLinks.PROJECT_ZOOM = 16;

    window.plugin.availLinks.STROKE_STYLE = {
        color: '#FF0000',
        opacity: 1,
        weight: 1.5,
        clickable: false,
        dashArray: [6,4],
        smoothFactor: 10,
    };
    window.plugin.availLinks.DELETED_STROKE_STYLE = {
        color: '#000000',
        opacity: 0.5,
        weight: 1.5,
        clickable: false,
        dashArray: [4,4],
        smoothFactor: 10,
    };
    window.plugin.availLinks.layer = null;

    window.plugin.availLinks.getEnemy = function() 
    {
        if (window.PLAYER.team == "ENLIGHTENED")
            return "R";
        if (window.PLAYER.team == "RESISTANCE")
            return "E";
        // should never happen.
        return "N";
    }

    window.plugin.availLinks.linkCentre = function(l) 
    {
        return [(l[0][0] + l[1][0] )/2 , (l[0][1] + l[1][1]) / 2];
    }

    window.plugin.availLinks.linkLength = function(pnt) {
        var earthRadius = 6371;

        var dlat =  Math.PI / 180 * (pnt[1].lat-pnt[0].lat);
        var dlng =  Math.PI / 180 * (pnt[1].lng-pnt[0].lng);

        var a = Math.sin(dlat/2) * Math.sin(dlat/2) +
            Math.cos(Math.PI / 180 * pnt[0].lat) * Math.cos(Math.PI / 180 * pnt[1].lat) *
            Math.sin(dlng/2) * Math.sin(dlng/2);

        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return earthRadius * c;
    }

    window.plugin.availLinks.intersect = function(l0,l1) {

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
            return true;

        var s = ((-s1.lat) * (p0.lng - p2.lng) + s1.lng * (p0.lat - p2.lat)) / base;
        var t = ( s2.lng * (p0.lat - p2.lat) - s2.lat * (p0.lng - p2.lng)) / base; 

        var roundingNumber = 1000000;

        s =  Math.round(s * roundingNumber)  / roundingNumber;
        t =  Math.round(t * roundingNumber)  / roundingNumber;

        if (s>0 && s<1 && t>0 && t<1) 
            return true;

        return false;
    }

    window.plugin.availLinks.intersectWithLinks = function(tlink,ignoreTeam) {

        for (index in window.links) 
        { 
            if (window.links.hasOwnProperty(index)) {
                if (links[index].options.data.team != ignoreTeam) 
                    if (window.plugin.availLinks.intersect(tlink,links[index]._latlngs))
                        return true;
            }
        }
        return false;
    }

    window.plugin.availLinks.getLocations = function(ignoreTeam) {
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
    }

    window.plugin.availLinks.getProposedLinks = function(locations) 
    {
        var proposedLinks = [];
        for (kndex = 0; kndex < locations.length-1; kndex++) 
            for (jndex = kndex+1; jndex < locations.length; jndex++) 
                proposedLinks.push([locations[kndex],locations[jndex]]);

        return proposedLinks;
    }

    window.plugin.availLinks.sign = function(p0,p1,p2)
    {
        //  console.log(p0);
        return (p0.lng - p2.lng) * (p1.lat - p2.lat) - (p1.lng - p2.lng) * (p0.lat-p2.lat);
    }

    window.plugin.availLinks.insideField =function(point,field) 
    {
      //  console.log("availLinks: insideField");
       // console.log(point);
        // console.log(field.length);
        
        var p0= field[0];
        var p1= field[1];
        var p2= field[2];

        if (window.plugin.availLinks.sign(p0,p1,p2) > 0)
        {
            var tmp = p0;
            p0 = p1;
            p1 = tmp;
        }

        var b1 = window.plugin.availLinks.sign(point,p0,p1) < 0;
        var b2 = window.plugin.availLinks.sign(point,p1,p2) < 0;
        var b3 = window.plugin.availLinks.sign(point,p2,p0) < 0;

        //console.log("b1: " + b1 + " b2: " + b2 + " b3: " + b3);
        
        return ((b1==b2) && (b2==b3));

    }

    window.plugin.availLinks.linkUnderField = function(link,ignoreTeam)
    {
        console.log("availLinks: linkUnderField");
        for  (idx in window.fields)
        { 
              //  console.log(window.fields[idx]);
            if (window.fields.hasOwnProperty(idx))
                if (window.fields[idx]._latlngs.length == 3) 
                    if (window.fields[idx].options.data.team != ignoreTeam) 
                        if ( (window.plugin.availLinks.insideField(link[0],window.fields[idx]._latlngs))  &&
                            (window.plugin.availLinks.insideField(link[1],window.fields[idx]._latlngs))
                           )
                            return true;
        }
        return false;

    }

    window.plugin.availLinks.removeExistingLinks = function(links,ignoreTeam) 
    {
        var proposedLinks = [];
        // iterate through links as prolink
        for (i=0; i < links.length; i++) {
            var prolink = links[i];
            if (
                !window.plugin.availLinks.intersectWithLinks(prolink,ignoreTeam) &&
                !window.plugin.availLinks.linkUnderField(prolink,ignoreTeam)
            ) 
                proposedLinks.push(prolink);
        }
        return proposedLinks;
    };

    window.plugin.availLinks.removeIntersectingLinks = function(links,shortestFirst) {

        var finalLinks = [];
        while (links.length > 0) {
            // remove all but the shortest link

            // find the shortest link
            abslen = window.plugin.availLinks.linkLength(links[0]);
            abscounter = 0;
            for (i = 1; i < links.length; i++) { 
                len = window.plugin.availLinks.linkLength(links[i]);
                if ((shortestFirst && (len < abslen)) || (!shortestFirst && (len > abslen))) 
                {
                    abscounter = i;
                    abslen = len;
                }
            }
            var link = links[abscounter];
            finalLinks.push(link);
            links.splice(abscounter, 1); 

            for (i = 0; i < links.length; i++) {
                while( i < links.length && window.plugin.availLinks.intersect(link,links[i]))
                    links.splice(i, 1); 
            }
        }
        return finalLinks;
    }

    window.plugin.availLinks.updateLayer = function() {
        if (!window.map.hasLayer(window.plugin.availLinks.layer))
            return;
        
        var mode = "IGNORE"; // AVOID or IGNORE
        var enemy = window.plugin.availLinks.getEnemy();

        window.plugin.availLinks.layer.clearLayers();

        console.log("availLinks: get Locations");
        var locations = [];
        if (mode == "AVOID") {
            locations = window.plugin.availLinks.getLocations(enemy);
        } else {
            locations = window.plugin.availLinks.getLocations("");
        }
        console.log("availLinks: got " + locations.length + " locations");

        // console.log(locations);

        console.log("availLinks: get proposed links");
        var allLinks = window.plugin.availLinks.getProposedLinks(locations);

        // check for intersection with existing links
        var proposedLinks = [];
        if (mode == "IGNORE") {
            proposedLinks = window.plugin.availLinks.removeExistingLinks(allLinks,enemy);
        } else {
            proposedLinks = window.plugin.availLinks.removeExistingLinks(allLinks,"");
        }

        console.log("availLinks: got " + proposedLinks.length + " links");
        // console.log(proposedLinks);
        console.log("availLinks: get final links");
        // set this to true for shortest first (tight linking)
        // or false for longest first (possible layered fielding)
        var finalLinks = window.plugin.availLinks.removeIntersectingLinks (proposedLinks,false);
        console.log("availLinks: got " + finalLinks.length + " links");
        console.log("availLinks: draw links");

        // draw links on layer
        for (i = 0; i < finalLinks.length; i++) {       
            var poly = L.polyline(finalLinks[i], window.plugin.availLinks.STROKE_STYLE);
            poly.addTo(window.plugin.availLinks.layer);
        }
    }

    window.plugin.availLinks.setup = function() {

        window.plugin.availLinks.layer = L.layerGroup([]);
        
        window.addHook('mapDataRefreshEnd', function(e) {
            window.plugin.availLinks.updateLayer();
        });

        window.map.on('layeradd', function(e) {
            if (e.layer === window.plugin.availLinks.layer)
                window.plugin.availLinks.updateLayer();
        });
        //  window.map.on('layerremove', function(e) {
        //    if (e.layer === window.plugin.availLinks.layer)
        //      window.plugin.availLinks.clearErrorMarker();
        //  });

        window.addLayerGroup('avail links', window.plugin.availLinks.layer, false);

        $('head').append('<style>'+
                         '.max-links-error { color: #F88; font-size: 20px; font-weight: bold; text-align: center; text-shadow: -1px -1px #000, 1px -1px #000, -1px 1px #000, 1px 1px #000; background-color: rgba(0,0,0,0.6); border-radius: 5px; }'+
                         '</style>');

    }
    var setup = window.plugin.availLinks.setup;

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


