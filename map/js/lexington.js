async function fetchLexingtonCalls() {
  // Use AllOrigins to bypass HTTPS → HTTP blocking
  const url = "https://api.allorigins.win/raw?url=http://fire.lexingtonky.gov/open/status/status.htm";

  try {
    const response = await fetch(url);
    const html = await response.text();

    // Parse HTML into a DOM
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Select table rows (skip header)
    const rows = [...doc.querySelectorAll("table tr")].slice(1);

    const calls = rows.map(row => {
      const cells = row.querySelectorAll("td");

      return {
        incident: cells[0]?.innerText.trim() || "",
        type: cells[1]?.innerText.trim() || "",
        address: cells[2]?.innerText.trim() || "",
        units: cells[3]?.innerText.trim() || "",
        time: cells[4]?.innerText.trim() || ""
      };
    });

    return calls;

  } catch (err) {
    console.error("Error fetching Lexington calls:", err);
    return [];
  }
}
