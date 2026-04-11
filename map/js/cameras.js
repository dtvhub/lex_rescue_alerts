// -----------------------------------------------------
//  CAMERAS LAYER FOR BEACON MAP
// -----------------------------------------------------

// Custom camera icon
const cameraIcon = L.icon({
  iconUrl: '../assets/images/icons/camera.png',   // relative to /map/js/
  iconSize: [28, 28],      // display size on map
  iconAnchor: [14, 28],    // point of the icon that touches the map
  popupAnchor: [0, -28]    // popup position relative to icon
});

// Create the cameras layer
const cameras = L.geoJSON(cameraLayer, {
  pointToLayer: (feature, latlng) => {
    return L.marker(latlng, { icon: cameraIcon });
  },
  onEachFeature: (feature, layer) => {
    layer.bindPopup(`
      <strong>${feature.properties.name}</strong><br>
      <a href="${feature.properties.url}" target="_blank">Open Camera</a>
    `);
  }
});

// Add to map
cameras.addTo(map);
