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
//  ADDRESS NORMALIZATION HELPERS
// -----------------------------------------------------

function decodeHtmlEntities(str) {
  if (!str) return str;
  return str
    .replace(/&amp;/gi, "&")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function expandStreetAbbreviations(str) {
  if (!str) return str;

  return str
    .replace(/\bN\b/gi, "North")
    .replace(/\bS\b/gi, "South")
    .replace(/\bE\b/gi, "East")
    .replace(/\bW\b/gi, "West")
    .replace(/\bST\b/gi, "Street")
    .replace(/\bRD\b/gi, "Road")
    .replace(/\bAVE\b/gi, "Avenue")
    .replace(/\bBLVD\b/gi, "Boulevard")
    .replace(/\bDR\b/gi, "Drive")
    .replace(/\bPL\b/gi, "Place")
    .replace(/\bCT\b/gi, "Court")
    .replace(/\bLN\b/gi, "Lane")
    .replace(/\bCIR\b/gi, "Circle");
}

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

function fixIntersectionAddress(address) {
  if (!address) return address;

  if (address.includes("&")) {
    const parts = address.split("&").map(p => p.trim());
    if (parts.length === 2 && parts[0] && parts[1]) {
      return `${parts[0]} & ${parts[1]}`;
    }
  }

  return address;
}

function normalizeAddress(raw) {
  if (!raw) return raw;

  let fixed = decodeHtmlEntities(raw);
  fixed = fixBlockAddress(fixed);
  fixed = fixIntersectionAddress(fixed);
  fixed = expandStreetAbbreviations(fixed);

  return fixed;
}

// -----------------------------------------------------
//  CLIENT-SIDE GEOCODING (with caching)
// -----------------------------------------------------

const geocodeCache = {};

async function geocodeAddress(address) {
  if (!address) return null;

  if (geocodeCache[address]) return geocodeCache[address];

  let url;

  // Intersection → use q= search (reliable)
  if (address.includes("&")) {
    url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address + ", Lexington KY")}`;
  }

  // Normal address fallback
  if (!url) {
    url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address + ", Lexington KY")}`;
  }

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "BeaconMap" }
    });
    const json = await res.json();

    if (!json.length) {
      console.warn("No geocode result:", address);
      return null;
    }

    const geo = {
      lat: parseFloat(json[0].lat),
      lng: parseFloat(json[0].lon)
    };

    geocodeCache[address] = geo;
    return geo;

  } catch (err) {
    console.error("Geocoding failed:", address, err);
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
      const normalizedAddress = normalizeAddress(rawAddress);

      const geo = await geocodeAddress(normalizedAddress);
      if (!geo) continue;

      const marker = L.marker([geo.lat, geo.lng], {
        icon: getIconForCategory(category)
      });

      const apparatusHTML = Object.keys(incident)
        .filter(k => k.startsWith("aa"))
        .map(k => incident[k])
        .join("<br>");

      marker.bindPopup(`
        <b>${category}</b><br>
        ${type} - ${translated}<br><br>

        <strong>Incident:</strong> ${incident.incident || ""}<br>
        <strong>Alarm:</strong> ${incident.alarm || ""}<br>
        <strong>Address:</strong> ${rawAddress}<br>
        <strong>Geocoded:</strong> ${normalizedAddress}<br>
        <strong>Enroute:</strong> ${incident.enroute || ""}<br>
        <strong>Arrive:</strong> ${incident.arrive || ""}<br><br>

        ${apparatusHTML ? `<strong>Units:</strong><br>${apparatusHTML}` : ""}
      `);

      if (category === "FIRE") {
        fireLayer.addLayer(marker);
      } else {
        emsLayer.addLayer(marker);
      }
    }

    fireLayer.addTo(map);
    emsLayer.addTo(map);

  } catch (err) {
    console.error("Lexington incident load failed:", err);
  }
}

loadLexingtonIncidents();
setInterval(loadLexingtonIncidents, 60000);
