// -----------------------------------------------------
//  LAYER CONTROL FOR BEACON MAP
// -----------------------------------------------------

// Base layers (empty unless you add basemaps later)
const baseLayers = {};

// Overlay layers (toggleable)
const overlays = {
  "Fire": fireLayer,
  "EMS": emsLayer,
  "Cameras": cameras
};

// Add the control to the map
L.control.layers(baseLayers, overlays, {
  collapsed: false
}).addTo(map);
