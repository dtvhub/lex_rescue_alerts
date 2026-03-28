async function fetchLexingtonCalls() {
  const url = "https://fire.lexingtonky.gov/open/status/status.htm";

  const response = await fetch(url);
  const html = await response.text();

  // Parse HTML into a DOM
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // Select the table rows
  const rows = [...doc.querySelectorAll("table tr")].slice(1); // skip header

  const calls = rows.map(row => {
    const cells = row.querySelectorAll("td");

    return {
      incident: cells[0]?.innerText.trim(),
      type: cells[1]?.innerText.trim(),
      address: cells[2]?.innerText.trim(),
      units: cells[3]?.innerText.trim(),
      time: cells[4]?.innerText.trim()
    };
  });

  return calls;
}
