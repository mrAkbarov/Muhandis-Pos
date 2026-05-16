🚀 SmartPOS-AI

A scalable, modular Point of Sale (POS) & Business Management System built with Django REST Framework, PostgreSQL, and Next.js.

📌 Overview

SmartPOS-AI — bu retail bizneslar uchun mo‘ljallangan professional POS tizimi bo‘lib, quyidagi funksiyalarni qamrab oladi:

🛒 Sales (POS system)
📦 Inventory management
👥 CRM (Customer management)
📊 Analytics & reporting
🏬 Multi-branch support
🔔 Notifications system
⚡ Real-time updates (WebSockets)
🏗 System Architecture

Project modular monolith architecture asosida qurilgan va Django app-based structure ga tayanadi.

smartpos-ai/
│
├── backend/          # Django REST Framework backend
├── frontend/         # Next.js UI
├── database/         # PostgreSQL schema & migrations
├── docker/           # Container setup
├── nginx/            # Reverse proxy config
├── scripts/          # Automation scripts
└── docs/             # Documentation
🧠 Backend (Django REST Framework)

Backend Django apps asosida modular tarzda ajratilgan:

backend/app/
│
├── api/
│   ├── auth/
│   ├── users/
│   ├── products/
│   ├── inventory/
│   ├── sales/
│   ├── customers/
│   ├── suppliers/
│   ├── analytics/
│   ├── reports/
│   ├── notifications/
│   └── branches/
│
├── models/          # Django models
├── serializers/     # DRF serializers
├── services/        # Business logic layer
├── utils/           # Helpers (JWT, barcode, etc.)
├── middleware/      # Auth, logging, permissions
├── tasks/           # Celery / background jobs
└── consumers/       # WebSocket (Django Channels)
📦 Core Modules
🔐 Authentication
JWT authentication
Role-based access control (RBAC)
👤 Users
Admin, cashier, manager roles
📦 Products
Product CRUD
Barcode support
Pricing system
📊 Inventory
Stock management
Incoming / outgoing tracking
🛒 Sales (POS Engine)
Checkout system
Receipt generation
Discount & payment handling
👥 CRM
Customer profiles
Purchase history
Debt tracking
🚚 Suppliers
Supply management
Purchase orders
📈 Analytics & Reports
Daily sales reports
Profit tracking
Best-selling products
🏬 Branches
Multi-branch support
Centralized control
🔔 Notifications
Low stock alerts
System notifications
⚛️ Frontend (Next.js)
frontend/src/
│
├── app/            # Pages (dashboard, POS, etc.)
├── components/     # UI components
├── services/       # API calls (Django backend)
├── store/          # State management (cart, auth)
├── hooks/          # Custom hooks
├── lib/            # Axios, WebSocket setup
├── types/          # TypeScript types
└── styles/         # Global styles
🐘 Database (PostgreSQL)
Main tables:
users
roles
products
categories
inventory
sales
sale_items
customers
suppliers
branches
payments
⚡ Real-Time Features

Using Django Channels + WebSockets:

Live POS updates
Stock synchronization
Real-time sales dashboard
Instant notifications
🐳 DevOps & Deployment

Project fully containerized:

Docker (backend, frontend, postgres)
Nginx reverse proxy
CI/CD ready structure
Scripts:
deploy.sh → production deployment
backup.sh → database backup
migrate.sh → migrations
seed.sh → initial data
🧱 Tech Stack
Backend
Django REST Framework
Django ORM
PostgreSQL
Django Channels (WebSockets)
Celery (background tasks)
Frontend
Next.js
TypeScript
TailwindCSS
Zustand / Redux
DevOps
Docker
Nginx
Linux server
📐 Design Principles
Clean Architecture (DRF apps separation)
Service Layer pattern
Scalable modular design
API-first architecture
Real-time ready system
🚀 Project Goal

Build a production-ready POS ecosystem that supports multi-branch retail businesses with real-time synchronization, analytics, and scalable architecture.

👨‍💻 Author

SmartPOS-AI Team