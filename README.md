# 🎮 River Gaming

Welcome to **River Gaming** – a real-time quiz-based application where users can participate in livestreams and earn rewards by answering questions. Built for fast, interactive gameplay with WebSocket support and real-time admin control.

---

## 🚀 Features

- 🔴 **Live Streaming** interface for quiz sessions.
- 🧠 **Real-time quiz system** – answer questions during live sessions.
- 🪙 **Reward Mechanism** – earn coins for correct answers, lose for wrong ones.
- 👥 **Persistent user connections** with WebSockets.
- 👨‍💼 **Admin Panel** – create streams and push questions dynamically.
- 📈 **Live score tracking** and event sync across clients.
- 🔐 **User authentication** and secure session management.

---

## 🛠️ Tech Stack

- **Frontend:** React.js, Tailwind CSS
- **Backend:** Node.js, Express.js
- **WebSockets:** Socket.io
- **Database:** MongoDB
- **Authentication:** JWT

---

## 📦 Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/RushilReddy909/River-Gaming.git
cd river-gaming
```

### 2. Install Dependencies
```
# Backend
npm install

# Frontend
cd client
npm install
```

3. Configure Environment Variables
Create .env files in both root and client/ directories.
```bash
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

Now run both the frontend and backend to access the page
