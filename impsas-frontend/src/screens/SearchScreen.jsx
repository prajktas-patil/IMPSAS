import { useState, useRef } from "react";
import { theme } from "../theme.js";
import { Card, Btn } from "../components/UI.jsx";
import axios from "axios";

const API = process.env.REACT_APP_API_URL || "http://localhost:5001";
const PYTHON_URL = process.env.REACT_APP_PYTHON_URL || "http://localhost:5002";

export default function SearchScreen({ onNav }) {
  const [image, setImage]       = useState(null);  // preview
  const [imageFile, setImageFile] = useState(null); // actual file
  const [loading, setLoading]   = useState(false);
  const [results, setResults]   = useState(null);
  const [error, setError]       = useState(null);
  const fileInputRef            = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImage(URL.createObjectURL(file));
    setResults(null);
    setError(null);
  };

  const handleSearch = async () => {
    if (!imageFile) { alert("Please upload a photo first."); return; }
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      // Step 1 — Get all active cases from Node.js backend
      const casesRes = await axios.get(`${API}/api/cases`);
      const cases = casesRes.data.filter(c => c.photos && c.photos.length > 0);

      if (cases.length === 0) {
        setError("No registered cases with photos found.");
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("photo", imageFile);
      formData.append("cases", JSON.stringify(cases));

      let matchRes;

      // Step 2 — Try Python AI service first, fall back to Node.js if unavailable
      try {
        matchRes = await axios.post(`${PYTHON_URL}/match`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
         timeout: 120000,
        });
      } catch (pyErr) {
        // Python service unavailable — use Node.js fallback endpoint
        console.warn("Python AI service unavailable, using fallback:", pyErr.message);
        matchRes = await axios.post(`${API}/api/match`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 20000,
        });
      }

      setResults(matchRes.data);
      setLoading(false);

    } catch (err) {
      setLoading(false);
      setError("Search failed: " + (err.response?.data?.error || err.message));
    }
  };

  const getScoreColor = (score) => {
    if (score >= 75) return theme.green;
    if (score >= 55) return theme.yellow;
    return theme.accent;
  };

  const getScoreLabel = (score) => {
    if (score >= 75) return "HIGH MATCH";
    if (score >= 55) return "POSSIBLE MATCH";
    return "LOW MATCH";
  };

  return (
    <div style={{ padding: "0 16px 100px" }}>
      {/* Header */}
      <div style={{ padding: "20px 0 16px" }}>
        <div style={{ fontWeight: 700, fontSize: 20 }}>Face Search</div>
        <div style={{ color: theme.muted, fontSize: 12 }}>
          Upload a photo to find matching missing persons
        </div>
      </div>

      {/* Upload Area */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      <Card
        onClick={() => fileInputRef.current.click()}
        style={{
          border: `2px dashed ${image ? theme.green : theme.blue}`,
          textAlign: "center",
          padding: image ? 12 : 32,
          marginBottom: 16,
          cursor: "pointer",
          background: image ? "#00E5A008" : theme.card,
          transition: "all 0.3s",
        }}
      >
        {image ? (
          <div>
            <img
              src={image}
              alt="uploaded"
              style={{
                width: "100%", maxHeight: 220,
                objectFit: "cover", borderRadius: 12,
                marginBottom: 8,
              }}
            />
            <div style={{ fontSize: 12, color: theme.green, fontWeight: 600 }}>
              ✅ Photo ready — click to change
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
              Upload Sighting Photo
            </div>
            <div style={{ color: theme.muted, fontSize: 12 }}>
              Take or upload a photo of the person you spotted
            </div>
          </>
        )}
      </Card>

      {/* Search Button */}
      <Btn
        onClick={handleSearch}
        style={{ width: "100%", marginBottom: 20 }}
      >
        {loading
          ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <span className="spinner" style={{ display: "inline-block", width: 14, height: 14, border: "2px solid #fff", borderTop: "2px solid transparent", borderRadius: "50%" }} />
              ⏳ AI Scanning... (first run may take 2 min)
            </span>
          : "🤖 Search with AI"
        }
      </Btn>

      {/* Error */}
      {error && (
        <Card style={{ background: "#FF4D6D11", border: `1px solid ${theme.accent}44`, marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: theme.accent }}>❌ {error}</div>
        </Card>
      )}

      {/* Results */}
      {results && (
        <div className="fade-in">
          {results.fallbackMode && (
            <Card style={{ background: "#FFA50011", border: "1px solid #FFA50044", marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: "#FFA500" }}>
                ⚠️ AI face-matching service is offline. Showing registered cases — scores are approximate.
              </div>
            </Card>
          )}
          <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>
            {results.total > 0
              ? `🎯 Found ${results.total} potential match(es)`
              : "❌ No matches found"}
          </div>

          {results.total === 0 && (
            <Card style={{ textAlign: "center", padding: 24 }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🤷</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>No Match Found</div>
              <div style={{ color: theme.muted, fontSize: 12 }}>
                This person doesn't match any active missing cases.
              </div>
            </Card>
          )}

          {results.matches.map((match, i) => (
            <Card key={i} style={{ marginBottom: 12 }}>
              {/* Match Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{match.name}</div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: theme.muted }}>
                    {match.caseId}
                  </div>
                </div>
                <div style={{
                  background: getScoreColor(match.confidenceScore) + "22",
                  color: getScoreColor(match.confidenceScore),
                  padding: "4px 10px", borderRadius: 20,
                  fontSize: 11, fontWeight: 700,
                }}>
                  {getScoreLabel(match.confidenceScore)}
                </div>
              </div>

              {/* Confidence Score */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: theme.muted }}>Confidence Score</span>
                  <span style={{
                    fontWeight: 700, fontSize: 18,
                    color: getScoreColor(match.confidenceScore),
                    fontFamily: "'JetBrains Mono',monospace",
                  }}>
                    {match.confidenceScore}%
                  </span>
                </div>
                {/* Progress bar */}
                <div style={{ width: "100%", background: theme.border, borderRadius: 4, height: 8 }}>
                  <div style={{
                    width: `${match.confidenceScore}%`,
                    background: getScoreColor(match.confidenceScore),
                    height: "100%", borderRadius: 4,
                    transition: "width 1s ease",
                  }} />
                </div>
              </div>

              {/* Case Details */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                {[
                  { label: "Age", value: `${match.age} yrs` },
                  { label: "Location", value: match.location },
                ].map((item, j) => (
                  <div key={j} style={{ background: theme.surface, borderRadius: 8, padding: "8px 10px" }}>
                    <div style={{ fontSize: 10, color: theme.muted }}>{item.label}</div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {/* Reference Photos */}
              {match.photos && match.photos.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: theme.muted, marginBottom: 6 }}>REFERENCE PHOTOS</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {match.photos.slice(0, 3).map((photo, k) => (
                      <img
                        key={k}
                        src={`${API}/uploads/${photo}`}
                        alt={`ref-${k}`}
                        style={{ width: 60, height: 60, borderRadius: 8, objectFit: "cover", border: `1px solid ${theme.border}` }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: 8 }}>
                <Btn
                  variant="success"
                  small
                  style={{ flex: 1 }}
                  onClick={() => alert(`Reporting match for ${match.name}. Feature coming soon!`)}
                >
                  ✅ Report Match
                </Btn>
                <Btn
                  variant="ghost"
                  small
                  style={{ flex: 1 }}
                  onClick={() => onNav("cases")}
                >
                  View Case
                </Btn>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}