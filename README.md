# AgendaAbierta

Plataforma SaaS multi-tenant para gestión de citas. Cada negocio obtiene su propio micro-sitio público donde los clientes pueden reservar, pagar anticipos y cancelar citas sin intervención del negocio.

---

## Stack

**Backend**
- Python 3.13 + FastAPI
- SQLAlchemy 2.0 (ORM con `Mapped` / `mapped_column`)
- PostgreSQL (Supabase)
- Stripe (suscripciones + pagos de anticipos + Stripe Connect)
- Brevo (email + WhatsApp)
- APScheduler (recordatorios automáticos)
- Clerk (autenticación)

**Frontend**
- React 18 + TypeScript + Vite
- Tailwind CSS 4
- Clerk React
- React Router DOM 7

---

## Estructura

```
├── app/
│   ├── main.py              # Todos los endpoints REST (FastAPI)
│   ├── modelos.py           # Modelos SQLAlchemy
│   ├── database.py          # Conexión a la base de datos
│   └── notificaciones.py    # Emails y WhatsApp via Brevo
├── frontEnd/
│   └── src/
│       ├── pages/           # Landing, Dashboard, NegocioPublico, CancelarCita, etc.
│       ├── components/      # Componentes reutilizables del dashboard
│       └── App.tsx          # Rutas
├── migrations/              # Scripts de migración de base de datos
├── Dockerfile
└── render.yaml
```

---

## Desarrollo local

```bash
# Backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontEnd
npm install
npm run dev
```

---

## Migraciones

Los scripts en `migrations/` agregan columnas a la base de datos existente. Ejecutar una sola vez por entorno:

```bash
python migrations/migrate_cancel_token.py
```

---

## Deploy

- **Backend:** Render (`render.yaml` incluido). Conectar repo y configurar variables de entorno en el dashboard.
- **Frontend:** Vercel. Root directory: `frontEnd`. Agregar las tres variables `VITE_*` en el dashboard.
- **Base de datos:** PostgreSQL en Supabase (ya incluido en `DATABASE_URL`).

---

## Funcionalidades

- Registro de negocios con onboarding guiado
- Micro-sitio público por negocio (`/b/:slug`) para reservas
- Cancelación de citas por el cliente via link en email (`/cancelar/:token`)
- Motor de disponibilidad en tiempo real (horarios + bloqueos + citas existentes)
- Pagos de anticipos con Stripe Checkout
- Stripe Connect Express para cobros en cuenta del negocio
- Recordatorios automáticos por email 24h antes de la cita
- Notificaciones por email al cliente y al negocio
- Dashboard con calendario, clientes, servicios, empleados y analítica
- Exportación CSV de citas y clientes
- Panel de administrador global
