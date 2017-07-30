/*
MIT License
Copyright (c)  2017 by the yourcommunity.space team, created for GovHack 2017
*/

// NOTICE: This is proof of concept code.
// In a production system files like this would be wrapper into a module and bundled
// using something like webpack or browserify, etc.

// This code assumes the following modules have been loaded:
// - globals.js
// - utils.js
// - loader.js

// To Debug in Chrome, chrome wont load json from a local (implicit file: url)
// So use node or something to serve the directory instead
// Firefox is much more local development friendly.
// --allow-file-access-from-files (chrome)
// npm install -g http-server , cd /path/to/project/folder , http-server


    // https://raw.githubusercontent.com/johan/world.geo.json/master/countries/AUS.geo.json
    // https://raw.githubusercontent.com/johan/world.geo.json/master/countries/IND.geo.json
    // http://oramind.com/country-border-highlighting-with-leaflet-js/
    // State codes from https://raw.githubusercontent.com/edwinsteele/d3-projects/master/data/au-states.geojson
    // 0..8  NSW, VIC, QLD, SA, WA, tAS, NT, ACT, other

function prepareMapDisplay()
{
  var map = L.map('map', {
    dragging: false,
    touchZoom: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    keyboard: false,
    zoomControl: false,
  });
  map.on({
    // Important: click handlers on various map features need to prevent propagation or this gets called as well...
    click : function(e) { zoomAustralia(); }
  });
  return map;
}

function onCountryClick(e) {
  // We dont see this once the states are loaded
  console.log('click:country');
  zoomAustralia();
}

function onStateClick(e) {
  var state = e.target.feature.properties.STATE_CODE;
  console.log('click:state ' + state);
  if (AppData.screen === Screens.ZOOM_STATE && AppData.currentState !== state) {
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

function showSidebarRegionGrants()
{
  $('#rtitle').html("Grant spending per region");
  var list = $('#regionSidebarChart').removeAttr('hidden').show().empty().append('<ul></ul>').find('ul');
  _.each(AppData.grantsPerRegion, function(v, k) {
    list.append('<li>' + k + ' $' + v + '</li>');
  });
}
function showSidebarSchoolData()
{
  $('#rtitle').html("Schools per region");
  var list = $('#regionSidebarChart').removeAttr('hidden').show().empty().append('<ul></ul>').find('ul');
  _.each(AppData.schoolsPerRegion, function(v, k) {
    list.append('<li>' + k + ' $' + v + '</li>');
  });
}

function router(screen)
{
  AppData.screen = Screens.INITIAL;
  switch (screen) {
    case Screens.INITIAL:
      $('#rtitle').html("Welcome");
      $('#welcomeChooser').removeAttr('hidden').hide();
      $('#australiaSidebarText').removeAttr('hidden').show();
      $('#regionSidebarChart').removeAttr('hidden').hide().empty();
      break;
    case Screens.ZOOM_STATE:
      $('#welcomeChooser').removeAttr('hidden').show();
      $('#australiaSidebarText').removeAttr('hidden').hide();
      onWelcomeSelector();
      break;
  }
}

function zoomAustralia() {
  console.log('zoomAustralia');
  if (AppData.map.hasLayer(AppData.regionsItem)) AppData.map.removeLayer(AppData.regionsItem);
  // For now    //  _.each(AppData.regionsList, function(v,k) { if (v.marker) v.marker.remove(); });

  var bbox = AppData.bbox.country['AUS'].geometry.coordinates[0];
  console.log('ZoomAustralia ' + bbox[0] + ';' + bbox[2]);
  AppData.map.fitBounds([ [bbox[0][1], bbox[0][0]], [bbox[2][1], bbox[2][0]] ]); // ffs why is the map lat lon backwards from geojson
  router(Screens.INITIAL);
}

function zoomState(state) {
  console.log('zoomState ' + StateCode[state]);
  if (!AppData.map.hasLayer(AppData.regionsItem))  AppData.map.addLayer(AppData.regionsItem);

  var bbox = AppData.bbox.state[state].geometry.coordinates[0];
  AppData.map.fitBounds([ [bbox[0][1], bbox[0][0]], [bbox[2][1], bbox[2][0]] ]); // ffs why is the map lat lon backwards from geojson
  AppData.currentState = state;
  router(Screens.ZOOM_STATE);
}

function onWelcomeSelector() {
  //console.log($('#welcomeSelector option:selected').text());
  //console.log($('#welcomeSelector option:selected').val());
  var key = $('#welcomeSelector option:selected').val();
  switch (key) {
    case 'ss1': showSidebarRegionGrants(); break;
    case 'ss2': showSidebarSchoolData(); break;
  }
}

$(document).ready(function() {
  AppData.featureOnState = { click : onStateClick };
  AppData.featureOnRegion = { click : onRegionClick };
  AppData.map = prepareMapDisplay();

  Loader(AppData, {
    onDataLoaded: function() {
      $('.waiting').empty();
      $('#welcomeSelector').change(onWelcomeSelector);
      zoomAustralia();
    },
    onItemLoaded: function(item) {
      $('.waiting').append(item + ' ');
     }
   });
});
