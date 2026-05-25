// ============================================================
// theme.js — Global design tokens & CSS animations
// ============================================================

export const theme = {
  bg: "#0A0C14",
  surface: "#12151F",
  card: "#1A1E2E",
  border: "#252A3D",
  accent: "#FF4D6D",
  accentSoft: "#FF4D6D22",
  blue: "#4D9FFF",
  blueSoft: "#4D9FFF22",
  green: "#00E5A0",
  greenSoft: "#00E5A022",
  yellow: "#FFD166",
  yellowSoft: "#FFD16622",
  text: "#F0F2FF",
  muted: "#6B7299",
  gradient: "linear-gradient(135deg, #FF4D6D, #FF8C42)",
};

export const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
  body { background:${theme.bg}; font-family:'Space Grotesk',sans-serif; color:${theme.text}; }
  ::-webkit-scrollbar { width:0; }
  @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:.4;} }
  @keyframes slideUp { from{transform:translateY(20px);opacity:0;} to{transform:translateY(0);opacity:1;} }
  @keyframes fadeIn { from{opacity:0;} to{opacity:1;} }
  @keyframes spin { from{transform:rotate(0deg);} to{transform:rotate(360deg);} }
  @keyframes scanLine { 0%{top:0%;} 100%{top:100%;} }
  @keyframes ping { 0%{transform:scale(1);opacity:.8;} 100%{transform:scale(2.5);opacity:0;} }
  .slide-up { animation: slideUp 0.4s ease forwards; }
  .fade-in { animation: fadeIn 0.3s ease forwards; }
  .spinner { animation: spin 1s linear infinite; }
  .ping { animation: ping 1.5s ease-out infinite; }
`;
