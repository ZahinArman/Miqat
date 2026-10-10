# Miqat (مِيقات) · Quiet Personal Prayer Companion

> A prayer-focused, installable Progressive Web App (PWA) built with **React**, **TypeScript**, and **Vite**.  
> **Design direction:** *Quiet Focus* — dark minimalist, muted sage, Apple-inspired editorial restraint.

---

## Overview

**Miqat** helps you consistently see, record, and review the five daily prayers without guilt, streak pressure, leaderboards, or gamification.

- **Today's Schedule & Countdown**: Prominent next-prayer card with a live 1-second foreground countdown (`HH:MM:SS`), start time, and subtle progress indication.
- **One-Tap Completion**: One tap toggles completion state for today's prayers on the Home screen.
- **History & Monthly Consistency**: A calendar view displaying subtle completion indicators for past dates. Tapping any past date lets you inspect or adjust previous logs. Unrecorded prayers are never marked as "missed".
- **Local Calculation Engine**: Powered offline by the Batoul Apps `adhan` library with transparent calculation method selection (e.g. University of Islamic Sciences Karachi for South Asia/Bangladesh, MWL, Egyptian, Umm al-Qura) and Asr juristic options (Hanafi vs. Standard).
- **Manual Adjustments**: Per-prayer minute adjustments (`+` / `−` minutes) that preserve base calculated times.
- **100% Local & Private**: All data is persisted locally in the browser via IndexedDB (`idb`). No accounts, no analytics, no external servers.
- **Full PWA & Offline Support**: Service worker caching via `vite-plugin-pwa` (Workbox) allowing the app to install and function completely offline.

---

## Visual Design Reference

The design faithfully implements the *Quiet Focus* design system:

| Token | Hex | Role |
| :--- | :--- | :--- |
| `--color-bg` | `#171A18` | Dark background |
| `--color-surface` | `#232924` | Primary cards and rows |
| `--color-surface-raised` | `#292F2A` | Elevated buttons and chips |
| `--color-text` | `#E9E5DA` | Warm ivory text |
| `--color-text-muted` | `#A6B0A5` | Secondary labels and helper text |
| `--color-sage` | `#899C84` | Completed prayer checks and highlights |
| `--color-sage-soft` | `#B5C8A8` | Active navigation tabs and countdown timer |
| `--color-border` | `#343B35` | Subtle separators |

---

## Project Structure

```text
miqat/
├── public/
│   ├── icons/
│   │   ├── icon.svg
│   │   ├── icon-192.png
│   │   └── icon-512.png
│   └── manifest.webmanifest
├── src/
│   ├── app/
│   │   └── App.tsx
│   ├── components/
│   │   ├── BottomNav.tsx
│   │   ├── Header.tsx
│   │   ├── Modal.tsx
│   │   ├── NextPrayerCard.tsx
│   │   └── PrayerRow.tsx
│   ├── features/
│   │   ├── home/
│   │   │   └── HomeScreen.tsx
│   │   ├── history/
│   │   │   └── HistoryScreen.tsx
│   │   └── settings/
│   │       └── SettingsScreen.tsx
│   ├── services/
│   │   ├── prayerCalculator.ts
│   │   ├── scheduleService.ts
│   │   └── storage/
│   │       └── db.ts
│   ├── styles/
│   │   ├── tokens.css
│   │   ├── global.css
│   │   └── components.css
│   ├── tests/
│   │   ├── prayerCalculator.test.ts
│   │   ├── scheduleService.test.ts
│   │   └── storage.test.ts
│   ├── types/
│   │   └── index.ts
│   ├── main.tsx
│   └── vite-env.d.ts
├── assets/
├── Miqat_V1_Product_Brief.md
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation
```bash
git clone https://github.com/ZahinArman/Miqat.git
cd Miqat
npm install
```

### Development
Start the local Vite dev server:
```bash
npm run dev
```

### Running Tests
Run the comprehensive test suite with Vitest:
```bash
npm test
```

### Production Build
Generate an optimized production build and PWA service worker:
```bash
npm run build
npm run preview
```

---

## Specifications

Detailed product requirements and design constraints can be found in [Miqat_V1_Product_Brief.md](./Miqat_V1_Product_Brief.md).
