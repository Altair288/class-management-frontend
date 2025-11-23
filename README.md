# Class Management System

[![Java](https://img.shields.io/badge/Java-23-blue.svg)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/SpringBoot-3.x-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange.svg)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](#license)

A modern, full-stack **Class Management System** designed for administrators, teachers, and students.
The system digitizes and automates class operations such as student information management, messaging, notifications, file storage, and grade tracking.

---

## 📚 Table of Contents

* [1. Project Background & Motivation](#1-project-background--motivation)
* [2. Requirements & Technical Implementation](#2-requirements--technical-implementation)

  * [2.1 Core Functional Requirements](#21-core-functional-requirements)
  * [2.2 Tech Stack](#22-tech-stack)
  * [2.3 Architecture & Development Workflow](#23-architecture--development-workflow)
* [3. System Results](#3-system-results)
* [4. Future Roadmap](#4-future-roadmap)
* [5. Project Structure](#5-project-structure)
* [6. Installation & Deployment](#6-installation--deployment)
* [7. Screenshots](#7-screenshots)
* [8. License](#8-license)

---

# 1. Project Background & Motivation

### Why Build This Project?

Modern education requires the management of student data, attendance, grades, communication, scheduling, and resources. Traditional paper-based workflows or scattered Excel files result in:

* Data inconsistency
* Low efficiency
* Difficulties in tracking updates
* Communication delays

This project provides a unified digital platform for **administrators, teachers, and students** to streamline class-related tasks.

### Core Goals

* **Increase efficiency** via process automation
* **Centralize student data** into a secure database
* **Improve communication** using a real-time message center
* **Enhance user experience** with a responsive UI and modern system design

---

# 2. Requirements & Technical Implementation

## 2.1 Core Functional Requirements

### 🔐 User Authentication & Authorization (RBAC)

* Account/password login
* Role-based access control (Admin/Teacher/Student)
* Password reset (email / verification code)

### 👤 Student Information Management

* CRUD operations
* Batch import via CSV/Excel
* Personal information dashboard

### 🔔 Message & Notification Center

* Send global or targeted notifications
* Read/unread tracking
* Real-time alerts via WebSocket or polling

### 📦 File & Resource Management

* Avatar upload
* Assignment submission
* Course resource downloads
* MinIO/S3 integration

### 🏆 Credits & Grade Management

* Record assessment scores
* Visual grade reports

### ⚙ System Settings & Monitoring

* Light/Dark mode
* System logs

---

## 2.2 Tech Stack

### Backend

* **Spring Boot (Java)**
* **MySQL** (primary database)
* **Flyway** for database versioning
* **Spring Security** for authentication/authorization
* **Spring Data JPA / Hibernate**
* **MinIO** for object storage
* **Swagger / Markdown** for API documentation
* **Docker & Docker Compose** for deployment

### Frontend

* **Next.js (React)**
* **TypeScript**
* **Material UI (MUI)**
* **Tailwind CSS**
* **Emotion** (CSS-in-JS)
* **Axios**
* **Recharts / Chart.js**

---

## 2.3 Architecture & Development Workflow

### 🗄 Database Design

* Third-normal-form schema
* Core tables: `users`, `roles`, `messages`, `files`, `grades`, etc.
* Managed by Flyway (`V1__baseline.sql`, `V2__seed_data.sql`, …)

### 🧩 Backend Architecture

* Layered design:
  `Controller → Service → Repository`
* Implemented MessageCenter module
* Integrated MinIO-based file services
* Multi-environment config (`dev`, `prod`)

### 🎨 Frontend Development

* Next.js + TypeScript project structure
* Reusable layout components
* Responsive UI for PC & Mobile
* Global notification system via Context API

### 🚀 Deployment

* Docker Compose: backend + frontend + MySQL + MinIO
* Nginx reverse proxy for routing and CORS

---

# 3. System Results

### ✅ Fully Functional Production-Ready System

* Complete workflow from login → management → notifications
* Secure access control
* Modern responsive UI
* Dockerized for quick deployment

### 🌟 System Highlights

* Real-time Message Center
* Dynamic visual workflow charts
* Flexible permission system supporting future roles

---

# 4. Future Roadmap

* 📱 Mobile App (React Native / Flutter)
* 🤖 AI Assistant for score analysis & automated grading
* 🏫 More modules: Leave approvals, dormitory management, campus service suite

---

# 5. Project Structure

Example structure (adjust based on your actual repo):

```
/backend
  ├── src/main/java/com/cms/...
  ├── application-dev.yml
  ├── application-prod.yml
  └── Dockerfile

/frontend
  ├── components/
  ├── pages/
  ├── public/
  └── Dockerfile

/docker
  ├── docker-compose.yml
  └── nginx.conf
```

---

# 6. Installation & Deployment

### Requirements

* Docker & Docker Compose
* Node.js 18+
* Java 17+

### Quick Start

```bash
git clone https://github.com/yourname/class-management-system.git
cd class-management-system
docker compose up -d
```

Backend runs at: `http://localhost:8080`
Frontend runs at: `http://localhost:3000`

---

# 7. Screenshots

> *(Add your screenshots here)*

Example:

```
/assets/screenshots/
  ├── dashboard.png
  ├── student-list.png
  └── message-center.png
```

---

# 8. License

This project is licensed under the **MIT License**.
You are free to use, modify, and distribute it.

---
