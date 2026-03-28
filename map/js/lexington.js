// -------------------------------
//  ICONS
// -------------------------------
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

// Store markers so we can clear them on refresh
let activeMarkers = [];


// -------------------------------
//  FETCH LEXINGTON FIRE DATA
// -------------------------------
async function fetchLexingtonCalls() {
  const url = "https://thingproxy.freeboard.io/fetch/https://fire.lexingtonky.gov/open/status/status.htm";

  try {
    const response = await fetch(url);
    const html = await response.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const incidentBlocks = [...doc.querySelectorAll("div.data")];

    const calls = incidentBlocks.map(block => {
      return {
        incident: block.querySelector(".databox.incident")?.innerText.trim() || "",
        type: block.querySelector(".databox.type")?.innerText.trim() || "",
        alarm: block.querySelector(".databox.alarm")?.innerText.trim() || "",
        enroute: block.querySelector(".databox.enroute")?.innerText.trim() || "",
        arrive: block.querySelector(".databox.arrive")?.innerText.trim() || "",
        address: block.querySelector(".databox.address")?.innerText.trim() || "",
        units: [...block.querySelectorAll(".appdata .databox")]
          .map(u => u.innerText.trim())
          .join(", ")
      };
    });

    return calls;

  } catch (err) {
    console.error("Error fetching Lexington calls:", err);
    return [];
  }
}


// -------------------------------
//  GEOCODING (Nominatim)
// -------------------------------
async function geocodeAddress(address) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address + ", Lexington KY")}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.length === 0) return null;

    return [parseFloat(data[0].lat), parseFloat(data[0].lon)];

  } catch (err) {
    console.error("Geocoding error:", err);
    return null;
  }
}


// -------------------------------
//  UPDATE MAP
// -------------------------------
async function updateMap() {
  console.log("updateMap() called");

  const calls = await fetchLexingtonCalls();
  console.log("Lexington calls:", calls);

  // Clear old markers
  activeMarkers.forEach(m => map.removeLayer(m));
  activeMarkers = [];

  // Add new markers
  for (const call of calls) {
    const latlng = await geocodeAddress(call.address);
    if (!latlng) continue;

    const icon = call.type === "MED" ? medIcon : fireIcon;

    const marker = L.marker(latlng, { icon }).addTo(map);

    marker.bindPopup(`
      <strong>${call.type}</strong><br>
      Incident: ${call.incident}<br>
      Address: ${call.address}<br>
      Units: ${call.units}<br>
      Enroute: ${call.enroute}<br>
      Arrive: ${call.arrive}
    `);

    activeMarkers.push(marker);
  }
}


// -------------------------------
//  INITIALIZE
// -------------------------------
updateMap();
setInterval(updateMap, 60000);
