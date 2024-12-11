"use client";

import { useCallback, useState } from "react";
import { GoogleMap, LoadScript, DirectionsRenderer } from "@react-google-maps/api";

const GOOGLE_MAPS_API_KEY = "AIzaSyAnOv5uNrcma62UcjtcOrXKydDOaW3vLj0";

interface GoogleMapComponentProps {
  directions: google.maps.DirectionsResult | null;
}

export function GoogleMapComponent({ directions }: GoogleMapComponentProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  return (
    <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "400px" }}
        center={{ lat: 37.7749, lng: -122.4194 }}
        zoom={12}
        onLoad={onLoad}
        onUnmount={onUnmount}
      >
        {directions && <DirectionsRenderer directions={directions} />}
      </GoogleMap>
    </LoadScript>
  );
}