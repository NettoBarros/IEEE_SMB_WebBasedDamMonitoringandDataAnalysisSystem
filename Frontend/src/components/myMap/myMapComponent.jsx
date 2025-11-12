import React, { useEffect, useRef } from 'react';
import { MapContainer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

function ImageOverlay({ imgSrc }) {
  const map = useMap();
  const imageOverlayRef = useRef(null);

  useEffect(() => {
    const img = new Image();
    img.src = imgSrc;
    img.onload = function() {
      const width = this.width;
      const height = this.height;
      const ratio = width / height;
      const imageBounds = [[-90 / ratio, -90], [90 / ratio, 90]];

      // Remove the previous image overlay if it exists
      if (imageOverlayRef.current) {
        map.removeLayer(imageOverlayRef.current);
      }

      // Add the new image overlay
      imageOverlayRef.current = L.imageOverlay(imgSrc, imageBounds);
      imageOverlayRef.current.addTo(map);
    };
  }, [imgSrc, map]);

  return null;
}

export default function MyMapComponent({ uploadOrthoimage }) {
  return (
    <MapContainer center={[0, 0]} zoom={3.5} style={{ height: "50vh", width: "100%", zIndex: 1 }}>
      <ImageOverlay imgSrc={uploadOrthoimage} />
    </MapContainer>
  );
}