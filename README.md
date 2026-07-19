# MedVision Frontend 

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white)

##  About The Project
This repository contains the presentation layer for **MedVision**, an intelligent breast cancer screening and patient management system. 

Built as a decoupled Single Page Application (SPA), this frontend provides a highly responsive, component-based user interface. It connects patients with an underlying numerical machine-learning model for decision-support and facilitates secure telemedicine workflows with specialized physicians.

##  Core Features
* **Bilingual Native Support:** Seamless context-based switching between English (Left-To-Right) and Arabic (Right-To-Left) without page reloads, ensuring high accessibility in the MENA region.
* **AI Screening Interface:** A dedicated form accepting 30 cytological features to communicate with the Flask inference API. Features optional browser-side OCR (via Tesseract.js) to assist in prefilling printed report values.
* **Role-Based Dashboards:** Distinct protected routes and navigation experiences tailored for Patients, Doctors, and Administrators.
* **Real-Time Telemedicine UI:** Integrates with Pusher via WebSockets to provide instantaneous, full-duplex chat interfaces for patient-doctor consultations.
* **Dynamic Doctor Directory & Booking:** Interactive UI mapped to real-time physician availability schedules, driving a `PENDING` to `CONFIRMED` appointment state machine.

##  Tech Stack
* **Framework:** React 18
* **Build Tool:** Vite (for near-instant HMR and fast builds)
* **Styling:** TailwindCSS
* **Routing:** React Router v7
* **State Management:** React Context API (AuthContext, LanguageContext)
* **HTTP Client:** Axios

##  Local Setup & Installation

To run this application locally for development, follow these steps:

**1. Clone the repository:**
```bash
git clone [https://github.com/YOUR_GITHUB_USERNAME/medvision-frontend.git](https://github.com/YOUR_GITHUB_USERNAME/medvision-frontend.git)
cd medvision-frontend
