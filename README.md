<<<<<<< HEAD
# 🇳🇬 Election Result Collation Monitoring & Audit System

A secure, transparent, and real-time election result collation platform designed to monitor, verify, and audit election data across all levels — from Polling Units to National Collation.

---

## 📌 Project Overview

The **Election Result Collation Monitoring & Audit System (ERCMAS)** is built to improve the credibility and transparency of election processes by enabling structured reporting, validation, and auditing of results.

This system supports multi-level collation:

* Polling Unit (PU)
* Ward Level
* Local Government Level
* State Level
* National Level

It also includes an **audit and flagging system** to detect irregularities and ensure accountability.

---

## 🚀 Features

### 🗳️ Result Submission

* Submit results from polling units
* Upload result sheet images as evidence
* Automatic timestamping
* Geo-location tagging (optional)

### 📊 Multi-Level Collation

* Aggregation of results from:

  * Polling Units → Wards → LGAs → States → National
* Real-time updates and summaries

### 🔍 Audit & Monitoring

* Flag suspicious entries
* Track inconsistencies
* Maintain audit logs of all activities

### 👥 Role-Based Access

* Polling Unit Agents
* Ward Agents
* LGA Agents
* State Agents
* National Admin

### 📈 Dashboard & Analytics

* Live result visualization
* Party performance charts
* Summary statistics

---

## 🛠️ Tech Stack

### Backend

* Python (Flask)
* Flask-JWT-Extended (Authentication)
* SQLAlchemy ORM
* PostgreSQL Database

### Frontend

* React / HTML / CSS (Responsive UI)
* JavaScript (Vanilla / React-based components)

### Other Tools

* REST APIs
* File Upload Handling
* Chart Libraries for Visualization

---

## 🧩 System Architecture

```
Frontend (React / HTML)
│
▼
Flask API (Backend)
│
▼
PostgreSQL Database
```

---


## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/ercmas.git
cd ercmas
```

### 2. Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file:
```
DATABASE_URL=postgresql://username:password@localhost/dbname
JWT_SECRET_KEY=your_secret_key
```

Run the server:
```bash
flask run
```

---

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## 🔐 Validation Rules

* Total votes must not exceed accredited voters
* Each submission must include:

  * Party vote counts
  * Polling unit details
* Image evidence is required for verification

---

## 🧪 Future Improvements

* AI-powered fraud detection
* Offline-first mobile support
* Blockchain-based result verification
* SMS-based reporting for low-network areas

---

## 🤝 Contribution

Contributions are welcome!
Feel free to fork the repo and submit a pull request.

---

## 📧 Contact

**Samuel Omajali**

* GitHub: https://github.com/samiko2024
* LinkedIn: https://www.linkedin.com/in/samuel-omajali

---

## ⭐ Acknowledgment

This project is built to support transparent and accountable electoral processes, especially in emerging democracies.

---

## 📜 License

MIT License


---
## 📸 Screenshots

### 🔐 User Authentication
![User Authentication](Screenshots/authentication.png)

### 🔐 User Authorization and Restriction
![User Authorization](Screenshots/user-authorization.png)

### 📝 Result Submission
![Result Submission](Screenshots/result-report.png)

### ⚠️Incident Report
![Incident Report](Screenshots/incident-report.png)

### 📊 Ward Collation Supervisor Report
![Ward Agent](Screenshots/ward-report.png)

### 🖥️ National Overview & Audit Dashboard
![Overview Dashboard](Screenshots/national-audit.png)

### 🚩 Flags Incident 
![Flags Incident](Screenshots/flag-incident.png)

### 🔍 Forensic investigation Of Incident
![Forensic investigation](Screenshots/forensic-detail.png)

### 👥 Users Assigned
![Users Assigned](Screenshots/user-assigned.png)

### 📤 Ward Collation Audit Report
![Ward Agent report](Screenshots/national-wards-audit.png)

### 📊 National Result Live Dashboard
![National Result](Screenshots/national-collation.png)

### 📊 States Result Live Dashboard
![States Result](Screenshots/state-colation.png)

### 📊 LGAs Result Live Dashboard
![LGAs Result](Screenshots/lga-collation.png)

### 📊 Ward Result Live Dashboard
![Ward Result](Screenshots/ward-collation.png)

### 📊 Polling Unit Result Live Dashboard
![Polling Unit Result](Screenshots/polling-unit-results.png)





=======
# ercmas
🇳🇬 Election Result Collation Monitoring &amp; Audit System  A secure, transparent, and real-time election result collation platform designed to monitor, verify, and audit election data across all levels — from Polling Units to National Collation.
>>>>>>> ffdfafa914222a8c5f19edc59538de897b088f4b
