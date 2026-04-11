// -----------------------------------------------------
//  LEXINGTON FIRE & EMS INCIDENTS (Separate Layers)
// -----------------------------------------------------

// Create separate Leaflet layers
const fireLayer = L.layerGroup();
const emsLayer = L.layerGroup();

// Icons
const fireIcon = L.icon({
  iconUrl: "https://github.com/dtvhub/beacon/blob/main/map/assets/images/icons/fire.png?raw=true",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

const emsIcon = L.icon({
  iconUrl: "https://github.com/dtvhub/beacon/blob/main/map/assets/images/icons/ems.png?raw=true",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

// Choose icon based on category
function getIncidentIcon(category) {
  return category === "FIRE" ? fireIcon : emsIcon;
}

// -----------------------------------------------------
//  FETCH LEXINGTON INCIDENTS FROM YOUR WORKER
// -----------------------------------------------------

async function loadLexingtonIncidents() {
  try {
    const response = await fetch("https://lexrescuealerts.jeffreydraper.workers.dev/");
    const data = await response.json();

    // Clear old markers
    fireLayer.clearLayers();
    emsLayer.clearLayers();

    data.forEach(incident => {
      const category = incident.category;
      const code = incident.code;
      const translated = incident.translated;
      const geo = incident.geo;

      if (!geo || !geo.lat || !geo.lng) return;

      const marker = L.marker([geo.lat, geo.lng], {
        icon: getIncidentIcon(category)
      });

      const apparatusHTML = incident.apparatus
        ? `<br><br><strong>Units:</strong><br>${incident.apparatus.join("<br>")}`
        : "";

      marker.bindPopup(`
        <b>${category}</b><br>
        ${code} - ${translated}<br><br>

        Incident: ${incident.incident}<br>
        Alarm: ${incident.alarm}<br>
        Address: ${incident.address}<br>
        Enroute: ${incident.enroute}<br>
        Arrive: ${incident.arrive}
        ${apparatusHTML}
      `);

      // Add marker to correct layer
      if (category === "FIRE") {
        fireLayer.addLayer(marker);
      } else {
        emsLayer.addLayer(marker);
      }
    });

    // Add both layers to map
    fireLayer.addTo(map);
    emsLayer.addTo(map);

  } catch (err) {
    console.error("Lexington incident load failed:", err);
  }
}

// Initial load
loadLexingtonIncidents();

// Refresh every 60 seconds
setInterval(loadLexingtonIncidents, 60000);
