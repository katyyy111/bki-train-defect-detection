import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import railwaysData from './assets/railway-map.json';

import imgGrunt from './assets/grunt.png';
import imgGruntWykres from './assets/grunt-wykres.png';
import imgDrzewa from './assets/drzewa.png';
import imgDrzewaOdl from './assets/drzewa-odl.png';

// ==========================================
// DANE I USTAWIENIA
// ==========================================
const MOCK_DATA = [
  {
    id: 'S-101743-B', name: 'Osiadanie nasypu', category: 'Geometria gruntu', type: 'Geodezja / InSAR', lat: 53.146411, lng: 18.008221,
    severity: 'Ostrzeżenie', value: 68,
    images: [imgGrunt, imgGruntWykres]
  },
  {
    id: 'S-101743-C', name: 'Niestabilność hydrologiczna torowiska', category: 'Bezpieczeństwo przydrożne', type: 'Czujniki glebowe', lat: 53.165365, lng: 18.004296,
    severity: 'Krytyczne', value: 85,
    images: [imgDrzewa, imgDrzewaOdl]
  }
];

const CATEGORIES = ['Wskaźnik temperaturowy', 'Geometria gruntu', 'Wilgotność podłoża', 'Bezpieczeństwo przydrożne'];

const CATEGORY_COLORS = {
  'Wskaźnik temperaturowy': '#d32f2f',
  'Geometria gruntu': '#7b1fa2',
  'Wilgotność podłoża': '#1976d2',
  'Bezpieczeństwo przydrożne': '#55a023'
};

const BYDGOSZCZ_BOUNDS = [
  [53.05, 17.85], // South-West corner
  [53.20, 18.15]  // North-East corner
];

const getSeverityColor = (value) => {
  if (value >= 80) return '#d32f2f';
  if (value >= 50) return '#f57c00';
  return '#1976d2';
};

