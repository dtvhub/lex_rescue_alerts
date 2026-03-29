// -----------------------------------------------------
//  ICONS (Blue for MED, Red for FIRE)
// -----------------------------------------------------
const medIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

const fireIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

function getIncidentIcon(type) {
  return type === "MED" ? medIcon : fireIcon;
}

// -----------------------------------------------------
//  LOAD EMS/FIRE CODEBOOK (codes.yml)
// -----------------------------------------------------
let CODEBOOK = { ems: [], fire: [] };

async function loadCodebook() {
  try {
    const res = await fetch("./codes/codes.yml");
    const text = await res.text();
    CODEBOOK = jsyaml.load(text);
  } catch (err) {
    console.error("Error loading codebook:", err);
  }
}

function translateCode(type, code) {
  if (!CODEBOOK || !code) return code;

  const list = type === "MED" ? CODEBOOK.ems : CODEBOOK.fire;
  const found = list.find(entry => entry.code === code);

  return found ? found.description : code;
}

// -----------------------------------------------------
//  GEOCODER
// -----------------------------------------------------
async function geocodeAddress(address) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
  const res = await fetch(url, { headers: { "User-Agent": "LexRescueMap" } });
  const json = await res.json();
  if (json.length === 0) return null;
  return { lat: parseFloat(json[0].lat), lng: parseFloat(json[0].lon) };
}

// -----------------------------------------------------
//  MAIN INCIDENT LOADER
// -----------------------------------------------------
let lexRescueMarkers = [];

async function loadLexRescueLayer() {
  const url = "https://lexrescuealerts.jeffreydraper.workers.dev/";

  try {
    const res = await fetch(url, { headers: { "User-Agent": "LexRescueMap" } });
    const data = await res.json();

    // Clear old markers
    lexRescueMarkers.forEach(m => map.removeLayer(m));
    lexRescueMarkers = [];

    for (const incident of data.incidents) {
      if (!incident.address) continue;

      // Fix block-style addresses
      let cleanedAddress = incident.address;
      const blockMatch = cleanedAddress.match(/(\d+)\s*Blk/i);

      if (blockMatch) {
        const blockNum = blockMatch[1];
        cleanedAddress = cleanedAddress.replace(/(\d+)\s*Blk/i, "").trim();
        cleanedAddress = `${blockNum} ${cleanedAddress}`;
      }

      const geo = await geocodeAddress(cleanedAddress + ", Lexington KY");
      if (!geo) continue;

      // Translate EMS/FIRE code
      const translated = translateCode(incident.type, incident.incident);

      const marker = L.marker([geo.lat, geo.lng], {
        icon: getIncidentIcon(incident.type)
      })
      .addTo(map)
      .bindPopup(`
        <b>${incident.type}</b><br>
        Incident: ${translated} (${incident.incident})<br>
        Alarm: ${incident.alarm}<br>
        Address: ${incident.address}<br>
        Enroute: ${incident.enroute}<br>
        Arrive: ${incident.arrive}
      `);

      lexRescueMarkers.push(marker);
    }

  } catch (err) {
    console.error("Error loading LexRescue layer:", err);
  }
}

// -----------------------------------------------------
//  STARTUP
// -----------------------------------------------------
document.addEventListener("DOMContentLoaded", async () => {
  await loadCodebook();      // <-- load YAML first
  await loadLexRescueLayer();
  setInterval(loadLexRescueLayer, 60000);
});
