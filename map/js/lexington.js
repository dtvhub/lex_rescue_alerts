// -----------------------------------------------------
//  ICONS
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

function getIncidentIcon(category) {
  return category === "EMS" ? medIcon : fireIcon;
}

// -----------------------------------------------------
//  CATEGORY DETECTION
// -----------------------------------------------------
function getCategoryFromCode(code) {
  if (!code) return "UNKNOWN";
  if (code.startsWith("E")) return "EMS";
  if (code.startsWith("F")) return "FIRE";
  return "EMS"; // numeric defaults to EMS
}

// -----------------------------------------------------
//  LOAD CODEBOOK
// -----------------------------------------------------
let CODEBOOK = { ems: [], fire: [] };

async function loadCodebook() {
  try {
    const res = await fetch("./data/codes.yml");   // FIXED PATH
    const text = await res.text();
    CODEBOOK = jsyaml.load(text);
  } catch (err) {
    console.error("Error loading codebook:", err);
  }
}

function translateCode(category, code) {
  if (!CODEBOOK || !code) return code;
  const list = category === "EMS" ? CODEBOOK.ems : CODEBOOK.fire;
  if (!Array.isArray(list)) return code;
  const found = list.find(entry => entry.code === code);
  return found ? found.description : code;
}

// -----------------------------------------------------
//  APPARATUS EXTRACTION
// -----------------------------------------------------
function getApparatusList(incident) {
  return Object.entries(incident)
    .filter(([key, value]) =>
      (key.startsWith("aa") || key.startsWith("key")) &&
      value &&
      value.trim() !== ""
    )
    .map(([key, value]) => `[${value}]`);
}

// -----------------------------------------------------
//  GEOCODER
// -----------------------------------------------------
async function geocodeAddress(address) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
  const res = await fetch(url);
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
    const res = await fetch(url);
    const data = await res.json();

    lexRescueMarkers.forEach(m => map.removeLayer(m));
    lexRescueMarkers = [];

    for (const incident of data.incidents) {
      if (!incident.address) continue;

      let cleanedAddress = incident.address;
      const blockMatch = cleanedAddress.match(/(\d+)\s*Blk/i);

      if (blockMatch) {
        const blockNum = blockMatch[1];
        cleanedAddress = cleanedAddress.replace(/(\d+)\s*Blk/i, "").trim();
        cleanedAddress = `${blockNum} ${cleanedAddress}`;
      }

      const geo = await geocodeAddress(cleanedAddress + ", Lexington KY");
      if (!geo) continue;

      const code = incident.type;
      const category = getCategoryFromCode(code);
      const translated = translateCode(category, code);

      const apparatus = getApparatusList(incident);
      const apparatusHTML = apparatus.length
        ? `<br><b>Apparatus:</b> ${apparatus.join(", ")}`
        : "";

      const marker = L.marker([geo.lat, geo.lng], {
        icon: getIncidentIcon(category)
      })
      .addTo(map)
      .bindPopup(`
        <b>${category}</b><br>
        ${code} - ${translated}<br><br>

        Incident: ${incident.incident}<br>
        Alarm: ${incident.alarm}<br>
        Address: ${incident.address}<br>
        Enroute: ${incident.enroute}<br>
        Arrive: ${incident.arrive}
        ${apparatusHTML}
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
  await loadCodebook();
  await loadLexRescueLayer();
  setInterval(loadLexRescueLayer, 60000);
});
