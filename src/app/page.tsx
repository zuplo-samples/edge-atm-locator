"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import Leaflet from "leaflet";
import { ATM } from "./interfaces/interfaces";

export default function Home() {
  const userLocation = [38.9283, -77.1753];
  const [radius, setRadius] = useState(5);
  const [atms, setAtms] = useState<ATM[]>([]);

  useEffect(() => {
    (async function init() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (Leaflet.Icon.Default.prototype as any)._getIconUrl;
      Leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: "leaflet/images/marker-icon-2x.png",
        iconUrl: "leaflet/images/marker-icon.png",
        shadowUrl: "leaflet/images/marker-shadow.png",
      });
    })();
  }, []);

  const searchATMs = async () => {
    const [lat, lng] = userLocation;
    const apiPath = `/api/atms?lat=${lat}&lng=${lng}&radius=${radius}`;
    const apiDomain = process.env.NEXT_PUBLIC_ZUPLO_DOMAIN;
    const url = apiDomain ? new URL(apiPath, apiDomain) : apiPath;
    const response = await fetch(url);
    const data = await response.json();
    setAtms(data);
  };
  const userIcon = new Leaflet.Icon({
    iconUrl: "person.png",
    iconSize: [40, 40],
    iconAnchor: [20, 0],
  });

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
      {userLocation && (
        <MapContainer
          center={{ lat: userLocation[0], lng: userLocation[1] }}
          zoom={13}
          style={{ height: "500px", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <Marker
            position={{ lat: userLocation[0], lng: userLocation[1] }}
            icon={userIcon}
          >
            <Popup>Your Location</Popup>
          </Marker>
          {atms.map((atm) => (
            <Marker key={atm.id} position={[atm.latitude, atm.longitude]}>
              <Popup>
                <h3 className="font-semibold">{atm.name}</h3>
                <p>
                  {atm.address.street_number} {atm.address.street_name},{" "}
                  {atm.address.city}, {atm.address.state} {atm.address.zip}
                </p>
                <p>Distance: {atm.distance.toFixed(2)} miles</p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${atm.latitude},${atm.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 underline"
                >
                  View on Google Maps
                </a>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}
    </div>
  );
}
