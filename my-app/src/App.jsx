import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// IMPORTY ZDJĘĆ
import railwaysData from './assets/railway-map.json';
import imgGrunt from './assets/grunt.png';
import imgGruntWykres from './assets/grunt-wykres.png';
import imgWilgotnosc from './assets/wilgotnosc_NDVI.png';
// import imgWilgotnoscICEYE from './assets/wilgotnosc_ICEYE.png';
import imgHeat from './assets/heat.png';
import imgHeatDamage from './assets/heat-damage.png';

// ==========================================
// STYLE CSS DLA PULSUJĄCYCH PUNKTÓW
// ==========================================
const pulseAnimation = `
@keyframes pulseRing {
  0% { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(0,0,0, 0.7); }
  70% { transform: scale(1.1); box-shadow: 0 0 0 15px rgba(0,0,0, 0); }
  100% { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(0,0,0, 0); }
}
`;

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = pulseAnimation;
  document.head.appendChild(style);
}

// ==========================================
// DANE I USTAWIENIA
// ==========================================
const MOCK_DATA = [
  {
    id: '0',
    name: 'Osiadanie nasypu',
    category: 'Geometria gruntu',
    type: 'Geodezja / InSAR',
    lat: 53.146411, lng: 18.008221,
    severity: 'Krytyczne',
    value: 91,
    images: [imgGrunt, imgGruntWykres],
    imgDescriptions: ['Radarowa mapa prędkości przemieszczeń', 'Wykres osiadania w najbardziej krytycznym punkcie']
  },
  {
    id: '1',
    name: 'Nadmierna wilgotność podłoża',
    category: 'Wilgotność podłoża',
    type: 'Intuition-1 / ICEYE',
    lat: 53.134195, lng: 17.962035,
    severity: 'Potencjalne',
    value: 41,
    images: [imgWilgotnosc],
    imgDescriptions: ['Mapa wskaźnikowa NWDI', 'Radarowe mapy zmian']
  },
  {
    id: '2',
    name: 'Nagrzewanie szyn kolejowych',
    category: 'Wskaźnik temperaturowy',
    type: 'Albedo',
    lat: 53.165365, lng: 18.004296,
    severity: 'Niebezpieczne',
    value: 87,
    images: [imgHeat, imgHeatDamage],
    imgDescriptions: ['Histogram izotermiczny - punkty przekraczające temperaturę 55°C', 'Przewidywany obraz uszkodzeń torów']
  }
];

const CATEGORIES = ['Wskaźnik temperaturowy', 'Geometria gruntu', 'Wilgotność podłoża'];

const CATEGORY_COLORS = {
  'Wskaźnik temperaturowy': '#d32f2f',
  'Geometria gruntu': '#7b1fa2',
  'Wilgotność podłoża': '#1976d2'
};

const BYDGOSZCZ_BOUNDS = [
  [53.05, 17.85], // South-West corner
  [53.20, 18.15]  // North-East corner
];

const getSeverityColor = (value) => {
  if (value >= 80) return '#d32f2f'; // Czerwony - Krytyczne
  if (value >= 50) return '#f57c00'; // Pomarańczowy - Ostrzeżenie
  return '#1976d2';                  // Niebieski - Potencjalne
};

