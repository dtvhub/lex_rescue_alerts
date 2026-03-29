// -----------------------------------------------------
//  CREATE THE LEAFLET MAP
// -----------------------------------------------------

// Create the map centered on Lexington
const map = L.map("map").setView([38.0464, -84.4970], 12);

// Add the OpenStreetMap tile layer
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);
