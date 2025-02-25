"use client";

import { useState } from "react";
import { ATM } from "./interfaces/interfaces";
import dynamic from "next/dynamic";
const LocationMap = dynamic(() => import("./LocationMap"), { ssr: false });

export default function Home() {
  const userLocation = [38.9283, -77.1753];
  const [radius, setRadius] = useState(5);
  const [atms, setAtms] = useState<ATM[]>([]);

  const searchATMs = async () => {
    const [lat, lng] = userLocation;
    const apiPath = `/api/atms?lat=${lat}&lng=${lng}&radius=${radius}`;
    const apiDomain = process.env.NEXT_PUBLIC_ZUPLO_DOMAIN;
    const url = apiDomain ? new URL(apiPath, apiDomain) : apiPath;
    const response = await fetch(url);
    const data = await response.json();
    setAtms(data);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Edge ATM Locator</h1>
      <p className="pb-4">
        This demo is meant to model a good use-case for running an fullstack
        application at the edge
      </p>
      <p className="pb-4">Demo Location: McLean, Virginia, USA</p>
      <div className="mb-4">
        <label htmlFor="radius" className="mr-2">
          Search Radius (miles):
        </label>
        <input
          type="number"
          id="radius"
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          className="border rounded px-2 py-1 text-black"
        />
        <button
          onClick={searchATMs}
          className="ml-2 bg-blue-500 text-white px-4 py-1 rounded"
        >
          Search
        </button>
      </div>
      {userLocation && <LocationMap userLocation={userLocation} atms={atms} />}
    </div>
  );
}
