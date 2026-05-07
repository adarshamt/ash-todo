"use client";

import React, { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

export default function LocationPicker({
  locationName,
  setLocationName,
  locationCoords,
  setLocationCoords,
  locationRadius,
  setLocationRadius,
  setLocationStatus,
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!mapRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapRef.current, { center: [0, 0], zoom: 2 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      setLocationCoords({ lat, lng });
      setLocationStatus(`Pinned spot at ${lat.toFixed(4)}, ${lng.toFixed(4)}`);

      if (markerRef.current) markerRef.current.setLatLng(e.latlng);
      else markerRef.current = L.marker(e.latlng).addTo(map);
    });

    mapInstanceRef.current = map;

    // ensure tiles render correctly when container becomes visible
    setTimeout(() => {
      try {
        map.invalidateSize();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('invalidateSize failed', e);
      }
    }, 100);

    const onResize = () => {
      try { map.invalidateSize(); } catch (_) {}
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      map.remove();
    };
  }, [setLocationCoords, setLocationStatus]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (locationCoords) {
      try {
        if (typeof mapInstanceRef.current.setView === 'function') {
          mapInstanceRef.current.setView([locationCoords.lat, locationCoords.lng], 15);
        } else if (typeof mapInstanceRef.current.panTo === 'function') {
          mapInstanceRef.current.panTo([locationCoords.lat, locationCoords.lng]);
        } else {
          // unexpected instance, log for debugging
          // eslint-disable-next-line no-console
          console.warn('mapInstanceRef is not a Leaflet map', mapInstanceRef.current);
        }

        if (markerRef.current && typeof markerRef.current.setLatLng === 'function') {
          markerRef.current.setLatLng([locationCoords.lat, locationCoords.lng]);
        } else {
          markerRef.current = L.marker([locationCoords.lat, locationCoords.lng]).addTo(mapInstanceRef.current);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error updating map view', err, mapInstanceRef.current);
      }
    }
  }, [locationCoords]);

  const search = async () => {
    if (!query) return;
    try {
      setLocationStatus('Searching...');
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`
      );
      const json = await res.json();
      setResults(json);
      setLocationStatus(json.length ? `Found ${json.length} result(s)` : 'No results');
    } catch (e) {
      setLocationStatus('Search failed');
    }
  };

  const selectResult = (r) => {
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    setLocationCoords({ lat, lng });
    setLocationName(r.display_name);
    setResults([]);
    setQuery('');
    setLocationStatus(r.display_name);
  };

  return (
    <div className="location-picker">
      <div className="search-row">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search places or address"
          className="location-search-input"
        />
        <button type="button" onClick={search} className="location-search-btn">Search</button>
      </div>

      {results.length > 0 && (
        <ul className="search-results">
          {results.map((r) => (
            <li key={r.place_id} onClick={() => selectResult(r)} className="search-result-item">
              {r.display_name}
            </li>
          ))}
        </ul>
      )}

      <div ref={mapRef} style={{ height: 240, width: '100%', borderRadius: 8, overflow: 'hidden' }} />

      <div className="picker-controls">
        <input
          type="text"
          placeholder="Label (optional)"
          value={locationName}
          onChange={(e) => setLocationName(e.target.value)}
          className="location-label-input"
        />
        <select
          value={locationRadius}
          onChange={(e) => setLocationRadius(Number(e.target.value))}
          className="location-radius-select"
        >
          <option value={75}>75m</option>
          <option value={150}>150m</option>
          <option value={300}>300m</option>
          <option value={500}>500m</option>
        </select>
      </div>
    </div>
  );
}
