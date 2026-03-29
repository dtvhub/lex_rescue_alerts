// -----------------------------------------------------
//  CREATE THE LEAFLET MAP
// -----------------------------------------------------

// Create the map centered on Lexington
const map = L.map("map").setView([38.0464, -84.4970], 12);

// -----------------------------------------------------
//  DARK BASEMAP — Carto Dark Matter (no API key needed)
// -----------------------------------------------------
L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; CartoDB"
}).addTo(map);

console.log("MAP JS LOADED (Carto Dark Matter)");
