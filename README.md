# 🗓️ AgendaAbierta SaaS
> **Tu agenda llena, tus ingresos seguros.**

AgendaAbierta es una plataforma **Multi-tenant** de alto rendimiento diseñada para digitalizar la gestión de citas en negocios de bienestar (Barberías, Spas, Clínicas). Enfocada en reducir el "No-Show" mediante pagos de anticipos automatizados y recordatorios inteligentes por WhatsApp.

---

## 🚀 Características Principales

- **Multi-tenancy Real:** Aislamiento total de datos por negocio mediante arquitectura de base de datos basada en UUIDs.
- **Micro-sites Personalizados:** Cada negocio cuenta con su propia URL (`/[slug]`) con identidad visual (colores y logo) adaptable.
- **Motor de Disponibilidad Inteligente:** Cálculo de slots libres en tiempo real cruzando horarios de staff, duración de servicios y bloqueos manuales.
- **Gestión de Anticipos:** Integración con Stripe para obligar al pago de una reserva (20-50%) y asegurar la asistencia.
- **CRM Integrado:** Historial detallado por cliente, métricas de retención y analítica de ingresos.

## 🛠️ Stack Tecnológico

**Frontend:**
- **React 19** (Vite) + **TypeScript**.
- **Tailwind CSS** para un diseño Neo-minimalista.
- **React Query** para sincronización de estado asíncrono.
- **Lucide React** & **Shadcn/UI** para componentes de alta fidelidad.

**Backend:**
- **FastAPI** (Python 3.12+) con arquitectura asíncrona.
- **SQLAlchemy 2.0** (Mapeo moderno con `Mapped` y `mapped_column`).
- **PostgreSQL** como base de datos relacional robusta.
- **Redis** para el manejo de concurrencia y bloqueos temporales de slots.

---

## 📂 Estructura del Proyecto

```text
├── backend/
│   ├── app/
│   │   ├── modelos.py      # Esquemas de SQLAlchemy en español
│   │   ├── esquemas.py     # Validaciones Pydantic v2
│   │   ├── api/            # Endpoints REST v1
│   │   └── core/           # Motor de disponibilidad y lógica de negocio
├── frontend/
│   ├── src/
│   │   ├── components/     # UI Reutilizable (Stitch Design System)
│   │   ├── hooks/          # Lógica de React personalizada
│   │   └── pages/          # Vistas (Admin, Booking, Landing)
