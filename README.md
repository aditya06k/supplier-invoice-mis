# InvoiceOS — Supplier Invoice Verification MIS

A web-based Management Information System for end-to-end supplier invoice verification across a supply chain. Built with vanilla HTML, CSS, and JavaScript, backed by Firebase Authentication and Cloud Firestore.

**Live Demo:** [https://aditya06k.github.io/supplier-invoice-mis/](https://aditya06k.github.io/supplier-invoice-mis/)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Firebase Configuration](#firebase-configuration)
- [Project Structure](#project-structure)
- [Role-Based Access](#role-based-access)
- [Security](#security)
- [License](#license)

---

## Overview

InvoiceOS provides a role-based dashboard for managing the full lifecycle of supplier invoices — from submission by suppliers, through review and approval by managers, to audit trail inspection by auditors. All data is persisted in Cloud Firestore, enabling real-time visibility across all roles.

---

## Features

### Authentication and Authorization
- Email/password authentication via Firebase Auth
- Role-based access control (Supplier, Manager, Auditor)
- Session persistence using `onAuthStateChanged` with localStorage caching
- Secure signup with role assignment stored in Firestore

### Supplier Dashboard
- Submit new invoices with metadata (amount, category, description)
- Attach supporting documents (PDF, PNG, JPG — up to 750 KB)
- Track invoice status (Pending, Approved, Rejected)
- View KPI summary: total invoices, pending, approved, rejected, volume

### Manager Dashboard
- Review all submitted invoices across suppliers
- Filter by status (Pending, All, Approved, Rejected)
- Approve or reject invoices with optional remarks
- One-click actions from both card view and detail modal

### Auditor Dashboard
- Read-only view of all invoices in a tabular layout
- Search invoices by supplier name, invoice number, or category
- KPI overview of system-wide invoice metrics

### Audit Trail
- Immutable, timestamped log of all invoice actions
- Records: submission, approval, rejection — with actor and remarks
- Export audit log as CSV

### Document Management
- File upload stored as base64 in Firestore (no Firebase Storage or paid plan required)
- View and download attached documents directly from the invoice detail modal

### User Interface
- Dark theme with industrial-utilitarian design language
- Responsive layout with collapsible sidebar for mobile
- Real-time clock display (IST)
- Toast notification system for user feedback
- Smooth modal transitions and micro-animations

---

## Architecture

```
Browser (Static HTML/CSS/JS)
    |
    |-- Firebase Auth (Email/Password)
    |
    |-- Cloud Firestore
    |       |-- users/{uid}           → User profiles and roles
    |       |-- invoices/{invNumber}  → Invoice documents
    |       |-- invoice_files/{invNo} → Base64-encoded file attachments
    |       |-- audit_logs/{autoId}   → Timestamped action log
    |
    |-- GitHub Pages (Hosting)
```

---

## Tech Stack

| Layer          | Technology                          |
|----------------|-------------------------------------|
| Frontend       | HTML5, CSS3, JavaScript (ES6+)      |
| Authentication | Firebase Auth (Email/Password)      |
| Database       | Cloud Firestore                     |
| File Storage   | Firestore (base64 encoding)         |
| Fonts          | Inter, IBM Plex Mono (Google Fonts) |
| Hosting        | GitHub Pages                        |
| SDK            | Firebase Web SDK v10 (Compat)       |

---

## Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Edge, Safari)
- A Firebase project (free Spark plan is sufficient)
- Git

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/aditya06k/supplier-invoice-mis.git
   cd supplier-invoice-mis
   ```

2. Serve the project locally using any static server:
   ```bash
   npx serve .
   ```

3. Open `http://localhost:3000` in your browser.

### Deployment

The project is deployed via GitHub Pages. Any push to the `main` branch automatically updates the live site.

---

## Firebase Configuration

### 1. Create a Firebase Project
- Go to [Firebase Console](https://console.firebase.google.com)
- Create a new project or use an existing one

### 2. Enable Authentication
- Navigate to Authentication > Sign-in method
- Enable Email/Password provider

### 3. Create Firestore Database
- Navigate to Firestore Database
- Create database in production mode
- Apply the following security rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 4. Update Firebase Config
Replace the `firebaseConfig` object in `app.js` with your project's credentials:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

---

## Project Structure

```
supplier-invoice-mis/
├── index.html      # Application markup (login, signup, dashboards, modals)
├── index.css       # Design system and all styles
├── app.js          # Application logic, Firebase integration, data layer
└── README.md       # Project documentation
```

---

## Role-Based Access

| Role     | Capabilities                                                        |
|----------|---------------------------------------------------------------------|
| Supplier | Submit invoices, attach documents, track status, view audit trail   |
| Manager  | Review invoices, approve/reject with remarks, view audit trail      |
| Auditor  | Read-only access to all invoices, search, export audit trail as CSV |

---

## Security

- All Firestore read/write operations require authenticated users
- Firebase API keys are client-side by design; security is enforced through Firestore security rules
- Role verification is performed against Firestore on every login and session restore
- File uploads are validated for type and size on the client side

---

## License

This project is developed for educational and demonstration purposes.