// Tworzy pulsujący "Radar" - zawsze z czerwonym obłokiem
const createIcon = (category) => {
  const innerColor = CATEGORY_COLORS[category] || '#000000';

  // Zawsze używamy stałego, czerwonego koloru dla fali radaru (rgba odpowiednik #d32f2f z przezroczystością)
  const pulseColor = `rgba(211, 47, 47, 0.7)`;

  return L.divIcon({
    className: 'custom-icon',
    html: `
      <div style="position: relative; width: 24px; height: 24px;">
        <div style="
          position: absolute; top: 0; left: 0; right: 0; bottom: 0;
          border-radius: 50%;
          animation: pulseRing 2s infinite cubic-bezier(0.66, 0, 0, 1);
          box-shadow: 0 0 0 0 ${pulseColor};
          background-color: ${pulseColor};
          opacity: 0.6;
        "></div>
        <div style="
          position: absolute; top: 5px; left: 5px; right: 5px; bottom: 5px;
          background-color: ${innerColor};
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 0 4px rgba(0,0,0,0.5);
          z-index: 10;
        "></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
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
          center={[53.155, 18.006]}
          zoom={14}
          style={{ height: '100%', width: '100%', outline: 'none', backgroundColor: '#e5e5e5' }}
          zoomControl={false}
          maxBounds={BYDGOSZCZ_BOUNDS}
          maxBoundsViscosity={0.8}
          minZoom={12}
        >
          <ZoomControl position="bottomright" />

          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; OpenStreetMap'
          />

          {railwaysData && railwaysData.features && (
            <GeoJSON
              data={railwaysData}
              style={{ color: '#374151', weight: 2, opacity: 0.7 }}
            />
          )}

          {filteredData.map(item => (
            <Marker
              key={item.id}
              position={[item.lat, item.lng]}
              icon={createIcon(item.category)}
              eventHandlers={{ click: () => setSelectedMarker(item) }}
            >
              <Popup className="tech-popup">
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
            WARSTWY: ZAGROŻENIA
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

      {/* PRAWY PANEL */}
      <div style={{
        width: '420px', background: '#f4f7fb', display: 'flex', flexDirection: 'column',
        borderLeft: '1px solid #d0d0d0', boxShadow: '-2px 0 10px rgba(0,0,0,0.05)', zIndex: 1001
      }}>
        <div style={{ backgroundColor: '#ffffff', padding: '15px', borderBottom: '1px solid #d0d0d0' }}>
          <div style={{ fontSize: '18px', fontWeight: '400', color: '#0f204b', display: 'flex', alignItems: 'center' }}>
            <span style={{ fontWeight: '600', marginRight: '8px' }}>ZLECENIE</span> INSPEKCJI
          </div>
        </div>

        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {selectedMarker ? (
            <>
              {/* NAGŁÓWEK DETEKCJI - usunięto ID */}
              <div style={{ backgroundColor: CATEGORY_COLORS[selectedMarker.category], color: '#ffffff', padding: '10px 15px', fontSize: '13px', fontWeight: '600', letterSpacing: '0.5px', marginBottom: '15px', borderRadius: '4px' }}>
                {selectedMarker.name}
              </div>

              {/* OPIS KARTY */}
              <div style={{ backgroundColor: '#ffffff', padding: '15px', borderRadius: '6px', border: '1px solid #e0e0e0', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#666', fontWeight: '600' }}>KATEGORIA:</span>
                  <span style={{ fontSize: '12px', color: CATEGORY_COLORS[selectedMarker.category], fontWeight: '700' }}>{selectedMarker.category.toUpperCase()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#666', fontWeight: '600' }}>ŹRÓDŁO DANYCH:</span>
                  <span style={{ fontSize: '12px', color: '#333' }}>{selectedMarker.type}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px'}}>
                  <span style={{ fontSize: '12px', color: '#666', fontWeight: '600' }}>RANGA ZAGROŻENIA:</span>
                  <span style={{ fontSize: '12px', color: getSeverityColor(selectedMarker.value), fontWeight: '700' }}>{selectedMarker.value}% ({selectedMarker.severity})</span>
                </div>
              </div>

              {/* SEKCJA PRZYCISKÓW AKCJI I STATUSU */}
              <div style={{ backgroundColor: '#ffffff', padding: '15px', borderRadius: '6px', border: '1px solid #e0e0e0', marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', color: '#666', fontWeight: '600', marginBottom: '10px' }}>STATUS DYSPOZYTORA</div>

                {/* KOLOROWY BANER Z AKTUALNYM STATUSEM */}
                {markerStatuses[selectedMarker.id] && (
                  <div style={{
                    marginBottom: '15px', padding: '8px 12px', fontSize: '12px', fontWeight: '700', borderRadius: '4px', textAlign: 'center',
                    backgroundColor: markerStatuses[selectedMarker.id] === 'ZWERYFIKOWANE' ? '#4caf50' :
                                     markerStatuses[selectedMarker.id] === 'DO SPRAWDZENIA' ? '#ffb300' : '#9e9e9e',
                    color: '#ffffff',
                    border: '1px solid',
                    borderColor: markerStatuses[selectedMarker.id] === 'ZWERYFIKOWANE' ? '#388e3c' :
                                 markerStatuses[selectedMarker.id] === 'DO SPRAWDZENIA' ? '#f39c12' : '#757575'
                  }}>
                    STATUS: {markerStatuses[selectedMarker.id]}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleAction(selectedMarker.id, 'ZWERYFIKOWANE')}
                    style={{ flex: 1, padding: '8px', backgroundColor: '#4caf50', border: '1px solid #388e3c', color: '#ffffff', fontSize: '10px', fontWeight: '600', cursor: 'pointer', borderRadius: '3px', transition: 'opacity 0.2s' }}
                    onMouseOver={e => e.target.style.opacity = 0.9} onMouseOut={e => e.target.style.opacity = 1}
                  >
                    ZWERYFIKOWANE
                  </button>
                  <button
                    onClick={() => handleAction(selectedMarker.id, 'DO SPRAWDZENIA')}
                    style={{ flex: 1, padding: '8px', backgroundColor: '#ffb300', border: '1px solid #f39c12', color: '#ffffff', fontSize: '10px', fontWeight: '600', cursor: 'pointer', borderRadius: '3px', transition: 'opacity 0.2s' }}
                    onMouseOver={e => e.target.style.opacity = 0.9} onMouseOut={e => e.target.style.opacity = 1}
                  >
                    SPRAWDŹ
                  </button>
                  <button
                    onClick={() => handleAction(selectedMarker.id, 'ODRZUCONE')}
                    style={{ flex: 1, padding: '8px', backgroundColor: '#9e9e9e', border: '1px solid #757575', color: '#ffffff', fontSize: '10px', fontWeight: '600', cursor: 'pointer', borderRadius: '3px', transition: 'opacity 0.2s' }}
                    onMouseOver={e => e.target.style.opacity = 0.9} onMouseOut={e => e.target.style.opacity = 1}
                  >
                    ODRZUĆ
                  </button>
                </div>
              </div>

              {/* DOWÓD OPTYCZNY */}
              <div style={{ backgroundColor: '#ffffff', padding: '15px', borderRadius: '6px', border: '1px solid #e0e0e0' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedMarker.images.map((imgUrl, index) => (
                    <div>
                    <div style={{ fontSize: '11px', color: '#666', fontWeight: '600', marginBottom: '12px' }}>{selectedMarker.imgDescriptions[index]}</div>
                    <img
                      key={index}
                      src={imgUrl}
                      alt={`Dowód wizualny ${index + 1}`}
                      style={{ width: '100%', height: 'auto', border: '1px solid #ccc', borderRadius: '4px', objectFit: 'contain' }}
                    />
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999' }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>⌖</div>
              <div style={{ fontSize: '16px', fontWeight: '400', color: '#0f204b' }}>BRAK WYBORU</div>
              <div style={{ fontSize: '12px', marginTop: '10px' }}>Kliknij wskaźnik na mapie, aby otworzyć inspekcję</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}