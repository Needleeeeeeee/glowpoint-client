# Glow Point — Client (Booking App)

The **public-facing web app** for **Glow Point**, an online appointment booking
system for a beauty and wellness business. It serves the marketing site and the
customer booking flow: browsing services, picking a date and time, paying a
booking fee, joining a walk-in queue via QR code, and leaving feedback.

This repository is the **client half** of the project. Booking data is written to
**Supabase** (Postgres), which is the shared backend with the admin dashboard.
The app is mostly a static front end — its main job is to **post booking data**
and read back service/queue configuration.

> Looking for the admin side? See
> [`glowpoint-dashboard`](https://github.com/needlehmbl/glowpoint-dashboard),
> which handles appointment CRUD, payments, services, users, calendar, and
> business analytics.

## Features

- **Marketing sections** — Navbar, Banner, About, Services, Contact, Footer, and
  a Feedback form.
- **Dynamic service catalog** — service categories and services are fetched from
  the `ServiceCategories` and `Services` tables and grouped by category, so the
  UI reflects dashboard changes without a redeploy.
- **Booking flow** — date and time pickers, input sanitisation, and validation
  before writing an appointment.
- **Payments (GCash)** — generates a secure reference number, builds a GCash
  payment instruction, renders a QR code, and checks payment status while
  cleaning up expired instructions.
- **Walk-in queue** — scan a QR code to join the queue and view your live
  position, backed by a Supabase realtime subscription (`useQueue` hook).
- **Feedback & ratings** — customers can rate and comment on their visit.
- **Recently booked appointment** — the latest booking is cached in a cookie and
  its status is re-checked on load.

## Tech stack

| Layer      | Technology                                                        |
| ---------- | ----------------------------------------------------------------- |
| Framework  | React 19 + Vite 6                                                 |
| Styling    | Tailwind CSS 4, Material UI                                       |
| Backend    | Supabase (`@supabase/supabase-js`)                                |
| UI/UX      | react-toastify, react-icons, date-fns, apexcharts                 |
| Utilities  | js-cookie                                                         |
| Linting    | ESLint                                                            |

## Project structure

```
src/
  App.jsx                  App shell, queue + recently-booked handling
  components/
    Navbar, Banner, About, Services, Contact, Footer, Feedback
    DatePicker, TimePicker, Modal
    EnhancedPaymentModal, QRCodeGenerator, QRScanner
    Queue.jsx
    actions.js             Supabase reads/writes (services, appointments, queue)
    secure-payments.js     Payment instructions, reference numbers, status
    config.js              Business + payment config from env
    supabase.js            Supabase client
  hooks/
    queue.js               useQueue — queue state + realtime subscription
public/                    Static assets and logo
```

## Deployment

The app builds to static assets with `npm run build`, so it can be hosted on any
static host (Netlify, Vercel, GitHub Pages, etc.). Because it talks directly to
Supabase, no server-side runtime is required.
