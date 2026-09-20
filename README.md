<div align="center">

# 🌿 Nursery Admin

### Premium Plant Management Dashboard · React + TypeScript + Vite

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8.1-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev)
[![License](https://img.shields.io/badge/License-Private-ef4444?style=for-the-badge)]()

<br/>

<img src="https://img.shields.io/badge/🪴_Admin_Panel-White_&_Green_Theme-16a34a?style=for-the-badge&labelColor=064e3b" alt="Admin Panel" />

<br/><br/>

*A stunningly beautiful admin dashboard for managing an online plant nursery — featuring a premium White & Green design system, comprehensive plant inventory management, AI-powered insights, and real-time analytics.*

</div>

---

## ✨ Design Philosophy

> **Ultra-premium White & Green** — Every pixel is crafted for a professional nursery management experience.

<table>
<tr>
<td width="33%" align="center">

### 🎨 Theme
Dark emerald sidebar<br/>
White content area<br/>
Green accent interactions<br/>
Glassmorphism login

</td>
<td width="33%" align="center">

### ✍️ Typography
Plus Jakarta Sans (headings)<br/>
Inter (body text)<br/>
Monospace (codes/IDs)<br/>
Premium letter-spacing

</td>
<td width="33%" align="center">

### 🎬 Motion
Spring-eased transitions<br/>
Staggered grid animations<br/>
Hover lift effects<br/>
Micro-interactions

</td>
</tr>
</table>

---

## 🌿 Features

<table>
<tr>
<td width="50%">

### 🏷️ Plant Inventory
- **Complete plant specs** — sunlight, watering, difficulty, soil, temperature
- **Size & pot variants** — Small/Medium/Large with Ceramic, Terracotta, Self-watering pots
- **Plant badges** — 🐾 Pet Safe · 💨 Air Purifying · 🌸 Flowering · 💊 Medicinal
- **Care tips editor** — Quick tips + "What's Included" checklist
- **Gallery management** — Multi-image upload with Cloudinary
- **Live price preview** — MRP vs selling price with discount calculation

</td>
<td width="50%">

### 📦 Order Management
- Full order lifecycle tracking
- Gift wrapping & message support
- PDF invoice generation & download
- Payment status (Razorpay integration)
- Returns & exchange handling

</td>
</tr>
<tr>
<td>

### 📊 Analytics & Dashboard
- Revenue stats with period comparison
- Top-selling plants
- Low stock alerts
- Customer growth metrics
- Order status distribution

</td>
<td>

### 🛠️ Store Management
- **Categories** — Nested plant categories with icons
- **Coupons** — Discount code creation & tracking
- **Blog CMS** — Plant care articles with rich editor
- **Banners** — Storefront banner management
- **Home Layout** — Drag-and-drop section ordering
- **Restock Waitlist** — See who's waiting + manual resolve
- **Team Access** — Role-based admin permissions

</td>
</tr>
</table>

---

## 🏗️ Project Structure

```
src/
├── components/
│   └── Layout.tsx      # Premium sidebar + topbar shell
├── pages/
│   ├── Login.tsx       # Glassmorphism green login
│   ├── Dashboard.tsx   # Stats + analytics overview
│   ├── Products.tsx    # Plant inventory table
│   ├── ProductEditor.tsx # Full plant spec + variant editor
│   ├── Orders.tsx      # Order management
│   ├── Categories.tsx  # Nested categories
│   ├── Combos.tsx      # Plant bundles
│   ├── Waitlist.tsx    # Restock alerts
│   ├── Blog.tsx        # Plant care CMS
│   ├── Settings.tsx    # Store configuration
│   └── ...
├── api.ts              # API client + image upload
├── auth.ts             # JWT + role-based access
├── sections.ts         # Navigation sections config
├── styles.css          # Complete White & Green design system
└── index.css           # Base styles + fonts
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+**
- **npm** or **yarn**

### Setup

```bash
# 1. Clone & install
git clone https://github.com/ulmind-com/Nursery-Admin.git
cd Nursery-Admin
npm install

# 2. Configure
cp .env.example .env
# Set VITE_API_URL to your backend URL

# 3. Run
npm run dev
# → http://localhost:5173
```

### Build for Production

```bash
npm run build
# Output → dist/ (21.78KB CSS + 435KB JS gzipped)
```

---

## 🎨 Design System

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--primary` | `#16a34a` | Buttons, links, accents |
| `--primary-dark` | `#15803d` | Hover states |
| `--primary-darker` | `#064e3b` | Sidebar, headings |
| `--primary-50` | `#f0fdf4` | Backgrounds, hover fills |
| `--primary-100` | `#dcfce7` | Badge backgrounds |
| `--bg` | `#fafdfb` | Page background |
| `--card` | `#ffffff` | Card surfaces |
| `--text` | `#0f172a` | Primary text |
| `--muted` | `#64748b` | Secondary text |
| `--red` | `#ef4444` | Errors, danger actions |

### Component Classes

```css
.btn              /* Green gradient button */
.btn.ghost        /* Outlined button */
.btn.danger       /* Red destructive button */
.card             /* White card with shadow */
.pill.green       /* Green status badge */
.pill.blue        /* Blue info badge */
.stat             /* Dashboard stat card with gradient number */
.nav a.active     /* Sidebar active indicator */
```

---

## 🗺️ Roadmap

| Phase | Feature | Status |
|-------|---------|--------|
| **v1.0** | White & Green premium theme | ✅ Done |
| **v1.0** | Plant inventory + spec editor | ✅ Done |
| **v1.0** | Size/pot variant management | ✅ Done |
| **v1.0** | Order + payment tracking | ✅ Done |
| **v1.0** | Blog CMS + storefront layout | ✅ Done |
| **v1.1** | Dark mode toggle | 🔜 Planned |
| **v1.1** | Bulk plant import (CSV/Excel) | 🔜 Planned |
| **v1.2** | Real-time order notifications | 🔜 Planned |
| **v1.2** | Advanced analytics charts | 🔜 Planned |
| **v2.0** | Multi-nursery dashboard | 📋 Backlog |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | React 19 |
| **Language** | TypeScript 5.8 |
| **Build** | Vite 8.1 |
| **Routing** | React Router 7 |
| **Styling** | Vanilla CSS (custom design system) |
| **Fonts** | Inter + Plus Jakarta Sans (Google Fonts) |
| **API** | Fetch-based client with JWT auth |

---

## 📝 Environment

```env
VITE_API_URL=http://localhost:8000
```

---

<div align="center">

**Crafted with 💚 for plant nursery management**

*[ulmind-com](https://github.com/ulmind-com)*

</div>
