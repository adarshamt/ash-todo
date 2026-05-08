"use client";

import React, { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';

export default function LocationPicker({
  locationName,
  setLocationName,
  locationCoords,
  setLocationCoords,
  locationRadius,
  setLocationRadius,
  locationStatus,
  setLocationStatus,
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const leafletRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const drawSelection = (lat, lng) => {
    const map = mapInstanceRef.current;
    const L = leafletRef.current;
    if (!map || !L) return;

    const latLng = [lat, lng];
    const markerIcon = L.divIcon({
      className: 'map-picker-marker',
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });

    if (markerRef.current) {
      markerRef.current.setLatLng(latLng);
    } else {
      markerRef.current = L.marker(latLng, { icon: markerIcon }).addTo(map);
    }

    if (circleRef.current) {
      circleRef.current.setLatLng(latLng);
      circleRef.current.setRadius(locationRadius);
    } else {
      circleRef.current = L.circle(latLng, {
        radius: locationRadius,
        color: '#df5827',
        fillColor: '#df5827',
        fillOpacity: 0.12,
        weight: 1,
      }).addTo(map);
    }
  };

  useEffect(() => {
    if (!mapRef.current) return;
    if (mapInstanceRef.current) return;

    let disposed = false;
    let map = null;

    const initMap = async () => {
      const leafletModule = await import('leaflet');
      const L = leafletModule.default || leafletModule;
      if (disposed || !mapRef.current || mapInstanceRef.current) return;

      leafletRef.current = L;

      const start = locationCoords
        ? [locationCoords.lat, locationCoords.lng]
        : [20.5937, 78.9629];
      const zoom = locationCoords ? 15 : 5;

      map = L.map(mapRef.current, {
        center: start,
        zoom,
        zoomControl: false,
        attributionControl: true,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        setLocationCoords({ lat, lng });
        setLocationStatus(`Selected ${lat.toFixed(4)}, ${lng.toFixed(4)} from map.`);
        drawSelection(lat, lng);
      });

      mapInstanceRef.current = map;

      if (locationCoords) {
        drawSelection(locationCoords.lat, locationCoords.lng);
      }

      setTimeout(() => {
        try {
          map.invalidateSize();
        } catch (e) {
          console.warn('Map resize failed', e);
        }
      }, 100);
    };

    initMap();

    const onResize = () => {
      try {
        mapInstanceRef.current?.invalidateSize();
      } catch (e) {
        console.warn('Map resize failed', e);
      }
    };
    window.addEventListener('resize', onResize);

    return () => {
      disposed = true;
      window.removeEventListener('resize', onResize);
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (locationCoords) {
      mapInstanceRef.current.setView([locationCoords.lat, locationCoords.lng], 15);
      drawSelection(locationCoords.lat, locationCoords.lng);
    }
  }, [locationCoords, locationRadius]);

  const search = async () => {
    if (!query.trim()) return;

    try {
      setIsSearching(true);
      setLocationStatus('Searching...');
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`
      );
      const json = await res.json();
      setResults(json);
      setLocationStatus(json.length ? `Found ${json.length} result(s)` : 'No results');
    } catch (e) {
      setLocationStatus('Search failed');
    } finally {
      setIsSearching(false);
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

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Location is not available in this browser.');
      return;
    }

    setIsLocating(true);
    setLocationStatus('Finding your current location...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLocationCoords({ lat, lng });
        setLocationStatus(`Selected current location: ${lat.toFixed(4)}, ${lng.toFixed(4)}.`);
        setIsLocating(false);
      },
      (error) => {
        setLocationStatus(error.message || 'Could not find your current location.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 15000 }
    );
  };

  return (
    <div className="location-picker">
      <div className="search-row">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search places or address"
          className="location-search-input"
          onKeyDown={(e) => e.key === 'Enter' && search()}
        />
        <button type="button" onClick={search} className="location-search-btn" disabled={isSearching}>
          {isSearching ? 'Searching...' : 'Search'}
        </button>
        <button type="button" onClick={useCurrentLocation} className="location-search-btn secondary" disabled={isLocating}>
          {isLocating ? 'Locating...' : 'Use current'}
        </button>
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

      <div className="map-canvas" ref={mapRef} />

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
      <div className="location-picker-status">
        {locationStatus || 'Search, use current location, or click the map to select where this todo should alert.'}
      </div>
    </div>
  );
}
