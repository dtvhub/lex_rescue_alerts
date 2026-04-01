async function loadNicholasville() {
  const url = "https://nicholasvillerescuealerts.jeffreydraper.workers.dev/";

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!data.incidents) return;

    data.incidents.forEach(incident => {
      if (!incident.latitude || !incident.longitude) return;

      const popup = `
        <b>${incident.type}</b><br>
        ${incident.address}<br>
        ${incident.city}, KY<br>
        <small>${new Date(incident.eventTime).toLocaleString()}</small>
      `;

      L.marker([incident.latitude, incident.longitude])
        .addTo(map)
        .bindPopup(popup);
    });

  } catch (err) {
    console.error("Nicholasville error:", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadNicholasville();
  setInterval(loadNicholasville, 60000);
});
