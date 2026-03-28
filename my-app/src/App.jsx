import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// 1. Zaktualizowane dane dla 3 konkretnych kategorii
const MOCK_DATA = [
  {
    id: 'S-101743-A',
    name: 'Anomalia termiczna rozjazdu Rz-12',
    category: 'Wskaźnik temperaturowy', // Nowa kategoria (Czerwony)
    type: 'Termowizja',
    lat: 53.1352, lng: 17.9882,
    description: 'Analiza spektralna wykazała odchylenie temperatury o +24°C względem normy środowiskowej na iglicy rozjazdu. Ryzyko odkształcenia materiału pod wpływem naprężeń termicznych.',
    severity: 'Krytyczne',
    value: 92,
    images: ['https://images.unsplash.com/photo-1542491689-5ee4baea4c65?auto=format&fit=crop&q=80&w=600']
  },
  {
    id: 'S-101743-B',
    name: 'Osiadanie nasypu (Sekcja 4B)',
    category: 'Geometria gruntu', // Nowa kategoria (Fioletowy)
    type: 'Geodezja / InSAR',
    lat: 53.1412, lng: 17.9950,
    description: 'Pomiary satelitarne (Displacement) wykazują liniowy trend osiadania gruntu (-4.2 mm/rok). Parametr RMSE w normie.',
    severity: 'Ostrzeżenie',
    value: 68,
    images: ['https://images.unsplash.com/photo-1621864115017-f58c4cc88102?auto=format&fit=crop&q=80&w=600']
  },
  {
    id: 'S-101743-C',
    name: 'Niestabilność hydrologiczna torowiska',
    category: 'Wilgotność podłoża', // Nowa kategoria (Niebieski)
    type: 'Czujniki glebowe',
    lat: 53.1200, lng: 17.9600,
    description: 'Sensory wilgotności wskazują na lokalne podtopienie warstwy podtorza w wyniku intensywnych opadów. Prawdopodobieństwo zmniejszenia nośności.',
    severity: 'Krytyczne',
    value: 85,
    images: ['https://images.unsplash.com/photo-1574768393539-71cde628b030?auto=format&fit=crop&q=80&w=600']
  }
];

// WYMOGI: Tylko i wyłącznie te 3 kategorie
const CATEGORIES = ['Wskaźnik temperaturowy', 'Geometria gruntu', 'Wilgotność podłoża'];

const CATEGORY_COLORS = {
  'Wskaźnik temperaturowy': '#d32f2f', // Czerwony
  'Geometria gruntu': '#7b1fa2',       // Fioletowy
  'Wilgotność podłoża': '#1976d2'      // Niebieski
};

