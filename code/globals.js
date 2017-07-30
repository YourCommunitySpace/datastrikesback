/*
MIT License
Copyright (c)  2017 by the yourcommunity.space team, created for GovHack 2017
*/

// NOTICE: This is proof of concept code.
// In a production system files like this would be wrapper into a module and bundled
// using something like webpack or browserify, etc.

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
    color: 'green',
    fillOpacity: 0.1
  },
  regions: {
    weight: 1,
    opacity: 1,
    color: 'blue',
    fillOpacity: 0.2
  }
};

// Global application state data.
var AppData = {
  screen: Screens.INITIAL,

  bbox: { country: {}, state: {}, region: {}},
  regionLayers: {},
  stateLayers: {}, // stateLayers[n] where nE 1..9 is a leaflet layer

  currentState: null,   // 1..9 if zoomed

  statesItem: null,

  regionsList: {},
  regionsItem: null,
};
