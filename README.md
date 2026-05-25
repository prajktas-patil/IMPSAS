<div align="center">

<img src="https://img.shields.io/badge/IMPSAS-v2.0.0-FF4D6D?style=for-the-badge&logo=shield&logoColor=white" />

# 🔍 IMPSAS
### Intelligent Missing Person Search & Alert System

*A full-stack real-time platform for reporting, tracking, and matching missing persons using AI-powered face recognition.*

[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.7-010101?style=flat-square&logo=socket.io&logoColor=white)](https://socket.io/)
[![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

</div>

---

## 📌 Overview

**IMPSAS** (Intelligent Missing Person Search & Alert System) is a production-grade web application designed to assist law enforcement agencies, NGOs, and the public in reporting and locating missing individuals. The system leverages AI-based facial recognition, real-time WebSocket alerts, interactive maps, and a multi-channel notification pipeline to accelerate the search process.

> Built with a security-first mindset — JWT authentication, role-based access control, bcrypt password hashing, rate limiting, and an immutable audit trail are baked into the architecture.

---

## ✨ Features

### 🧠 AI Face Matching
- DeepFace-powered facial recognition using the **Facenet** model
- Confidence scoring with percentage output per case
- Graceful fallback when AI is unavailable

### 📡 Real-Time Alerts
- Live WebSocket events via **Socket.io**
- Multi-channel notifications: **Email**, **Telegram Bot**
- Emergency alert escalation for matches above 75% confidence

### 🗺️ Location Intelligence
- Interactive map with **Leaflet.js** and OpenStreetMap
- Full sighting history and location trail per case

### 🔐 Security
| Feature | Detail |
|---|---|
| Authentication | JWT 8-hour tokens |
| Password Security | bcrypt 12 salt rounds |
| Role-Based Access | Admin · Officer · Public |
| Rate Limiting | Login 5/15min · API 100/min |
| Audit Trail | Immutable AuditLog collection |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, React-Leaflet, Socket.io Client, Axios |
| **Backend** | Node.js, Express.js, Socket.io |
| **AI Service** | Python, Flask, DeepFace (Facenet) |
| **Database** | MongoDB Atlas (Mongoose ODM) |
| **Auth** | JSON Web Tokens, bcrypt |
| **Notifications** | Nodemailer, Telegram Bot API |

---

## ⚙️ Installation

### 1. Clone
```bash
git clone https://github.com/prajktas-patil/IMPSAS.git
cd IMPSAS
```

### 2. Backend
```bash
npm install
node seed.js
npm start
```

### 3. Python AI Service
```bash
pip install flask flask-cors deepface
python match.py
```

### 4. Frontend
```bash
cd impsas-frontend
npm install
npm start
```

---

## 👤 Default Login Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@impsas.local | Admin@1234 |
| Officer | officer@impsas.local | Officer@1234 |

---

## 🔮 Future Improvements

- [ ] Mobile App (React Native)
- [ ] Docker Compose for one-command deployment
- [ ] Two-Factor Authentication for staff accounts
- [ ] WhatsApp Alerts via Twilio
- [ ] GIS Heatmaps for sighting clusters

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 👤 Author

**Prajkta Patil**
- GitHub: [@prajktas-patil](https://github.com/prajktas-patil)

---

<div align="center">
If this project helped you, consider giving it a ⭐
</div>