// Funkcja zwracająca kolor na podstawie % prawdopodobieństwa (rangi) w panelu
const getSeverityColor = (value) => {
  if (value >= 80) return '#d32f2f'; // Czerwony (Krytyczne)
  if (value >= 50) return '#f57c00'; // Pomarańczowy (Ostrzeżenie)
  return '#1976d2';                  // Niebieski (Monitorowane)
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
    <div style={{
      display: 'flex', height: '100vh', width: '100vw',
      fontFamily: '"Segoe UI", "Roboto", "Helvetica Neue", sans-serif',
      boxSizing: 'border-box'
    }}>

      {/* MAPA */}
      <div style={{ flex: 1, position: 'relative' }}>
        <MapContainer
          center={[53.1235, 18.0084]}
          zoom={13}
          style={{ height: '100%', width: '100%', outline: 'none', backgroundColor: '#e5e5e5' }}
          zoomControl={false}
        >
          <ZoomControl position="bottomright" />
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; OpenStreetMap'
          />
          <TileLayer
            url="https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png"
            attribution='&copy; OpenRailwayMap'
          />

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

        {/* NAKŁADKI: Typy Zagrożeń (Tylko 3 kategorie) */}
        <div style={{
          position: 'absolute', top: '20px', left: '20px', zIndex: 1000,
          backgroundColor: '#ffffff',
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          border: '1px solid #d0d0d0',
          width: '270px'
        }}>
          <div style={{
            backgroundColor: '#0f204b', color: '#ffffff',
            padding: '10px 15px', fontSize: '14px', fontWeight: '600', letterSpacing: '1px'
          }}>
            LAYERS: ZAGROŻENIA
          </div>
          <div style={{ padding: '15px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {CATEGORIES.map(category => {
                const isActive = activeFilters.includes(category);
                const color = CATEGORY_COLORS[category];
                return (
                  <label key={category} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '12px', color: '#333', fontWeight: '500' }} onClick={() => toggleFilter(category)}>
                    <div style={{
                      width: '40px', height: '14px', backgroundColor: '#e0e0e0',
                      borderRadius: '8px', position: 'relative', marginRight: '14px',
                      display: 'flex', alignItems: 'center',
                      border: '1px solid #ccc',
                      flexShrink: 0
                    }}>
                      <div style={{ width: '100%', height: '2px', backgroundColor: '#bdbdbd', position: 'absolute', zIndex: 1 }}></div>

                      <div style={{
                        width: '20px', height: '20px', backgroundColor: isActive ? color : '#757575',
                        borderRadius: '50%', position: 'absolute',
                        left: isActive ? '20px' : '-2px',
                        transition: 'left 0.25s cubic-bezier(0.4, 0.0, 0.2, 1), background-color 0.25s',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
                        zIndex: 2
                      }} />
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
        width: '420px',
        background: '#f4f7fb',
        display: 'flex', flexDirection: 'column',
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
              <div style={{
                backgroundColor: CATEGORY_COLORS[selectedMarker.category],
                color: '#ffffff', padding: '10px 15px', fontSize: '13px', fontWeight: '600',
                letterSpacing: '0.5px', marginBottom: '15px', borderRadius: '4px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                DETEKCJA: {selectedMarker.id}
              </div>

              <div style={{ backgroundColor: '#ffffff', padding: '15px', borderRadius: '6px', border: '1px solid #e0e0e0', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#666', fontWeight: '600' }}>KATEGORIA:</span>
                  <span style={{ fontSize: '12px', color: CATEGORY_COLORS[selectedMarker.category], fontWeight: '700' }}>
                    {selectedMarker.category.toUpperCase()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#666', fontWeight: '600' }}>ŹRÓDŁO DANYCH:</span>
                  <span style={{ fontSize: '12px', color: '#333' }}>{selectedMarker.type}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                  <span style={{ fontSize: '12px', color: '#666', fontWeight: '600' }}>RANG. ZAGROŻENIA:</span>
                  <span style={{ fontSize: '12px', color: getSeverityColor(selectedMarker.value), fontWeight: '700' }}>
                    {selectedMarker.value}% ({selectedMarker.severity})
                  </span>
                </div>

                <div style={{ fontSize: '16px', fontWeight: '600', color: '#0f204b', marginBottom: '10px', lineHeight: '1.3' }}>
                  {selectedMarker.name}
                </div>
                <div style={{ fontSize: '13px', color: '#555', lineHeight: '1.6', backgroundColor: '#f9fafc', padding: '12px', borderRadius: '4px' }}>
                  {selectedMarker.description}
                </div>
              </div>

              <div style={{ backgroundColor: '#ffffff', padding: '15px', borderRadius: '6px', border: '1px solid #e0e0e0', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: '11px', color: '#666', fontWeight: '600', marginBottom: '10px' }}>STATUS DYSPOZYTORA</div>

                {markerStatuses[selectedMarker.id] && (
                  <div style={{
                    marginBottom: '15px', padding: '8px 12px', fontSize: '12px', fontWeight: '600', borderRadius: '4px',
                    backgroundColor: markerStatuses[selectedMarker.id] === 'ZWERYFIKOWANE' ? '#e8f5e9' :
                                     markerStatuses[selectedMarker.id] === 'DO SPRAWDZENIA' ? '#fff3e0' : '#eeeeee',
                    color: markerStatuses[selectedMarker.id] === 'ZWERYFIKOWANE' ? '#2e7d32' :
                           markerStatuses[selectedMarker.id] === 'DO SPRAWDZENIA' ? '#e65100' : '#616161',
                    border: '1px solid',
                    borderColor: markerStatuses[selectedMarker.id] === 'ZWERYFIKOWANE' ? '#a5d6a7' :
                                 markerStatuses[selectedMarker.id] === 'DO SPRAWDZENIA' ? '#ffcc80' : '#bdbdbd'
                  }}>
                    STATUS: {markerStatuses[selectedMarker.id]}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleAction(selectedMarker.id, 'ZWERYFIKOWANE')} style={{ flex: 1, padding: '8px', backgroundColor: '#4caf50', border: '1px solid #388e3c', color: '#ffffff', fontSize: '10px', fontWeight: '600', cursor: 'pointer', borderRadius: '3px', transition: 'opacity 0.2s' }} onMouseOver={e => e.target.style.opacity = 0.9} onMouseOut={e => e.target.style.opacity = 1}>
                    ZWERYFIKOWANE
                  </button>
                  <button onClick={() => handleAction(selectedMarker.id, 'DO SPRAWDZENIA')} style={{ flex: 1, padding: '8px', backgroundColor: '#ffb300', border: '1px solid #f39c12', color: '#ffffff', fontSize: '10px', fontWeight: '600', cursor: 'pointer', borderRadius: '3px', transition: 'opacity 0.2s' }} onMouseOver={e => e.target.style.opacity = 0.9} onMouseOut={e => e.target.style.opacity = 1}>
                    SPRAWDŹ
                  </button>
                  <button onClick={() => handleAction(selectedMarker.id, 'ODRZUCONE')} style={{ flex: 1, padding: '8px', backgroundColor: '#9e9e9e', border: '1px solid #757575', color: '#ffffff', fontSize: '10px', fontWeight: '600', cursor: 'pointer', borderRadius: '3px', transition: 'opacity 0.2s' }} onMouseOver={e => e.target.style.opacity = 0.9} onMouseOut={e => e.target.style.opacity = 1}>
                    ODRZUĆ
                  </button>
                </div>
              </div>

              <div style={{ backgroundColor: '#ffffff', padding: '15px', borderRadius: '6px', border: '1px solid #e0e0e0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: '11px', color: '#666', fontWeight: '600', marginBottom: '12px' }}>DOWÓD OPTYCZNY</div>
                <div>
                  {selectedMarker.images.map((imgUrl, index) => (
                    <div key={index} style={{ marginBottom: '5px' }}>
                      <img
                        src={imgUrl} alt={`Dowód wizualny ${index}`}
                        style={{ width: '100%', height: 'auto', border: '1px solid #ccc', borderRadius: '4px' }}
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