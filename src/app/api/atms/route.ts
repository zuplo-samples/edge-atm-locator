import { ATM } from "@/app/interfaces/interfaces";
import { NextResponse } from "next/server";

export const runtime = "edge";

interface ATMRaw {
  id: string;
  name: string;
  address: string;
  lat: number;
  long: number;
}

function calculateBoundingBox(lat: number, lng: number, radiusMiles: number) {
  const earthRadiusMiles = 3958.8; // Earth's radius in miles
  const latDelta = (radiusMiles / earthRadiusMiles) * (180 / Math.PI);
  const lngDelta =
    (radiusMiles / (earthRadiusMiles * Math.cos((lat * Math.PI) / 180))) *
    (180 / Math.PI);

  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta,
  };
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (angle: number) => (angle * Math.PI) / 180;
  const R = 3958.8; // Earth's radius in miles

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in miles
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const latRaw = searchParams.get("lat");
  const lngRaw = searchParams.get("lng");
  const radiusRaw = searchParams.get("radius");

  if (!latRaw || !lngRaw || !radiusRaw) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }
  const lat = parseFloat(latRaw);
  const lng = parseFloat(lngRaw);
  const radius = parseFloat(radiusRaw);
  const cloudflareApiToken = process.env.CLOUDFLARE_AUTH_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = process.env.CLOUDFLARE_DATABASE_ID;

  if (!cloudflareApiToken || !accountId || !databaseId) {
    return NextResponse.json(
      { error: "Missing Cloudflare configuration" },
      { status: 500 }
    );
  }

  const { minLat, maxLat, minLng, maxLng } = calculateBoundingBox(
    lat,
    lng,
    radius
  );
  // Query ATMs within the bounding box
  const query = `SELECT * FROM atms
         WHERE lat BETWEEN ? AND ?
         AND long BETWEEN ? AND ?
         LIMIT 50`;
  const params = [minLat, maxLat, minLng, maxLng];

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cloudflareApiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sql: query, params }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const results = await response.json();

    if (!results.success) {
      throw new Error("Cloudflare API request failed");
    }
    // Filter ATMs within the exact radius using Haversine formula
    const nearbyATMs = results.result[0].results
      .map((row: ATMRaw) => ({
        id: row.id,
        name: row.name,
        latitude: row.lat,
        longitude: row.long,
        address: JSON.parse(row.address),
        distance: haversine(lat, lng, row.lat, row.long),
      }))
      .filter((atm: ATM) => atm.distance <= radius);

    return NextResponse.json(nearbyATMs);
  } catch (error) {
    console.error("Error fetching ATMs:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
