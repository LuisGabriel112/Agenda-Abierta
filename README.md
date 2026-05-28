# ✂️ Agenda Abierta

> SaaS de agendamiento online para barberías — gestiona citas, servicios
> y cobros desde un solo lugar.

![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&logo=fastapi)
![Supabase](https://img.shields.io/badge/DB-Supabase-3ECF8E?style=flat-square&logo=supabase)
![Stripe](https://img.shields.io/badge/Pagos-Stripe-635BFF?style=flat-square&logo=stripe)
![Docker](https://img.shields.io/badge/Container-Docker-2496ED?style=flat-square&logo=docker)
![Render](https://img.shields.io/badge/Deploy-Render-46E3B7?style=flat-square)

---

## 📌 ¿Qué problema resuelve?

Las barberías independientes pierden clientes por no tener un sistema de
citas en línea. Agenda Abierta les permite:

- Recibir reservas 24/7 sin llamadas
- Gestionar su agenda y servicios desde un dashboard
- Cobrar con Stripe directamente desde la plataforma
- Enviar recordatorios automáticos a clientes

---

## ✨ Funcionalidades

- 📅 **Agendamiento online** — el cliente elige barbero, servicio y horario
- 💳 **Pagos integrados** — checkout con Stripe
- 📊 **Dashboard** — visualiza citas del día, semana y mes
- 🔔 **Notificaciones** — recordatorios por email con Brevo
- 🐳 **Dockerizado** — despliegue fácil en cualquier servidor

---

## 🏗️ Arquitectura

    Cliente
        └──► Frontend
                └──► FastAPI Backend
                        ├──► Supabase (PostgreSQL)
                        ├──► Stripe API
                        └──► Brevo API (emails)

    Deploy: Docker en Render.com

---

## 🛠️ Tech Stack

| Capa | Tecnología |
|------|-----------|
| Backend | FastAPI · Python |
| Base de datos | Supabase (PostgreSQL) |
| Pagos | Stripe |
| Email | Brevo (transaccional) |
| Contenedores | Docker |
| Deploy | Render |

---

## 🚀 Instalación

**Con Docker (recomendado)**

```bash
git clone https://github.com/LuisGabriel112/Agenda-Abierta
cd Agenda-Abierta
cp .env.example .env
docker compose up --build
```

**Sin Docker**

```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

**Variables de entorno**

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
BREVO_API_KEY=your_brevo_key
```

---

## 📝 Nota técnica

Durante el despliegue en Render se resolvió un problema de compatibilidad
IPv4/IPv6 entre el servidor y Supabase, configurando el connection pooling
correctamente para entornos cloud.

---

## 👤 Autor

**Luis Gabriel Venegas Saucedo**
[LinkedIn](https://linkedin.com/in/luis-gabriel-venegas-saucedo-26a68b236) ·
[GitHub](https://github.com/LuisGabriel112) ·
venegassaucedoluis@gmail.com
