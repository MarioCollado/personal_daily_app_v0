# GymLog 🏋️

> Diario de entrenamiento minimalista. PWA instalable. Next.js + Supabase + TailwindCSS.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14 (App Router) |
| UI | TailwindCSS |
| Auth + DB | Supabase |
| Charts | Recharts |
| Deploy | Vercel |
| PWA | next-pwa |

---

## Setup paso a paso

### 1. Supabase — Crear tablas

1. Ve a [supabase.com](https://supabase.com) → tu proyecto → **SQL Editor**
2. Pega el contenido completo de `supabase-schema.sql`
3. Pulsa **Run** — se crean las 3 tablas con RLS activado

### 2. Obtener credenciales Supabase

En tu proyecto Supabase → **Project Settings → API**:

- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Variables de entorno

```bash
cp .env.example .env.local
```

Edita `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://XXXXXXXXXXXX.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

### 4. Instalar y ejecutar en local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

### 5. Iconos PWA

Crea la carpeta `public/icons/` y añade:

- `icon-192.png` (192×192 px)
- `icon-512.png` (512×512 px)
- `apple-touch-icon.png` (180×180 px)

Puedes generarlos gratis en [favicon.io](https://favicon.io) o [realfavicongenerator.net](https://realfavicongenerator.net).

### 6. Deploy en Vercel

```bash
npm i -g vercel
vercel
```

O conecta el repositorio desde [vercel.com](https://vercel.com) e importa el proyecto.

**Variables de entorno en Vercel:**
Settings → Environment Variables → añade las dos variables de Supabase.

---

## Estructura del proyecto

```
gymlog/
├── app/
│   ├── layout.tsx            # Layout raíz + metadatos PWA
│   ├── page.tsx              # Redirect → /today
│   ├── globals.css           # Estilos globales + Tailwind
│   ├── auth/login/
│   │   └── page.tsx          # Login / Registro
│   ├── today/
│   │   └── page.tsx          # 🏠 Pantalla principal: entreno del día
│   ├── history/
│   │   └── page.tsx          # 📅 Historial de sesiones
│   └── exercise/[id]/
│       └── page.tsx          # 📈 Progresión por ejercicio
│
├── components/
│   ├── ui/
│   │   ├── BottomNav.tsx     # Navegación inferior
│   │   └── RestTimer.tsx     # Timer de descanso con FAB
│   ├── workout/
│   │   ├── ExerciseCard.tsx  # Card de ejercicio con series
│   │   ├── SetRow.tsx        # Fila de serie individual
│   │   └── AddExerciseModal.tsx # Modal añadir ejercicio
│   └── charts/
│       └── ProgressChart.tsx # Gráfica Recharts peso máximo
│
├── lib/
│   ├── supabase-client.ts    # Cliente browser
│   ├── supabase-server.ts    # Cliente server (SSR)
│   └── db.ts                 # Todas las queries DB
│
├── locales/
│   ├── en.json               # Traducciones al inglés
│   └── es.json               # Traducciones al español
│
├── contexts/                 # React Contexts (i18n, etc)
├── hooks/                    # Custom Hooks
│
├── types/
│   └── index.ts              # TypeScript interfaces
│
├── middleware.ts              # Auth guard rutas & i18n
├── supabase-schema.sql        # SQL completo para Supabase
├── .env.example               # Plantilla variables entorno
├── next.config.js             # Config Next.js + PWA
├── tailwind.config.js         # Tema Tailwind personalizado
└── vercel.json                # Config deploy Vercel
```

---

## Funcionalidades

### ✅ Implementadas

- **Internacionalización (i18n)**: Soporte bilingüe completo (Español / Inglés) detectado automáticamente.
- **Plantillas de rutinas**: Crea y guarda tus entrenamientos habituales para empezar rápido.
- **Auth completa**: Login / Registro / Logout con Supabase Auth
- **Entreno del día**: Crea automáticamente la sesión con la fecha
- **Nombre de rutina**: Editable inline
- **Ejercicios**: Añadir con autocompletado de nombres anteriores
- **Grupos musculares**: Chips de selección rápida con colores
- **Series rápidas**: Input peso × reps + RIR opcional
- **Eliminación**: Ejercicios y series con confirmación
- **Stats en tiempo real**: Nº ejercicios, series y volumen total
- **Duplicar entreno**: Copia la última sesión al día de hoy
- **Historial**: Lista de sesiones expandibles con detalle
- **Progresión**: Gráfica de evolución por ejercicio (área + puntos)
- **Timer descanso**: FAB flotante con presentes (1', 1:30', 2', 3'), vibración al acabar
- **PWA**: Instalable en móvil, manifest configurado, service worker con cache
- **Mobile first**: Touch targets grandes, inputs numéricos con teclado numérico, sin zoom

### 🔧 Para ampliar fácilmente

- **Notificaciones push**: Supabase Edge Functions + Web Push API
- **Modo offline completo**: Ampliar workbox en `next.config.js`
- **Compartir entreno**: Página pública con slug único
- **Peso corporal**: Nueva tabla `body_weight` con gráfica

---

## Autenticación y seguridad

- Row Level Security (RLS) activado en las 3 tablas
- Cada usuario **solo accede a sus propios datos** — garantizado a nivel DB
- Middleware Next.js redirige rutas protegidas si no hay sesión activa
- Tokens manejados automáticamente por `@supabase/ssr`

---

## PWA — Instalación en móvil

1. Abre la app en Chrome (Android) o Safari (iOS)
2. Android: menú ⋮ → "Añadir a pantalla de inicio"
3. iOS: botón compartir → "Añadir a pantalla de inicio"

El service worker cachea los assets estáticos para carga instantánea.
