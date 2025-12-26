'use client';

import Map, { Source, Layer } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

export default function ActivityMap({ coordinates }: { coordinates: [number, number][] }) {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: coordinates,
    },
  };

  return (
    <div className="w-full h-[500px] rounded-2xl overflow-hidden border border-zinc-200">
      <Map
        mapboxAccessToken={mapboxToken}
        initialViewState={{
          longitude: coordinates[0][0],
          latitude: coordinates[0][1],
          zoom: 16,
          pitch: 0,
        }}
        mapStyle="mapbox://styles/mapbox/outdoors-v12"
      >
        <Source id="my-route" type="geojson" data={geojson}>
          <Layer
            id="route-line"
            type="line"
            layout={{
              'line-join': 'round',
              'line-cap': 'round'
            }}
            paint={{
              'line-color': '#f26522',
              'line-width': 5
            }}
          />
        </Source>
      </Map>
    </div>
  );
}