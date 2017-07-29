    // https://raw.githubusercontent.com/johan/world.geo.json/master/countries/AUS.geo.json
    // https://raw.githubusercontent.com/johan/world.geo.json/master/countries/IND.geo.json
    // http://oramind.com/country-border-highlighting-with-leaflet-js/
    // State codes from https://raw.githubusercontent.com/edwinsteele/d3-projects/master/data/au-states.geojson
    // 0..8  NSW, VIC, QLD, SA, WA, tAS, NT, ACT, other

    var StateCode = {
      1: 'NSW',
      2: 'VIC',
      3: 'QLD',
      4: 'SA',
      5: 'WA',
      6: 'TAS',
      7: 'NT',
      8: 'ACT',
      9: 'OTH'
    };

    var Screens = {
      INITIAL: 'initial',
      ZOOMED_TO_STATE: 'zoomed_to_state',
      ZOOMED_TO_REGION: 'zoomed_to_region',
    };

    var Styles = {
      states: {
        weight: 1,
        opacity: 1,
        color: 'red',
        fillOpacity: 0.1
      },
      regions: {
        weight: 1,
        opacity: 1,
        color: 'blue',
        fillOpacity: 0.2
      }
    };

    var data = {
      screen: Screens.INITIAL,

      bbox: { country: {}, state: {}, region: {}},
      regionLayers: {},
      stateLayers: {}, // stateLayers[n] where nE 1..9 is a leaflet layer

      currentState: null,   // 1..9 if zoomed

      statesItem: null,

      regionsList: {},
      regionsItem: null,
    };

    var featureOnMap = {
      click : function(e) { console.log('click:map'); zoomAustralia(); }
    };
    var featureOnCountry = {
      click : onCountryClick,
    };
    var featureOnState = {
      click : onStateClick,
    };
    var featureOnRegion = {
      click : onRegionClick,
    };

    var map = data.map = L.map('map', {
        dragging: false,
        touchZoom: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        keyboard: false,
        zoomControl: false,
      });
    map.on(featureOnMap);
    //var regionPane = map.createPane('regionPane');

    //var caps = 'http://govhack.locationsa.com.au/server/services/BaseMaps/StreetMapCasedNoParcels_wmas/MapServer/WMSServer?request=GetCapabilities&service=WMS';
    //var wmsOptions = {
    //  layers: 'South Australia ', //SUBURB',
    //};
    //var wmsLayer = L.tileLayer.wms(caps, wmsOptions).addTo(map);
    //wmsLayer.on(featureOnGlobal);

    // Called when country boundary json is loaded
    // We dont show this as a map just use it for group boundary box
    function onCountry(json) {
      console.log('country');
      var country = json.features[0].id;
      data.bbox.country[country] = turf.envelope(json);
      console.log('' + country + ' bbox=' + JSON.stringify(data.bbox.country));
    }

    // Called when states boundary json is loaded
    // Add one layer per state so we can change colours
    // Also compute each bounding box
    function onStates(json) {
      console.log('states');
      var item = L.geoJson(json, {
        onEachFeature: function (feature, layer) {
          data.stateLayers[feature.properties.STATE_CODE] = layer;
          var bbox = turf.envelope(feature); // return Feature<Polygon>:
          var state = StateCode[feature.properties.STATE_CODE];

          // Scale so we zoom closer
          var poly = turf.transformScale(bbox, 0.7);   //        console.log(JSON.stringify(poly));
          bbox = turf.envelope(poly);                  //console.log(JSON.stringify(bbox));
          console.log('' + state); // + ' bbox=' + JSON.stringify(bbox));
          data.bbox.state[feature.properties.STATE_CODE] = bbox;
          layer.on(featureOnState);
        }, // called once for each state
        style : function (feature) { return Styles['states']; }
      });
      data.statesItem = item;
      data.map.addLayer(data.statesItem);
    }

    // Called when regions boundary json is loaded
    // Add one layer per state so we can change colours
    // Also compute each bounding box
    function onRegions(json) {
      console.log('onRegions');

      data.regionsList = {};
      var item = L.geoJson(json, {
        onEachFeature: function (feature, layer) {
          var listItem = {
            feature: feature,
            dollars: +0,
            marker: null,
          };

          var region = feature.properties.REGION; // from data.sa
          region = region.replace(/\s+/g,' '); // Fix wierd whitespace issues

          var bbox = turf.envelope(feature); // return Feature<Polygon>:

          // Create a marker in the middle of the region
          var pp = turf.centroid(feature);
          var pp = [pp.geometry.coordinates[1], pp.geometry.coordinates[0]]; // WTAF - turf points are backwards relative to what leaflet needs
          var marker = L.marker(pp, { title: region, zIndexOffset: 1000});
          marker.bindTooltip(region, { permanent: true });
          // console.log('v=' + region + ' marker=' + JSON.stringify(marker.toGeoJSON()));

          listItem.marker = marker;
          data.regionsList[region] = listItem;
          data.regionLayers[region] = layer;
          data.bbox.region[region] = bbox;
          layer.on(featureOnRegion);
        },
        style : function (feature) { return Styles['regions']; }
      });
      data.regionsItem = item;
      console.log('IMPORTED regionsList.count=' + _.size(data.regionsList));
    }

    function onGrantsPerRegion(csv) {
      console.log('onGrantsPerRegion csv.length=' + csv.length);

      data.grantsPerRegion = {}
      csv.forEach(function(row) {
        data.grantsPerRegion[row.region] = row.total;
      });
      console.log('IMPORTED grantsPerRegion=' + JSON.stringify(data.grantsPerRegion));
    }

    function onGrantsDollars(csv) {
      console.log('onGrantsDollars regions.length=' + _.size(data.regionsList) + ', csv.length=' + csv.length);

      var item = {}
      csv.forEach(function(row) {
        var grantRegionName= row['Region'];
        grantRegionName = grantRegionName.replace(/\s+/g,' '); // Fix wierd whitespace issues

        var amount = row['Amount'];
        amount = Number(amount.replace(/[^0-9\.-]+/g,""));

        // Remap the keys: Organisation Name	Project Title	Project Description	Region	Amount
        item.name = row['Organisation Name'];
        item.project = row['Project Title'];
        item.description = row['Project Description'];
        item.region = grantRegionName;

        // FIXME: This region needs to map supersets
        // e.g. 'Whole of metropolitan area' ==> [ 'Eastern Adelaide', 'Northern Adelaide']
        // Temporary hack
        item.regionSet = [ grantRegionName ];

        if (!Object.keys(data.regionsList).includes(grantRegionName)) {
          // console.log('Grants region not found in regions list, will need mapping. "' + grantRegionName + '"');
          data.regionsList[grantRegionName] = { dollars: +0, feature: null, marker: null };
        } else {
          // console.log('Grants region found in regions list ' + grantRegionName);
        }
        data.regionsList[grantRegionName].dollars += +amount;
      });
    }

    function onCountryClick(e) {
      // We dont see this once the states are loaded
      console.log('click:country');
      zoomAustralia();
    }

    function onStateClick(e) {
      var state = e.target.feature.properties.STATE_CODE;
      console.log('click:state ' + state);
      if (data.screen === Screens.ZOOM_STATE && data.currentState !== state) {
        zoomAustralia();
      } else {
        zoomState(state);
      }
      L.DomEvent.stopPropagation(e);
    }

    function onRegionClick(e) {
      // We dont see this once the states are loaded
      var region = e.target.feature.properties.REGION;
      console.log('click:region=' + region);
      L.DomEvent.stopPropagation(e);
    }

    // Next one is CC0 license
    var p1 = new Promise(function(resolve, reject) { d3.json('assets/AUS.geo.json', function(json) { onCountry(json); resolve(); }); });
    var p2 = new Promise(function(resolve, reject) { d3.json('assets/au-states.geojson', function(json) { onStates(json); resolve(); }); });
    var p3 = new Promise(function(resolve, reject) { d3.json('assets/SAGovtRegions.geojson', function(json) { onRegions(json); resolve(); }); });

    Promise.all([p1, p2, p3]).then(function() {
      // Depends on sagovregion geo
      var p4 = new Promise(function(resolve, reject) { d3.csv('assets/grants_per_region.csv', function(csv) { onGrantsPerRegion(csv); resolve(); }); });
      var p5 = new Promise(function(resolve, reject) { d3.csv('assets/grants-sa-funded-projects-2016-2017.csv', function(csv) { onGrantsDollars(csv); resolve(); }); });

      Promise.all([p4, p5]).then(function() {
        console.log('All data loaded');
        zoomAustralia();
      });
    });


    // --allow-file-access-from-files (chrome)
    // npm install -g http-server , cd /path/to/project/folder , http-server

    function zoomAustralia() {
      if (data.map.hasLayer(data.regionsItem)) data.map.removeLayer(data.regionsItem);
      // For now    //  _.each(data.regionsList, function(v,k) { if (v.marker) v.marker.remove(); });

      var bbox = data.bbox.country['AUS'].geometry.coordinates[0];
      console.log('ZoomAustralia ' + bbox[0] + ';' + bbox[2]);
      data.map.fitBounds([ [bbox[0][1], bbox[0][0]], [bbox[2][1], bbox[2][0]] ]); // ffs why is the map lat lon backwards from geojson
      data.screen = Screens.INITIAL;

      // FIXME: is this the right spot to add the layer ... //      data.map.addLayer(data.statesItem);
      $('#button-home').hide();
    }

    function zoomState(state) {
      console.log('zoomState ' + StateCode[state]);
      if (!data.map.hasLayer(data.regionsItem))  data.map.addLayer(data.regionsItem);

      var bbox = data.bbox.state[state].geometry.coordinates[0];
      data.map.fitBounds([ [bbox[0][1], bbox[0][0]], [bbox[2][1], bbox[2][0]] ]); // ffs why is the map lat lon backwards from geojson
      data.screen = Screens.ZOOM_STATE;
      data.currentState = state;

      // Probably a better way to to this with leaflet panes or something
      // For now // _.each(data.regionsList, function(v,k) { if (v.marker) { v.marker.addTo(data.map); }});

      drawRegionChart(data.grantsPerRegion); // k:v
    }

    function drawRegionChart(kvp) {
      //var x = d3.scaleLinear().domain([0, d3.max(data)]).range([0, 420]);
      //var x = d3.scaleBand().rangeRound([0, width]).paddingInner(0.05).align(0.1);
      //var y = d3.scaleLinear().rangeRound([height, 0]);
      //var z = d3.scaleOrdinal().range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);
      //x.domain(['Regions']);
      //y.domain([0, d3.max(data, function(d) { return d.total; })]).nice();
      //z.domain(keys);

      // http://bl.ocks.org/puzzler10/2226e8d73c8f10dcdac7c77357838ba2
      //var svgWidth = 900,      	svgHeight = 500;
      var margin = {top: 20, right: 10, bottom: 10, left: 20},
        svgWidth = 260 - margin.left - margin.right,
        svgHeight = 200 - margin.top - margin.bottom;
      var data = _.map(kvp, function(v,k) { return [{x:'Region', y:v, z:k}]; });
      console.log(JSON.stringify(data));
      var stack = d3.stack();
      var layers = stack(data);
      var svg = d3.select("#regionSidebarChart").append("svg")
			            .attr("width", svgWidth + margin.left + margin.right)
			            .attr("height", svgHeight+ margin.top + margin.bottom);
      var c10 = d3.scaleOrdinal(d3.schemeCategory10);
      var groups = svg.selectAll("g")
      				.data(layers)
      				.enter()
      				.append("g")
				      .style("fill", function (d,i) {return c10(i)});
      var xScale = d3.scaleOrdinal().range(['Region']).domain(['Region']); //   x.domain(layout[0].map(function (d) { return d.x }));
      var xAxis = d3.axisBottom().scale(xScale);
      var yScale = d3.scaleLinear().range([200 - margin.top, margin.bottom]).domain([0,200000]);
      var yAxis = d3.axisLeft().scale(yScale);
//				.ticks(5)
//				.scale(yScale)
//				.orient("right");
      var rects = groups.selectAll("rect")
            		  .data(function(d) {console.log(1); return d;} )
              		.enter()
              		.append("svg:rect")
      	          .style("stroke", "black")
              		.attr("x", function(d) {console.log('dx'); return x(d.x); })
              		.attr("y", function(d) {console.log('dy %d %d',d.y0 + d.y ); return yScale(d.y0 + d.y)} )
              		.attr("width", 100)
              		.attr("height", function (d) {return 10; }); //yScale(d.y0) - yScale(d.y + d.y0)});
      svg.append("g")
      	.attr("class", "y axis")
      	//.attr("transform", "translate(" + (svgWidth -100) +",0)")
      	.attr("transform", "translate(100,0)")
//      	.call(xAxis)
      	.call(yAxis)
      	.style("stroke", "black");
/*
      svg.append("g")
      	.attr("class", "x axis")
      	//.attr("transform", "translate(" + (svgWidth -100) +",0)")
      	.attr("transform", "translate(100,0)")
//      	.call(xAxis)
      	.call(xAxis)
      	.style("stroke", "black");
        */
    }

    $(document).ready(function() {
      $('#button-home').on('click', zoomAustralia);
    });
