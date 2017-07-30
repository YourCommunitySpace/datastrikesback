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

// http://oramind.com/country-border-highlighting-with-leaflet-js/

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

function clearTableArea()
{
  $('#regionSidebarTableContainer1').hide();
  $('#regionSidebarTableContainer2').hide();
  $('#regionSidebarTableContainer3').hide();
  $('#regionSidebarTableContainer4').hide();
  $('#regionSidebarTableContainer5').hide();
  $('#rtitlesub').empty();
}

function showSidebarRegionGrants()
{
  clearTableArea();
  $('#rtitle').html("Grant SA projects per region, 2016-2017");
  $('#rtitlesub').html("Click a row to see detailed project information<br/>Totals include averages to account for statewide projects!");
  $('#regionSidebarTableContainer1').show();
  $("#regionSidebarTableDollars").tabulator("redraw");
  $("#regionSidebarTableDollars").tabulator("setSort", "total", "desc");
}

function showSidebarSchoolData()
{
  clearTableArea();
  $('#rtitle').html("Schools per region");
  $('#regionSidebarTableContainer2').show();
  $("#regionSidebarTableSchools").tabulator("redraw");
}

function showSidebarPopulation()
{
  clearTableArea();
  $('#rtitle').html("Persons per region, 2016 Census");
  $('#regionSidebarTableContainer4').show();
  $("#regionSidebarTablePopulation").tabulator("redraw");
}

function showSidebarRoadCrash()
{
  clearTableArea();
  $('#rtitle').html("Road crash per region");
  $('#rtitlesub').html("Includes crash report data for 2016, even minor");
  $('#regionSidebarTableContainer3').show();
  $("#regionSidebarTableRoadCrash").tabulator("redraw");
}

function showSidebarFedGrants()
{
  clearTableArea();
  $('#rtitle').html("Federal grant (aggregate) per region 2016");
  $('#regionSidebarTableContainer5').show();
  $("#regionSidebarTableFedGrants").tabulator("redraw");
}

function router(screen)
{
  AppData.screen = Screens.INITIAL;
  $('#welcomeChooser').removeAttr('hidden').hide();
  $('#australiaSidebarText').removeAttr('hidden').hide();
  $('#regionSidebarTableContainer1').removeAttr('hidden').hide();
  $('#regionSidebarTableContainer2').removeAttr('hidden').hide();
  $('#regionSidebarTableContainer3').removeAttr('hidden').hide();
  $('#regionSidebarTableContainer4').removeAttr('hidden').hide();
  $('#regionSidebarTableContainer5').removeAttr('hidden').hide();
  $('#regionSidebarOther').removeAttr('hidden').hide();
  switch (screen) {
    case Screens.INITIAL:
      $('#rtitle').html("Welcome");
      $('#australiaSidebarText').show();
      break;
    case Screens.ZOOM_STATE:
      $('#welcomeChooser').show();
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
    case 'ss3': showSidebarRoadCrash(); break;
    case 'ss4': showSidebarPopulation(); break;
    case 'ss5': showSidebarFedGrants(); break;
  }
}

function loadTables()
{
  $("#regionSidebarTableDollars").tabulator({
    data: AppData.grantsPerRegion,
    fitColumns: true,
    columns:[ //Define Table Columns
      {title:"Region", field:"region", align:"left"},
      {title:"Spend ($'000)", field:"total", align:"left"},
    ],
    rowClick:function(e, row) {
      $('[data-remodal-id=modal-grant-full]').remodal().open();
//      $('#grantTableFull').tabulator("redraw", true);
      $('#grantTableFull').tabulator("setData", AppData.detailedGrantsCsv);
    },
  });

  $("#regionSidebarTableSchools").tabulator({
    data: AppData.schoolsPerRegion,
    fitColumns: true,
    columns:[
      {title:"Region", field:"region", align:"left"},
      {title:"Schools", field:"count", align:"left"},
    ],
  });

  $("#regionSidebarTableRoadCrash").tabulator({
    data: AppData.roadCrashPerRegion,
    fitColumns: true,
    columns:[
      {title:"Region", field:"region", align:"left"},
      {title:"Crashes (all)", field:"count", align:"left"},
    ],
  });

  $("#regionSidebarTablePopulation").tabulator({
    data: AppData.populationPerRegion,
    fitColumns: true,
    columns:[
      {title:"Region", field:"region", align:"left"},
      {title:"Persons", field:"count", align:"left"},
    ],
  });

  console.log('AppData.detailedGrantsCsv=' + JSON.stringify(AppData.fedGrantPerRegion));
  $("#regionSidebarTableFedGrants").tabulator({
    data: AppData.fedGrantPerRegion,
    fitColumns: true,
    columns:[
      {title:"Region", field:"region", align:"left"},
      {title:"Value ($'000)", field:"value", align:"left"},
    ],
  });

  //console.log('AppData.detailedGrantsCsv=' + JSON.stringify(AppData.detailedGrantsCsv));

  $('#grantTableFull').tabulator({
    data: AppData.detailedGrantsCsv,
    height: "250px",
    //pagination:"local", // doesnt work :-()
    //fitColumns: true,
    columns:[ //Define Table Columns
      {title:"Amount", field:"amount", align:"left", xwidth: "100px"},
      {title:"Project", field:"project", align:"left", width: "400px"},
      // tabulator seems to be buggy...
      // Project Title,Project Description,Region,Amount
    ],
  });
}

$(document).ready(function() {
  AppData.featureOnState = { click : onStateClick };
  AppData.featureOnRegion = { click : onRegionClick };
  AppData.map = prepareMapDisplay();
  $('#go-home').on('click', zoomAustralia);

  Loader(AppData, {
    onDataLoaded: function() {
      $('.waiting').empty();
      $('#welcomeSelector').change(onWelcomeSelector);
      loadTables();
      zoomAustralia();
    },
    onItemLoaded: function(item) {
      $('.waiting').append(item + ' ');
     }
   });
});
