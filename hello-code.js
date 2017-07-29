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
      regionLayers: {},
      stateLayers: {}, // stateLayers[n] where nE 1..9 is a leaflet layer
      currentZoomedState: null,   // 1..9 if zoomed
      bbox: { country: {}, state: {}, region: {}},
    };

    var map = data.map = L.map('map', {
        dragging: false,
        touchZoom: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        keyboard: false,
        zoomControl: false,
      });

    var regionPane = map.createPane('regionPane');

    var caps = 'http://govhack.locationsa.com.au/server/services/BaseMaps/StreetMapCasedNoParcels_wmas/MapServer/WMSServer?request=GetCapabilities&service=WMS';
    var wmsOptions = {
      layers: 'South Australia ', //SUBURB',
    };
    var wmsLayer = L.tileLayer.wms(caps, wmsOptions).addTo(map);

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
          console.log('' + state + ' bbox=' + JSON.stringify(bbox));
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
      console.log('states');

      var item = L.geoJson(json, {
        onEachFeature: function (feature, layer) {
          var region = feature.properties.REGION; // from data.sa
          data.regionLayers[region] = layer;
          var bbox = turf.envelope(feature); // return Feature<Polygon>:
          data.bbox.region[region] = bbox;
          layer.on(featureOnRegion);
        },
        style : function (feature) { return Styles['regions']; }
      });
      data.regionsItem = item;

      var regionPaneItems = new L.FeatureGroup(item, {pane: regionPane});
      data.map.addLayer(regionPaneItems);
    }

    var featureOnCountry = {
      click : onCountryClick,
    };
    var featureOnState = {
      click : onStateClick,
    };
    var featureOnRegion = {
      click : onRegionClick,
    };

    function onCountryClick(e) {
      // We dont see this once the states are loaded
      console.log('click:country');
    }

    function onStateClick(e) {
      var state = e.target.feature.properties.STATE_CODE;
      console.log('click:state ' + state);
      if (data.screen === Screens.ZOOM_STATE) {
        zoomAustralia();
      } else {
        zoomState(state);
      }
      // alert(StateCode[state]);
    }

    function onRegionClick(e) {
      // We dont see this once the states are loaded
      var region = e.target.feature.properties.REGION;
      console.log('click:region=' + region);
    }

    // Next one is CC0 license
    var p1 = new Promise(function(resolve, reject) { d3.json('assets/AUS.geo.json', function(json) { onCountry(json); resolve(); }); });
    var p2 = new Promise(function(resolve, reject) { d3.json('assets/au-states.geojson', function(json) { onStates(json); zoomAustralia(); resolve(); }); });
    var p3 = new Promise(function(resolve, reject) { d3.json('assets/SAGovtRegions.geojson', function(json) { onRegions(json); resolve(); }); });
    // --allow-file-access-from-files (chrome)
    // npm install -g http-server , cd /path/to/project/folder , http-server

    function zoomAustralia() {
      var bbox = data.bbox.country['AUS'].geometry.coordinates[0];
      console.log(bbox[0] + ';' + bbox[2]);
      data.map.fitBounds([ [bbox[0][1], bbox[0][0]], [bbox[2][1], bbox[2][0]] ]); // ffs why is the map lat lon backwards from geojson
      data.screen = Screens.INITIAL;

      // FIXME: is this the right spot to add the layer ... //      data.map.addLayer(data.statesItem);
      $('#button-home').hide();
    }

    function zoomState(state) {
      var bbox = data.bbox.state[state].geometry.coordinates[0];
      data.map.fitBounds([ [bbox[0][1], bbox[0][0]], [bbox[2][1], bbox[2][0]] ]); // ffs why is the map lat lon backwards from geojson
      data.screen = Screens.ZOOM_STATE;
    }

    $(document).ready(function() {
      $('#button-home').on('click', zoomAustralia);
    });
