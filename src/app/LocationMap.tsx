import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import Leaflet from "leaflet";
import { useEffect } from "react";
import { ATM } from "./interfaces/interfaces";

const LocationMap = ({
  userLocation,
  atms,
}: {
  userLocation: number[];
  atms: ATM[];
}) => {
  const userIcon = new Leaflet.Icon({
    iconUrl: "person.png",
    iconSize: [40, 40],
    iconAnchor: [20, 0],
  });

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

  return (
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
  );
};

export default LocationMap;
