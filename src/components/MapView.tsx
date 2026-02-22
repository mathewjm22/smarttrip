import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default icon issue in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapViewProps {
  markers: { lat: number; lon: number; label: string }[];
  routeGeometry: [number, number][];
}

function MapUpdater({ markers, routeGeometry }: MapViewProps) {
  const map = useMap();

  useEffect(() => {
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lon]));
      if (routeGeometry.length > 0) {
        routeGeometry.forEach(c => bounds.extend(c as [number, number]));
      }
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, markers, routeGeometry]);

  return null;
}

export default function MapView({ markers, routeGeometry }: MapViewProps) {
  const defaultCenter: [number, number] = [39.8283, -98.5795]; // Center of US

  return (
    <div classname="h-full w-full rounded-xl overflow-hidden shadow-md border border-slate-200 z-0 relative">
      <mapcontainer center="{defaultCenter}" zoom="{4}" classname="h-full w-full" zoomcontrol="{false}">
        <tilelayer attribution="© &lt;a href=&#34;https://www.openstreetmap.org/copyright&#34;&gt;OpenStreetMap&lt;/a&gt; contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
        {markers.map((marker, idx) => (
          <marker key="{idx}" position="{[marker.lat," marker.lon]}="">
            <popup>{marker.label}</Popup>
          </Marker>
        ))}
        {routeGeometry.length > 0 && (
          <polyline positions="{routeGeometry}" color="#3b82f6" weight="{4}" opacity="{0.7}"/>
        )}
        <mapupdater markers="{markers}" routegeometry="{routeGeometry}"/>
      </MapContainer>
    </div>
  );
}
