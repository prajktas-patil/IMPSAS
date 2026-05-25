// ============================================================
// screens/RegisterScreen.jsx — Enhanced with Aadhaar + Family
// ============================================================

import { useState, useRef } from "react";
import { theme } from "../theme.js";
import { Card, Btn, Input } from "../components/UI.jsx";
import axios from "axios";

const API = process.env.REACT_APP_API_URL || "http://localhost:5001";

const emptyMember = () => ({ name: "", relation: "", phone: "", email: "", aadhaarLast4: "", telegramChatId: "" });

export default function RegisterScreen({ onNav }) {
  const [step, setStep]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const [caseId, setCaseId]   = useState("");
  const [images, setImages]   = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [aadhaarPreview, setAadhaarPreview] = useState(null);
  const fileInputRef  = useRef(null);
  const aadhaarRef    = useRef(null);

  const [form, setForm] = useState({
    name: "", age: "", gender: "Male",
    height: "", location: "", clothing: "", time: "",
    aadhaarNumber: "", alertLevel: "Medium",
  });

  const [familyMembers, setFamilyMembers] = useState([emptyMember()]);

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const updateMember = (idx, key, val) => {
    setFamilyMembers(prev => prev.map((m, i) => i === idx ? { ...m, [key]: val } : m));
  };
  const addMember = () => {
    if (familyMembers.length < 3) setFamilyMembers(prev => [...prev, emptyMember()]);
  };
  const removeMember = (idx) => {
    setFamilyMembers(prev => prev.filter((_, i) => i !== idx));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(prev => [...prev, ...files].slice(0, 5));
    const previews = files.map(file => ({
      name: file.name,
      url: URL.createObjectURL(file),
    }));
    setImages(prev => [...prev, ...previews].slice(0, 5));
  };

  const removeImage = (idx) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
    setImageFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAadhaarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAadhaarFile(file);
      setAadhaarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!form.name)     { alert("Please enter the missing person's name."); return; }
    if (!form.age)      { alert("Please enter the age."); return; }
    if (!form.location) { alert("Please enter the last known location."); return; }
    if (imageFiles.length < 1) { alert("Please upload at least 1 face image."); return; }

    // Validate at least one family member with phone
    const validMembers = familyMembers.filter(m => m.name && m.phone);
    if (validMembers.length === 0) {
      alert("Please add at least one family member with name and phone number for alerts.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name",          form.name);
      formData.append("age",           form.age);
      formData.append("gender",        form.gender);
      formData.append("height",        form.height);
      formData.append("location",      form.location);
      formData.append("clothing",      form.clothing);
      formData.append("time",          form.time);
      formData.append("aadhaarNumber", form.aadhaarNumber);
      formData.append("alertLevel",    form.alertLevel);
      formData.append("familyMembers", JSON.stringify(validMembers));

      imageFiles.forEach(file => formData.append("photos", file));
      if (aadhaarFile) formData.append("aadhaarPhoto", aadhaarFile);

      const res = await axios.post(`${API}/api/cases`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setLoading(false);
      setDone(true);
      setCaseId(res.data.caseId);

    } catch (err) {
      setLoading(false);
      alert("Failed to register case: " + (err.response?.data?.message || err.message));
    }
  };

  const alertLevelColor = { Low: theme.green, Medium: theme.yellow, High: theme.accent, Critical: "#FF0000" };

  if (done) return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh" }} className="fade-in">
      <div style={{ fontSize: 60, marginBottom: 16 }}>✅</div>
      <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>Case Registered!</div>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", color: theme.green, fontSize: 16, marginBottom: 8 }}>{caseId}</div>
      <div style={{ color: theme.muted, fontSize: 13, textAlign: "center", marginBottom: 8 }}>
        {imageFiles.length} image(s) uploaded. Alerts will be sent to {familyMembers.filter(m => m.name && m.phone).length} family contact(s).
      </div>
      <div style={{ color: theme.muted, fontSize: 12, textAlign: "center", marginBottom: 24 }}>
        Case is now Active and visible to all officers.
      </div>
      <Btn onClick={() => { setDone(false); setStep(1); setImages([]); setImageFiles([]); setFamilyMembers([emptyMember()]); onNav("cases"); }}>
        View All Cases
      </Btn>
    </div>
  );

  return (
    <div style={{ padding: "0 16px 100px" }}>
      <div style={{ padding: "20px 0 16px" }}>
        <div style={{ fontWeight: 700, fontSize: 20 }}>Register New Case</div>
        <div style={{ color: theme.muted, fontSize: 12 }}>Step {step} of 4</div>
      </div>

      {/* Progress Bar */}
      <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
        {[1, 2, 3, 4].map(s => (
          <div key={s} style={{
            flex: 1, height: 4, borderRadius: 2,
            background: s <= step ? theme.gradient : theme.border,
            transition: "background 0.3s",
          }} />
        ))}
      </div>

      {/* ── Step 1: Personal Details ── */}
      {step === 1 && (
        <div className="slide-up">
          <div style={{ fontWeight: 600, marginBottom: 16 }}>📋 Personal Details</div>
          <Input label="FULL NAME" value={form.name} onChange={e => update("name", e.target.value)} placeholder="Missing person's name" />
          <Input label="AGE" type="number" value={form.age} onChange={e => update("age", e.target.value)} placeholder="Approximate age" />
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: theme.muted, marginBottom: 6, fontWeight: 600, letterSpacing: 0.5 }}>GENDER</div>
            <div style={{ display: "flex", gap: 8 }}>
              {["Male", "Female", "Other"].map(g => (
                <button key={g} onClick={() => update("gender", g)} style={{
                  flex: 1, padding: "10px", borderRadius: 10,
                  border: `1px solid ${form.gender === g ? theme.blue : theme.border}`,
                  background: form.gender === g ? theme.blueSoft : "transparent",
                  color: form.gender === g ? theme.blue : theme.muted,
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                  fontFamily: "'Space Grotesk',sans-serif",
                }}>
                  {g}
                </button>
              ))}
            </div>
          </div>
          <Input label="HEIGHT (cm)" type="number" value={form.height} onChange={e => update("height", e.target.value)} placeholder="Optional" />

          {/* Aadhaar Number */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: theme.muted, marginBottom: 6, fontWeight: 600, letterSpacing: 0.5 }}>AADHAAR NUMBER (Optional)</div>
            <input
              type="text"
              value={form.aadhaarNumber}
              onChange={e => update("aadhaarNumber", e.target.value)}
              placeholder="XXXX XXXX XXXX (stored masked)"
              maxLength={14}
              style={{
                width: "100%", background: theme.surface,
                border: `1px solid ${theme.border}`, borderRadius: 12,
                padding: "12px 14px", color: theme.text, fontSize: 14,
                fontFamily: "'Space Grotesk',sans-serif", outline: "none",
              }}
            />
            <div style={{ fontSize: 11, color: theme.muted, marginTop: 4 }}>
              Only last 4 digits are stored for privacy. Used for identity verification.
            </div>
          </div>

          {/* Alert Level */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: theme.muted, marginBottom: 6, fontWeight: 600, letterSpacing: 0.5 }}>ALERT LEVEL</div>
            <div style={{ display: "flex", gap: 8 }}>
              {["Low", "Medium", "High", "Critical"].map(level => (
                <button key={level} onClick={() => update("alertLevel", level)} style={{
                  flex: 1, padding: "8px 4px", borderRadius: 10,
                  border: `1px solid ${form.alertLevel === level ? alertLevelColor[level] : theme.border}`,
                  background: form.alertLevel === level ? alertLevelColor[level] + "22" : "transparent",
                  color: form.alertLevel === level ? alertLevelColor[level] : theme.muted,
                  fontSize: 11, fontWeight: 600, cursor: "pointer",
                  fontFamily: "'Space Grotesk',sans-serif",
                }}>
                  {level}
                </button>
              ))}
            </div>
          </div>

          <Btn onClick={() => {
            if (!form.name || !form.age) { alert("Name and Age are required."); return; }
            setStep(2);
          }} style={{ width: "100%", marginTop: 8 }}>
            Next →
          </Btn>
        </div>
      )}

      {/* ── Step 2: Incident Details ── */}
      {step === 2 && (
        <div className="slide-up">
          <div style={{ fontWeight: 600, marginBottom: 16 }}>📍 Incident Details</div>
          <Input label="LAST KNOWN LOCATION" value={form.location} onChange={e => update("location", e.target.value)} placeholder="e.g. Shivaji Nagar, Pune" icon="📍" />
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: theme.muted, marginBottom: 6, fontWeight: 600, letterSpacing: 0.5 }}>TIME MISSING</div>
            <input
              type="datetime-local"
              value={form.time}
              onChange={e => update("time", e.target.value)}
              style={{
                width: "100%", background: theme.surface,
                border: `1px solid ${theme.border}`, borderRadius: 12,
                padding: "12px 14px", color: theme.text, fontSize: 14,
                fontFamily: "'Space Grotesk',sans-serif", outline: "none", colorScheme: "dark",
              }}
            />
          </div>
          <Input label="CLOTHING DESCRIPTION" value={form.clothing} onChange={e => update("clothing", e.target.value)} placeholder="e.g. Red shirt, blue jeans" icon="👕" />
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <Btn variant="ghost" onClick={() => setStep(1)} style={{ flex: 1 }}>← Back</Btn>
            <Btn onClick={() => { if (!form.location) { alert("Last known location is required."); return; } setStep(3); }} style={{ flex: 2 }}>
              Next →
            </Btn>
          </div>
        </div>
      )}

      {/* ── Step 3: Family Member Info ── */}
      {step === 3 && (
        <div className="slide-up">
          <div style={{ fontWeight: 600, marginBottom: 4 }}>👨‍👩‍👧 Family / Contact Info</div>
          <div style={{ fontSize: 12, color: theme.muted, marginBottom: 16 }}>
            Alerts will be sent to these contacts when a sighting is detected.
          </div>

          {familyMembers.map((member, idx) => (
            <Card key={idx} style={{ marginBottom: 12, borderLeft: `3px solid ${theme.blue}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: theme.blue }}>Contact #{idx + 1}</div>
                {familyMembers.length > 1 && (
                  <button onClick={() => removeMember(idx)} style={{ background: "none", border: "none", color: theme.accent, cursor: "pointer", fontSize: 16 }}>✕</button>
                )}
              </div>
              <input
                placeholder="Full Name *"
                value={member.name}
                onChange={e => updateMember(idx, "name", e.target.value)}
                style={{ width: "100%", background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 10, padding: "10px 12px", color: theme.text, fontSize: 13, fontFamily: "'Space Grotesk',sans-serif", outline: "none", marginBottom: 8 }}
              />
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <select
                  value={member.relation}
                  onChange={e => updateMember(idx, "relation", e.target.value)}
                  style={{ flex: 1, background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 10, padding: "10px 12px", color: member.relation ? theme.text : theme.muted, fontSize: 13, fontFamily: "'Space Grotesk',sans-serif", outline: "none" }}
                >
                  <option value="">Relation *</option>
                  {["Father","Mother","Spouse","Son","Daughter","Sibling","Guardian","Other"].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <input
                placeholder="Phone Number * (with country code, e.g. +91...)"
                value={member.phone}
                onChange={e => updateMember(idx, "phone", e.target.value)}
                type="tel"
                style={{ width: "100%", background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 10, padding: "10px 12px", color: theme.text, fontSize: 13, fontFamily: "'Space Grotesk',sans-serif", outline: "none", marginBottom: 8 }}
              />
              <input
                placeholder="Email Address (for email alerts)"
                value={member.email}
                onChange={e => updateMember(idx, "email", e.target.value)}
                type="email"
                style={{ width: "100%", background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 10, padding: "10px 12px", color: theme.text, fontSize: 13, fontFamily: "'Space Grotesk',sans-serif", outline: "none", marginBottom: 8 }}
              />
              <input
                placeholder="Aadhaar last 4 digits (optional, for ID verification)"
                value={member.aadhaarLast4}
                onChange={e => updateMember(idx, "aadhaarLast4", e.target.value.replace(/\D/g,"").slice(0, 4))}
                type="text"
                maxLength={4}
                style={{ width: "100%", background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 10, padding: "10px 12px", color: theme.text, fontSize: 13, fontFamily: "'Space Grotesk',sans-serif", outline: "none" }}
              />
              <input
                placeholder="Telegram Chat ID (optional — for instant Telegram alerts)"
                value={member.telegramChatId}
                onChange={e => updateMember(idx, "telegramChatId", e.target.value)}
                type="text"
                style={{ width: "100%", background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 10, padding: "10px 12px", color: theme.text, fontSize: 13, fontFamily: "'Space Grotesk',sans-serif", outline: "none", marginTop: 8 }}
              />
              <div style={{ fontSize: 10, color: theme.muted, marginTop: 4, paddingLeft: 4 }}>
                💬 To get Chat ID: message your IMPSAS bot on Telegram, then check t.me/userinfobot
              </div>
            </Card>
          ))}

          {familyMembers.length < 3 && (
            <button onClick={addMember} style={{
              width: "100%", padding: "10px", borderRadius: 10,
              border: `1px dashed ${theme.blue}`, background: "transparent",
              color: theme.blue, fontSize: 13, fontWeight: 600, cursor: "pointer",
              fontFamily: "'Space Grotesk',sans-serif", marginBottom: 16,
            }}>
              + Add Another Contact
            </button>
          )}

          <Card style={{ background: "#4D9FFF11", border: `1px solid ${theme.blue}33`, marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: theme.blue, fontWeight: 600, marginBottom: 4 }}>📧 Alert Notifications</div>
            <div style={{ fontSize: 11, color: theme.muted, lineHeight: 1.6 }}>
              Email and SMS alerts will automatically be sent to all contacts when a sighting is detected with 55%+ confidence.
            </div>
          </Card>

          <div style={{ display: "flex", gap: 10 }}>
            <Btn variant="ghost" onClick={() => setStep(2)} style={{ flex: 1 }}>← Back</Btn>
            <Btn onClick={() => {
              const valid = familyMembers.filter(m => m.name && m.phone);
              if (valid.length === 0) { alert("Please add at least one contact with name and phone."); return; }
              setStep(4);
            }} style={{ flex: 2 }}>Next →</Btn>
          </div>
        </div>
      )}

      {/* ── Step 4: Upload Images & Aadhaar ── */}
      {step === 4 && (
        <div className="slide-up">
          <div style={{ fontWeight: 600, marginBottom: 16 }}>📸 Upload Images</div>

          {/* Face Photos */}
          <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleFileChange} />
          <Card
            onClick={() => fileInputRef.current.click()}
            style={{
              border: `2px dashed ${imageFiles.length > 0 ? theme.green : theme.blue}`,
              textAlign: "center", padding: 24, marginBottom: 12, cursor: "pointer",
              background: imageFiles.length > 0 ? "#00E5A008" : theme.card,
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
            <div style={{ fontWeight: 600, marginBottom: 4, color: imageFiles.length > 0 ? theme.green : theme.text }}>
              {imageFiles.length > 0 ? `${imageFiles.length} photo(s) selected — click to add more` : "Upload Face Photos *"}
            </div>
            <div style={{ color: theme.muted, fontSize: 12 }}>
              {imageFiles.length > 0 ? `${5 - imageFiles.length} more allowed` : "3–5 clear face photos · Different angles"}
            </div>
          </Card>

          {images.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {images.map((img, i) => (
                  <div key={i} style={{ position: "relative", borderRadius: 10, overflow: "hidden", border: `1px solid ${theme.border}` }}>
                    <img src={img.url} alt={`face-${i}`} style={{ width: "100%", height: 80, objectFit: "cover", display: "block" }} />
                    <button onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                      style={{ position: "absolute", top: 4, right: 4, width: 18, height: 18, borderRadius: "50%", background: theme.accent, border: "none", color: "#fff", fontSize: 10, cursor: "pointer" }}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Aadhaar Photo */}
          <input ref={aadhaarRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAadhaarChange} />
          <Card
            onClick={() => aadhaarRef.current.click()}
            style={{
              border: `2px dashed ${aadhaarPreview ? theme.green : theme.yellow}`,
              textAlign: "center", padding: aadhaarPreview ? 12 : 20, marginBottom: 16, cursor: "pointer",
              background: aadhaarPreview ? "#00E5A008" : "#FFD16608",
            }}
          >
            {aadhaarPreview ? (
              <>
                <img src={aadhaarPreview} alt="aadhaar" style={{ width: "100%", maxHeight: 120, objectFit: "cover", borderRadius: 8, marginBottom: 8 }} />
                <div style={{ fontSize: 12, color: theme.green, fontWeight: 600 }}>✅ Aadhaar uploaded — click to change</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 28, marginBottom: 6 }}>🪪</div>
                <div style={{ fontWeight: 600, marginBottom: 4, color: theme.yellow }}>Upload Aadhaar Card (Optional)</div>
                <div style={{ color: theme.muted, fontSize: 12 }}>Scan/photo of Aadhaar for identity verification</div>
              </>
            )}
          </Card>

          <Card style={{ background: "#00E5A011", border: `1px solid ${theme.green}33`, marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: theme.green, fontWeight: 600, marginBottom: 4 }}>🔐 PRIVACY & SECURITY</div>
            <div style={{ fontSize: 11, color: theme.muted, lineHeight: 1.6 }}>
              Aadhaar numbers are stored masked (last 4 digits only). All data is encrypted and access-controlled. Photos are stored securely on our servers.
            </div>
          </Card>

          <div style={{ display: "flex", gap: 10 }}>
            <Btn variant="ghost" onClick={() => setStep(3)} style={{ flex: 1 }}>← Back</Btn>
            <Btn onClick={handleSubmit} style={{ flex: 2 }}>
              {loading
                ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <span className="spinner" style={{ display: "inline-block", width: 14, height: 14, border: "2px solid #fff", borderTop: "2px solid transparent", borderRadius: "50%" }} />
                    Registering case...
                  </span>
                : `Submit Case`}
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}
