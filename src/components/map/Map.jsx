import { MapContainer, TileLayer } from "react-leaflet";
import "./map.scss";
import "leaflet/dist/leaflet.css";
import Pin from "../pin/Pin";

function Map({ items }) {
  // Default coordinates for India
  const defaultCenter = [20.5937, 78.9629];
  
  // Get the first item's coordinates or use default
  const center = items.length > 0 && items[0].latitude && items[0].longitude
    ? [items[0].latitude, items[0].longitude]
    : defaultCenter;

  return (
    <MapContainer
      center={center}
      zoom={5}
      scrollWheelZoom={false}
      className="map"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {items.map((item) => (
        item.latitude && item.longitude && (
          <Pin item={item} key={item.id} />
        )
      ))}
    </MapContainer>
  );
}

export default Map;

// import { MapContainer, TileLayer } from "react-leaflet";
// import "./map.scss";
// import "leaflet/dist/leaflet.css";
// import Pin from "../pin/Pin";

// function Map({ items }) {
//   return (
//     <MapContainer
//       center={
//         items.length === 1
//           ? [items[0].latitude, items[0].longitude]
//           : undefined
//       }
//       zoom={7}
//       scrollWheelZoom={false}
//       className="map"
//     >
//       <TileLayer
//         attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//         url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//       />
//       {items.map((item) => (
//         <Pin item={item} key={item.id} />
//       ))}
//     </MapContainer>
//   );
// }

// export default Map;


