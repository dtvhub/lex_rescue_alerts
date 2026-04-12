// -----------------------------------------------------
//  LEXINGTON FIRE & EMS INCIDENTS (Separate Layers)
// -----------------------------------------------------

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

// -----------------------------------------------------
//  LOAD CODEBOOK
// -----------------------------------------------------
let CODEBOOK = {};
(async () => {
  try {
    const res = await fetch("./js/codebook.js");
    const text = await res.text();
    eval(text); // loads CODEBOOK
  } catch (err) {
    console.error("Failed to load codebook.js", err);
  }
})();

// -----------------------------------------------------
//  BLOCK ADDRESS FIXER
//  "MASTERSON STATION DR 300 Blk" → "300 MASTERSON STATION DR"
// -----------------------------------------------------

function fixBlockAddress(address) {
  if (!address) return address;

  const blkMatch = address.match(/(.+?)\s+(\d+)\s*Blk/i);
  if (blkMatch) {
    const street = blkMatch[1].trim();
    const number = blkMatch[2].trim();
    return `${number} ${street}`;
  }

  return address;
}

// -----------------------------------------------------
//  CLIENT-SIDE GEOCODING (with caching)
// -----------------------------------------------------

const geocodeCache = {};

async function geocodeAddress(address) {
  if (!address) return null;

  if (geocodeCache[address]) return geocodeCache[address];

  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address + ", Lexington KY")}`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "BeaconMap" }
    });
    const json = await res.json();

    if (!json.length) return null;

    const geo = {
      lat: parseFloat(json[0].lat),
      lng: parseFloat(json[0].lon)
    };

    geocodeCache[address] = geo;
    return geo;

  } catch (err) {
    console.error("Geocoding failed:", err);
    return null;
  }
}

// -----------------------------------------------------
//  CATEGORY + TRANSLATION HELPERS
// -----------------------------------------------------

function translateType(type) {
  if (!type) return "";
  return CODEBOOK[type] || type;
}

function detectCategory(type) {
  if (!type) return "EMS";
  const t = type.toUpperCase();
  if (t.startsWith("F")) return "FIRE";
  return "EMS";
}

function getIconForCategory(cat) {
  return cat === "FIRE" ? fireIcon : emsIcon;
}

// -----------------------------------------------------
//  FETCH LEXINGTON INCIDENTS
// -----------------------------------------------------

async function loadLexingtonIncidents() {
  try {
    const response = await fetch("https://lexrescuealerts.jeffreydraper.workers.dev/");
    let data = await response.json();

    if (data.incidents) data = data.incidents;

    fireLayer.clearLayers();
    emsLayer.clearLayers();

    for (const incident of data) {
      const type = incident.type || "";
      const translated = translateType(type);
      const category = detectCategory(type);

      const rawAddress = incident.address || "";
      const fixedAddress = fixBlockAddress(rawAddress);

      const geo = await geocodeAddress(fixedAddress);
      if (!geo) continue;

      const marker = L.marker([geo.lat, geo.lng], {
        icon: getIconForCategory(category)
      });

      // Apparatus extraction (aa1, aa2, aa3…)
      const apparatusHTML = Object.keys(incident)
        .filter(k => k.startsWith("aa"))
        .map(k => incident[k])
        .join("<br>");

      marker.bindPopup(`
        <b>${category}</b><br>
        ${type} - ${translated}<br><br>

       
