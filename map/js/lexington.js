// Fetch and parse Lexington Fire incidents
async function fetchLexingtonCalls() {
  const url = "https://api.allorigins.win/raw?url=http://fire.lexingtonky.gov/open/status/status.htm";

  try {
    const response = await fetch(url);
    const html = await response.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Each incident is inside: <div class="data" grid>
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

// Update the map with markers
async function updateMap() {
  console.log("updateMap() called");

  const calls = await fetchLexingtonCalls();
  console.log("Lexington calls:", calls);

  // TODO: Add your marker update logic here
  // Example:
  // clearMarkers();
  // calls.forEach(call => addMarker(call));
}

// Run immediately on load
updateMap();

// Refresh every 60 seconds
setInterval(updateMap, 60000);
