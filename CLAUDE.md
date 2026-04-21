# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hydroponic Agriculture Management System Web Frontend - a management platform for greenhouse/hydroponic environments with device management, real-time monitoring, telemetry data visualization, and control command dispatching.

## Tech Stack

- **Framework**: Vue 3 + Composition API
- **UI Library**: Element Plus
- **Build Tool**: Vite
- **State Management**: Pinia
- **Router**: Vue Router
- **HTTP Client**: Axios
- **Charts**: ECharts
- **Language**: TypeScript

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npm run type-check

# Lint
npm run lint
```

## Architecture

### Directory Structure

```
src/
├── api/           # API request modules (auth.ts, device.ts, telemetry.ts, etc.)
├── assets/        # Static assets and global styles
├── components/    # Shared components (layout/, common/)
├── composables/   # Vue composables (useAuth.ts, usePermission.ts)
├── router/        # Route configuration
├── stores/        # Pinia stores (auth.ts, device.ts)
├── types/         # TypeScript type definitions
├── utils/         # Utility functions (request.ts, format.ts)
└── views/         # Page components
```

### Key Patterns

1. **API Layer**: Each domain has its own API module in `src/api/`. All requests go through a centralized Axios instance in `request.ts` that handles:
   - Auto-adding JWT token to Authorization header
   - Unified error handling (401 → login, 403 → permission denied)
   - Response format: `{ code, message, data, request_id }`

2. **Authentication**: JWT stored in localStorage, user info in Pinia store. Route guards check token validity.

3. **Permissions**: Three roles - ADMIN (full access), OPERATOR (query + control), VIEWER (query only). Control via route meta and `hasPermission()` composable.

4. **State Management**: Use Pinia stores for global state (auth, device selections). Local state in components for page-specific data.

## API Base URL

- Development: `http://localhost:8080/api`
- Configure via `.env.development` and `.env.production`

## MVP Scope (Phase 1)

- Login page
- Device list + detail
- Device groups
- Telemetry realtime data
- Telemetry history data

## Documentation

- `docs/FRONTEND_PRD.md` - Full product requirements
- `docs/API_SPEC.md` - Complete API specification
- `docs/plans/2026-04-20-mvp-frontend-design.md` - MVP design decisions