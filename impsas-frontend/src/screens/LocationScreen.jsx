// ============================================================
// screens/LocationScreen.jsx — Enhanced with location history
//   & confidence score overlay
// ============================================================

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { theme } from "../theme.js";
import { Card, Btn } from "../components/UI.jsx";
import axios from "axios";

const API = process.env.REACT_APP_API_URL || "http://localhost:5001";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const redIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});
const greenIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});
const blueIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [20, 33], iconAnchor: [10, 33], popupAnchor: [1, -28],
});

const DEFAULT_CENTER = [18.5204, 73.8567]; // Pune

const geocodeLocation = async (locationText) => {
  try {
    const res  = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationText + ", India")}&format=json&limit=1`);
    const data = await res.json();
    if (data.length > 0) return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  } catch (e) {}
  return DEFAULT_CENTER;
};

const scoreColor = (s) => s >= 75 ? "#00E5A0" : s >= 55 ? "#FFD166" : "#FF4D6D";

export default function LocationScreen({ onNav }) {
  const [cases,      setCases]      = useState([]);
  const [selected,   setSelected]   = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [mapCenter,  setMapCenter]  = useState(DEFAULT_CENTER);
  const [sightingCoords, setSightingCoords] = useState([]);
  const [showTrail,  setShowTrail]  = useState(true);
  const [showLocationUpdate, setShowLocationUpdate] = useState(false);
  const [newLocation, setNewLocation] = useState("");
  const [updatingLocation, setUpdatingLocation] = useState(false);

  useEffect(() => {
    axios.get(`${API}/api/cases`)
      .then(async res => {
        setCases(res.data);
        const first = res.data.find(c => c.status === "Active") || res.data[0];
        if (first) {
          await selectCase(first, res.data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const selectCase = async (c, allCases) => {
    setSelected(c);
    setSightingCoords([]);
    if (c.location) {
      const coords = await geocodeLocation(c.location);
      setMapCenter(coords);
    }
    // Geocode sightings with lat/lng already
    const withCoords = (c.sightings || []).filter(s => s.lat && s.lng).map(s => [s.lat, s.lng]);
    setSightingCoords(withCoords);
  };

  const updateLocation = async () => {
    if (!newLocation.trim() || !selected) return;
    setUpdatingLocation(true);
    try {
      await axios.post(`${API}/api/cases/${selected._id}/location`, { location: newLocation });
      const res = await axios.get(`${API}/api/cases`);
      setCases(res.data);
      const updated = res.data.find(c => c._id === selected._id);
      if (updated) await selectCase(updated, res.data);
      setShowLocationUpdate(false);
      setNewLocation("");
    } catch (err) {
      alert("Failed to update location: " + err.message);
    }
    setUpdatingLocation(false);
  };

  const locationHistory = selected?.locationHistory || [];

  return (
    <div style={{ padding: "0 16px 100px" }}>
      <div style={{ padding: "20px 0 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 20 }}>Location Trail</div>
          <div style={{ color: theme.muted, fontSize: 12 }}>Real-time sighting map · OpenStreetMap</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setShowTrail(t => !t)} style={{
            background: showTrail ? theme.blueSoft : "transparent",
            border: `1px solid ${showTrail ? theme.blue : theme.border}`,
            color: showTrail ? theme.blue : theme.muted,
            borderRadius: 8, padding: "6px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer",
            fontFamily: "'Space Grotesk',sans-serif",
          }}>
            {showTrail ? "Trail ON" : "Trail OFF"}
          </button>
        </div>
      </div>

      {/* Case Selector */}
      {cases.length > 0 && (
        <div style={{ marginBottom: 16, overflowX: "auto", display: "flex", gap: 8, paddingBottom: 4 }}>
          {cases.map(c => (
            <button key={c._id} onClick={() => selectCase(c, cases)} style={{
              whiteSpace: "nowrap", padding: "8px 14px", borderRadius: 20,
              border: `1px solid ${selected?._id === c._id ? theme.accent : theme.border}`,
              background: selected?._id === c._id ? theme.accentSoft : "transparent",
              color: selected?._id === c._id ? theme.accent : theme.muted,
              fontSize: 12, fontWeight: 600, cursor: "pointer",
              fontFamily: "'Space Grotesk',sans-serif",
            }}>
              {c.name}
              {c.confidenceScore && (
                <span style={{ marginLeft: 6, color: scoreColor(c.confidenceScore), fontSize: 11 }}>
                  {c.confidenceScore}%
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Map */}
      <Card style={{ padding: 0, overflow: "hidden", marginBottom: 16 }}>
        {loading ? (
          <div style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center", color: theme.muted }}>
            Loading map...
          </div>
        ) : (
          <MapContainer
            center={mapCenter}
            zoom={13}
            style={{ height: 300, width: "100%" }}
            key={`${selected?._id}-${mapCenter[0]}-${mapCenter[1]}`}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* Last known location */}
            {selected && (
              <>
                <Marker position={mapCenter} icon={redIcon}>
                  <Popup>
                    <b>📍 Last Known Location</b><br />
                    {selected.location}<br />
                    <span style={{ color: "red" }}>Missing: {selected.name}</span>
                    {selected.confidenceScore && (
                      <><br /><span style={{ color: scoreColor(selected.confidenceScore) }}>
                        Confidence: {selected.confidenceScore}%
                      </span></>
                    )}
                  </Popup>
                </Marker>
                <Circle
                  center={mapCenter}
                  radius={3000}
                  pathOptions={{ color: "#FF4D6D", fillColor: "#FF4D6D", fillOpacity: 0.06 }}
                />
              </>
            )}
            {/* Sightings */}
            {selected?.sightings?.map((s, i) =>
              s.lat && s.lng ? (
                <Marker key={i} position={[s.lat, s.lng]} icon={greenIcon}>
                  <Popup>
                    <b>👁️ Sighting #{i + 1}</b><br />
                    {s.location}<br />
                    Match: <span style={{ color: scoreColor(s.matchScore), fontWeight: "bold" }}>{s.matchScore}%</span><br />
                    {new Date(s.reportedAt).toLocaleString()}
                  </Popup>
                </Marker>
              ) : null
            )}
            {/* Location history markers */}
            {showTrail && locationHistory.filter(l => l.lat && l.lng).map((l, i) => (
              <Marker key={`hist-${i}`} position={[l.lat, l.lng]} icon={blueIcon}>
                <Popup>
                  <b>📍 Location #{i + 1}</b><br />
                  {l.location}<br />
                  {new Date(l.recordedAt).toLocaleString()}<br />
                  Source: {l.source}
                </Popup>
              </Marker>
            ))}
            {/* Trail line */}
            {showTrail && sightingCoords.length > 1 && (
              <Polyline positions={sightingCoords} pathOptions={{ color: "#4D9FFF", weight: 2, dashArray: "5,5" }} />
            )}
          </MapContainer>
        )}
      </Card>

      {/* Case Info */}
      {selected && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontWeight: 600 }}>📋 {selected.name}</div>
            <Btn small variant="secondary" onClick={() => setShowLocationUpdate(v => !v)}>
              📍 Update Location
            </Btn>
          </div>

          {/* Confidence Score */}
          {selected.confidenceScore != null && (
            <div style={{ marginBottom: 12, background: theme.surface, borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: theme.muted, fontWeight: 600 }}>CONFIDENCE SCORE</span>
                <span style={{ fontWeight: 700, fontSize: 20, color: scoreColor(selected.confidenceScore), fontFamily: "'JetBrains Mono',monospace" }}>
                  {selected.confidenceScore}%
                </span>
              </div>
              <div style={{ width: "100%", background: theme.border, borderRadius: 4, height: 6 }}>
                <div style={{
                  width: `${selected.confidenceScore}%`,
                  background: scoreColor(selected.confidenceScore),
                  height: "100%", borderRadius: 4, transition: "width 1s",
                }} />
              </div>
              <div style={{ fontSize: 11, color: theme.muted, marginTop: 4 }}>
                {selected.confidenceScore >= 75 ? "High confidence — strong match" :
                 selected.confidenceScore >= 55 ? "Possible match — verify manually" :
                 "Low confidence — needs confirmation"}
              </div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { label: "Status",       value: selected.status },
              { label: "Age",          value: `${selected.age} yrs` },
              { label: "Location",     value: selected.location },
              { label: "Sightings",    value: selected.sightings?.length || 0 },
              { label: "Alert Level",  value: selected.alertLevel || "Medium" },
              { label: "Family Contacts", value: selected.familyMembers?.length || 0 },
            ].map((item, i) => (
              <div key={i} style={{ background: theme.surface, borderRadius: 8, padding: "8px 10px" }}>
                <div style={{ fontSize: 10, color: theme.muted }}>{item.label}</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* Update Location Input */}
          {showLocationUpdate && (
            <div style={{ marginTop: 12 }}>
              <input
                value={newLocation}
                onChange={e => setNewLocation(e.target.value)}
                placeholder="New location (e.g. FC Road, Pune)"
                style={{
                  width: "100%", background: theme.surface,
                  border: `1px solid ${theme.border}`, borderRadius: 10,
                  padding: "10px 12px", color: theme.text, fontSize: 13,
                  fontFamily: "'Space Grotesk',sans-serif", outline: "none", marginBottom: 8,
                }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <Btn variant="ghost" small style={{ flex: 1 }} onClick={() => setShowLocationUpdate(false)}>Cancel</Btn>
                <Btn small style={{ flex: 2 }} onClick={updateLocation}>
                  {updatingLocation ? "Updating..." : "Update Location"}
                </Btn>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Sightings List */}
      {selected?.sightings?.length > 0 ? (
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>
            👁️ Sighting Reports ({selected.sightings.length})
          </div>
          {[...selected.sightings].reverse().map((s, i) => (
            <Card key={i} style={{ marginBottom: 10, borderLeft: `3px solid ${scoreColor(s.matchScore || 0)}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600 }}>Sighting #{selected.sightings.length - i}</div>
                  <div style={{ fontSize: 12, color: theme.muted }}>📍 {s.location || "Unknown location"}</div>
                  <div style={{ fontSize: 11, color: theme.muted }}>{new Date(s.reportedAt).toLocaleString()}</div>
                  <div style={{ fontSize: 10, color: theme.muted }}>Source: {s.source || "manual"}</div>
                </div>
                <div style={{ background: scoreColor(s.matchScore || 0) + "22", color: scoreColor(s.matchScore || 0), padding: "4px 10px", borderRadius: 12, fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", textAlign: "center" }}>
                  <div>{s.matchScore || 0}%</div>
                  <div style={{ fontSize: 9 }}>{s.matchScore >= 75 ? "HIGH" : s.matchScore >= 55 ? "MED" : "LOW"}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card style={{ textAlign: "center", padding: 24 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📍</div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>No Sightings Yet</div>
          <div style={{ color: theme.muted, fontSize: 12 }}>
            Sightings appear here when someone reports spotting this person.
          </div>
        </Card>
      )}
    </div>
  );
}
