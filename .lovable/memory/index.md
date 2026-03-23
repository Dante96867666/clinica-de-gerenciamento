# Memory: index.md
Updated: today

Sistema de gerenciamento de clínica médica com design bege/laranja inspirado no site Espaço Queiroz De Castro.

## Design
- Primary: HSL 20 95% 46% (laranja #E85D04)
- Background: HSL 30 50% 97% (bege claro)
- Font: Plus Jakarta Sans
- Style: clean, rounded, soft shadows

## Stack
- Frontend: React + Vite + Tailwind + TypeScript
- Backend: API REST genérica (preparado para MySQL)
- API service layer em src/services/api.ts
- Auth via JWT token em localStorage

## Backend API esperada
- Base URL: VITE_API_URL (default: http://localhost:3001/api)
- Endpoints: /auth/*, /patients, /professionals, /appointments, /sessions, /dashboard/stats
- Auth: Bearer token via header Authorization

## Modules
- Dashboard, Agendamento, Pacientes, Sessões, Profissionais
- Auth: email/password login, signup, password reset (via API)

## Preferences
- Language: Portuguese (pt-BR)
- Clinic type: Médica geral

## Removals
- Supabase removido completamente (dependência, client, types)
