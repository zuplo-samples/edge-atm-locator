/**
 * This script fetches ATM locations from the Capital One Nessie API and
 * inserts them into a D1 database.
 */

const API_KEY = process.env.NESSIE_API_KEY;
const BASE_URL = `http://api.nessieisreal.com/atms`;
const D1_API_URL = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/d1/database/${process.env.CLOUDFLARE_DATABASE_ID}/query`;
const AUTH_TOKEN = process.env.CLOUDFLARE_AUTH_TOKEN;

async function fetchATMs() {
  let atms = [];
  let nextPage = `${BASE_URL}?key=${API_KEY}`;

  while (nextPage) {
    const response = await fetch(nextPage);
    if (!response.ok) {
      console.error(`Failed to fetch ATMs:`, response.statusText);
      break;
    }

    const data = await response.json();
    if (!data.data || data.data.length === 0) {
      break; // Stop fetching if no data is returned
    }

    atms = atms.concat(data.data);
    nextPage = data.paging?.next
      ? `http://api.nessieisreal.com${data.paging.next}`
      : null;
  }

  return atms;
}

async function insertATMsIntoD1(atms) {
  for (const atm of atms) {
    const { _id: id, geocode, name, address } = atm;
    const query = `INSERT INTO atms (id, lat, long, name, address) VALUES (?, ?, ?, ?, ?)`;
    const parameters = [
      id,
      geocode.lat,
      geocode.lng,
      name,
      JSON.stringify(address),
    ];

    try {
      const response = await fetch(D1_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AUTH_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sql: query, params: parameters }),
      });

      if (!response.ok) {
        console.error(
          `Failed to insert ATM with ID ${id}:`,
          await response.text()
        );
      }
    } catch (err) {
      console.error(`Failed to insert ATM with ID ${id}:`, err);
    }
  }
}

async function main() {
  console.log("Fetching ATMs from Capital One API...");
  const atms = await fetchATMs();

  console.log(`Fetched ${atms.length} ATMs. Inserting into database...`);
  await insertATMsIntoD1(atms);

  console.log("All ATMs have been inserted successfully.");
}

main().catch((err) => {
  console.error("Error running the script:", err);
});