const createIcon = (category) => {
  const color = CATEGORY_COLORS[category] || '#000000';
  return L.divIcon({
    className: 'custom-icon',
    html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 6px rgba(0,0,0,0.5);"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });
};

// ==========================================
// GŁÓWNY KOMPONENT
// ==========================================
export default function App() {
  const [activeFilters, setActiveFilters] = useState(CATEGORIES);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [markerStatuses, setMarkerStatuses] = useState({});

  useEffect(() => {
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';
    document.body.style.backgroundColor = '#f0f2f5';
    const rootEl = document.getElementById('root');
    if (rootEl) {
      rootEl.style.height = '100vh';
      rootEl.style.width = '100vw';
    }
  }, []);

  const toggleFilter = (category) => {
    setActiveFilters(prev => {
      const newFilters = prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category];
      if (selectedMarker && !newFilters.includes(selectedMarker.category)) {
        setSelectedMarker(null);
      }
      return newFilters;
    });
  };

  const handleAction = (id, status) => {
    setMarkerStatuses(prev => ({ ...prev, [id]: status }));
  };

  const filteredData = MOCK_DATA.filter(item => activeFilters.includes(item.category));

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', fontFamily: '"Segoe UI", "Roboto", sans-serif', boxSizing: 'border-box' }}>

      {/* SEKCJA MAPY */}
      <div style={{ flex: 1, position: 'relative' }}>
        <MapContainer
          center={[53.1235, 18.0084]}
          zoom={13}
          style={{ height: '100%', width: '100%', outline: 'none', backgroundColor: '#e5e5e5' }}
          zoomControl={false}
          minZoom={12}
          maxZoom={15}
          maxBounds={BYDGOSZCZ_BOUNDS}
        >
          <ZoomControl position="bottomright" />

          {/* Czysta, jasna mapa bazowa (bez tramwajów wbudowanych na twardo) */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; OpenStreetMap'
          />

          {/* Nakładka wektorowa z naszego pliku railways.json */}
          {railwaysData && railwaysData.features && (
            <GeoJSON
              data={railwaysData}
              style={{
                color: '#4b5563', // Ciemnoszary kolor dla torów
                weight: 2,        // Grubość linii torów
                opacity: 0.7
              }}
            />
          )}

          {/* Znaczniki */}
          {filteredData.map(item => (
            <Marker
              key={item.id}
              position={[item.lat, item.lng]}
              icon={createIcon(item.category)}
              eventHandlers={{ click: () => setSelectedMarker(item) }}
            >
              <Popup className="tech-popup">
                <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#666', borderBottom: '1px solid #ccc', paddingBottom: '4px', marginBottom: '6px' }}>
                  ID: {item.id}
                </div>
                <strong style={{ fontSize: '12px', color: '#333' }}>{item.name}</strong>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* NAKŁADKI: FILTRY */}
        <div style={{
          position: 'absolute', top: '20px', left: '20px', zIndex: 1000,
          backgroundColor: '#ffffff', boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          border: '1px solid #d0d0d0', width: '270px'
        }}>
          <div style={{ backgroundColor: '#0f204b', color: '#ffffff', padding: '10px 15px', fontSize: '14px', fontWeight: '600', letterSpacing: '1px' }}>
            KATEGORIE ZAGROŻEŃ
          </div>
          <div style={{ padding: '15px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {CATEGORIES.map(category => {
                const isActive = activeFilters.includes(category);
                const color = CATEGORY_COLORS[category];
                return (
                  <label key={category} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '12px', color: '#333', fontWeight: '500' }} onClick={() => toggleFilter(category)}>
                    <div style={{ width: '40px', height: '14px', backgroundColor: '#e0e0e0', borderRadius: '8px', position: 'relative', marginRight: '14px', display: 'flex', alignItems: 'center', border: '1px solid #ccc', flexShrink: 0 }}>
                      <div style={{ width: '100%', height: '2px', backgroundColor: '#bdbdbd', position: 'absolute', zIndex: 1 }}></div>
                      <div style={{ width: '20px', height: '20px', backgroundColor: isActive ? color : '#757575', borderRadius: '50%', position: 'absolute', left: isActive ? '20px' : '-2px', transition: 'left 0.25s, background-color 0.25s', boxShadow: '0 2px 4px rgba(0,0,0,0.4)', zIndex: 2 }} />
                    </div>
                    {category.toUpperCase()}
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* PRAWY PANEL - BEZ ZMIAN */}
      <div style={{
        width: '420px', background: '#f4f7fb', display: 'flex', flexDirection: 'column',
        borderLeft: '1px solid #d0d0d0', boxShadow: '-2px 0 10px rgba(0,0,0,0.05)', zIndex: 1001
      }}>
        <div style={{ backgroundColor: '#ffffff', padding: '15px', borderBottom: '1px solid #d0d0d0' }}>
          <div style={{ fontSize: '18px', fontWeight: '400', color: '#0f204b', display: 'flex', alignItems: 'center' }}>
            <span style={{ fontWeight: '600', marginRight: '8px' }}>INSPECTION</span> ORDER
          </div>
        </div>

        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {selectedMarker ? (
            <>
              <div style={{ backgroundColor: CATEGORY_COLORS[selectedMarker.category], color: '#ffffff', padding: '10px 15px', fontSize: '13px', fontWeight: '600', letterSpacing: '0.5px', marginBottom: '15px', borderRadius: '4px' }}>
                DETEKCJA: {selectedMarker.id}
              </div>

              <div style={{ backgroundColor: '#ffffff', padding: '15px', borderRadius: '6px', border: '1px solid #e0e0e0', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#666', fontWeight: '600' }}>KATEGORIA:</span>
                  <span style={{ fontSize: '12px', color: CATEGORY_COLORS[selectedMarker.category], fontWeight: '700' }}>{selectedMarker.category.toUpperCase()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                  <span style={{ fontSize: '12px', color: '#666', fontWeight: '600' }}>RANG. ZAGROŻENIA:</span>
                  <span style={{ fontSize: '12px', color: getSeverityColor(selectedMarker.value), fontWeight: '700' }}>{selectedMarker.value}% ({selectedMarker.severity})</span>
                </div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#0f204b', marginBottom: '10px' }}>{selectedMarker.name}</div>
                <div>
                  {selectedMarker.images.map((imgUrl, index) => (
                    <div key={index} style={{ marginBottom: '5px' }}>
                      <img src={imgUrl} alt={`Dowód wizualny ${index}`} style={{ width: '100%', height: 'auto', border: '1px solid #ccc', borderRadius: '4px' }} />
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ backgroundColor: '#ffffff', padding: '15px', borderRadius: '6px', border: '1px solid #e0e0e0', marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', color: '#666', fontWeight: '600', marginBottom: '10px' }}>STATUS DYSPOZYTORA</div>
                {markerStatuses[selectedMarker.id] && (
                  <div style={{ marginBottom: '15px', padding: '8px 12px', fontSize: '12px', fontWeight: '600', borderRadius: '4px', backgroundColor: '#eee', color: '#333' }}>
                    STATUS: {markerStatuses[selectedMarker.id]}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleAction(selectedMarker.id, 'ZWERYFIKOWANE')} style={{ flex: 1, padding: '8px', backgroundColor: '#4caf50', border: '1px solid #388e3c', color: '#ffffff', fontSize: '10px', fontWeight: '600', cursor: 'pointer', borderRadius: '3px' }}>ZWERYFIKOWANE</button>
                  <button onClick={() => handleAction(selectedMarker.id, 'DO SPRAWDZENIA')} style={{ flex: 1, padding: '8px', backgroundColor: '#ffb300', border: '1px solid #f39c12', color: '#ffffff', fontSize: '10px', fontWeight: '600', cursor: 'pointer', borderRadius: '3px' }}>SPRAWDŹ</button>
                  <button onClick={() => handleAction(selectedMarker.id, 'ODRZUCONE')} style={{ flex: 1, padding: '8px', backgroundColor: '#9e9e9e', border: '1px solid #757575', color: '#ffffff', fontSize: '10px', fontWeight: '600', cursor: 'pointer', borderRadius: '3px' }}>ODRZUĆ</button>
                </div>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999' }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>⌖</div>
              <div style={{ fontSize: '16px', fontWeight: '400', color: '#0f204b' }}>BRAK WYBORU</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}