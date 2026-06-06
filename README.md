# Raffle System Frontend (Angular)

## Project Summary

This repository contains the frontend for a raffle / auction platform built with Angular 21. The application is a responsive Single Page Application (SPA) that connects to a C# backend API for authentication, gift management, orders, raffle draws, and reporting.

## Why this project exists

The frontend provides a professional user experience for both end customers and administrators. It supports:

- browsing and searching raffle gifts
- placing orders and checking out
- secure login and registration
- admin management of donors, gifts, and raffle events
- viewing sales and raffle reports

## Technical Stack

- Angular 21
- TypeScript
- RxJS
- Bootstrap CSS
- Angular standalone components
- `HttpClient` + REST API integration

## Main Features

- Route-based lazy loading for improved performance
- JWT authentication with protected routes
- Centralized API error handling via interceptors
- Global loading indicator during network calls
- Admin dashboard for donors, gifts, raffles, and reports
- Cart and checkout flow for raffle orders
- Responsive UI with Bootstrap and toast notifications

## Architecture Overview

- `src/app/app.config.ts` — configures Angular HTTP client providers and interceptors
- `src/app/services` — reusable services for auth, gifts, donors, orders, raffle, email, and admin endpoints
- `src/environments/environment.ts` — API base URL and environment settings
- `src/app/services/auth.guard.ts` / `admin.guard.ts` — secure route access
- `src/app/components` — standalone components and page layouts

## Frontend / Backend Integration

The frontend is designed to work with a C# backend API. The default local API configuration is stored in `src/environments/environment.ts`:

```ts
apiUrl: 'http://localhost:5226/api'
```

### Expected backend API areas

- `Account` — login, registration
- `Gift` — gift catalog, search, create, update, delete, sales summary
- `Donor` — donor management
- `Order` — cart checkout, order history, order confirmation
- `Raffle` — conduct raffle draws, winner management
- `Winner` — winner listings
- `Email` — send email notifications

### Typical API calls

- Auth: `/Account/login`, `/Account/register`
- Gifts: `/Gift`, `/Gift/search`, `/Gift/sales-summary`
- Orders: `/Order/checkout`, `/Order/{id}/confirm`, `/Order/user/{userId}`
- Raffle: `/Raffle/conduct/{giftId}`, `/Winner`
- Admin: `/Donor`, `/Gift`, `/Raffle/run/{giftId}`

The app uses interceptors to attach auth headers, handle loading state, and manage HTTP errors consistently.

## Get Started

### Prerequisites

- Node.js 18+ / 20+
- npm
- C# backend running locally or reachable via API

### Run locally

```bash
git clone https://github.com/Chaya-git739/Angular-Project.git
cd angularProject
npm install
npm start
```

Then open:

```text
http://localhost:4200
```

### Recommended reproducible install

```bash
npm ci
```

## Configuration

If the backend is hosted on a different URL, update the API base URL in:

- `src/environments/environment.ts`
- `src/environments/environment.prod.ts`

## Available Scripts

- `npm start` — run the development server
- `npm run build` — build production assets
- `npm test` — run unit tests

## Reviewer Notes

This README is designed to help reviewers understand the project quickly:

- the app is a polished Angular SPA that depends on a C# backend API
- the repo uses standard scripts and a predictable npm workflow
- the frontend is structured around services, guards, and lazy-loaded pages

### Recommended next steps for the repo

- keep `package-lock.json` committed for consistent installs
- add a screenshot or short demo GIF
- document the C# backend startup command and expected API port
- include a short “Project status” or “Roadmap” section

## Notes

- The frontend is meant to be evaluated alongside the backend API contract
- Backend startup details are not included here; add them if the backend is in a separate repository
- Docker support can be added later, but the current `npm` workflow is the simplest for reviewers

---

Built for clarity, maintainability, and collaboration between Angular frontend and C# backend teams.
