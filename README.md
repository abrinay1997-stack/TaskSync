# TaskSync

PWA de gestión de tareas, contenido y cronogramas para agencias de marketing.
Funciona **100% offline** (los datos viven en el navegador vía IndexedDB) e
integra **IA generativa con Groq** para planificar contenido, redactar captions
y dar consejos de productividad. La sincronización con Google Calendar es
opcional (requiere login con Google).

## Características

- **Dashboard tipo bento** con KPIs, tareas del día, vencimientos y progreso semanal.
- **Tareas** con prioridad, plataformas, recurrencia (diaria/semanal) y vinculación a cuentas/clientes.
- **Cronograma** vista semana / mes.
- **Mesa de contenido (Master)**: CRUD de piezas (post / reel / carrusel) por cliente y mes, con portadas, generación de caption por IA y exportación a PDF de aprobación.
- **Cuentas internas y externas (clientes)** con informes por cliente y KPIs.
- **Kit de agencia con IA (Groq · Llama 3.3 70B)**:
  - `Advisor`: consejos de productividad a partir de tus tareas.
  - `CaptionGenerator`: copy + hashtags para Meta Business Suite / TikTok.
  - `AITaskPlanner`: plan de contenido de 5 etapas que se convierte en tareas.
- **PWA instalable** (offline-first) con service worker y manifest completos.
- **Sincronización opcional con Google Calendar** (login con Google, OAuth 2.0).
- **Importar / exportar proyecto** en JSON para respaldo o migración entre dispositivos.

## Stack técnico

| Capa | Tecnología |
|------|------------|
| Frontend | React 19, Vite 6, TypeScript 5.8 |
| Estilos | Tailwind CSS v4 |
| Animaciones | `motion` (Framer Motion) |
| Iconos | `lucide-react` |
| Gráficos | `recharts` |
| Persistencia local | `dexie` + `dexie-react-hooks` (IndexedDB) |
| IA | `groq-sdk` (modelo `llama-3.3-70b-versatile`) |
| PDF | `jspdf` + `jspdf-autotable` |
| Fechas | `date-fns` |
| Auth + Calendar | Google Identity Services (OAuth 2.0) + Google Calendar REST API |
| Backend | Express (desarrollo) / Netlify Functions (producción) |
| Deploy | Netlify |

## Requisitos previos

- **Node.js** (recomendado v20+).
- Una **API key de Groq** para las funciones de IA. Consíguela en
  https://console.groq.com/keys.
- *(Opcional)* Un **OAuth Client ID de Google** si quieres habilitar el login y
  la sincronización con Google Calendar. Créalo en
  https://console.cloud.google.com/apis/credentials (tipo "Aplicación web") y
  añade tus orígenes autorizados (`http://localhost:3000` y tu URL de Netlify).

## Puesta en marcha (desarrollo)

1. Instala dependencias:
   ```bash
   npm install
   ```
2. Crea `.env.local` a partir de las variables que necesites:
   ```bash
   # Obligatoria para las funciones de IA (server-side, no se expone al navegador)
   GROQ_API_KEY=tu_api_key_de_groq

   # Opcional — solo para login con Google y sync de Calendar (pública, va al bundle)
   VITE_GOOGLE_CLIENT_ID=tu_client_id_de_google
   ```
3. Arranca el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   La app queda en `http://localhost:3000`.

> La aplicación funciona sin `VITE_GOOGLE_CLIENT_ID`: el login y la
> sincronización con Calendar se desactivan, pero el resto (tareas, contenido,
> IA) opera con normalidad en modo offline.

## Scripts

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor de desarrollo (Express + Vite en middleware mode) en `:3000`. |
| `npm run build` | Build de cliente (`vite build`) + empaquetado de `server.ts` a `dist/server.cjs` (para self-hosting). |
| `npm run build:client` | Solo el build del cliente. Es el que usa Netlify. |
| `npm start` | Ejecuta `dist/server.cjs` (tras `npm run build`) para self-hosting. |
| `npm run preview` | Sirve el build de cliente con Vite (sin backend de IA). |
| `npm run lint` | Type-check con `tsc --noEmit`. |
| `npm run clean` | Borra `dist` y artefactos de build. |

## Estructura del proyecto

```
.
├── index.html
├── server.ts                 # Express de desarrollo: proxy server-side a Groq
├── vite.config.ts            # Vite + Tailwind + PWA
├── netlify.toml              # Build, functions y redirects de Netlify
├── firebase-applet-config.json   # (residual de AI Studio — no se usa en runtime)
├── src/
│   ├── App.tsx               # Raíz: navegación por pestañas
│   ├── main.tsx
│   ├── types.ts              # Modelos: Task, Account, ContentItem, User
│   ├── index.css
│   ├── components/
│   │   ├── layout/           # Header, MobileMenu, MobileTabs, ExportMenu, AmbientBackground
│   │   ├── dashboard/        # BentoGrid, AIAdvisor, AIToolsPanel, CaptionGenerator, StatsRow, cards/
│   │   ├── accounts/         # AccountsManager, AITaskPlanner, listas, ClientReportCard
│   │   ├── master/           # MasterView (mesa de contenido)
│   │   ├── schedule/         # ScheduleView (cronograma semana/mes)
│   │   ├── tasks/            # TaskItem
│   │   ├── Login.tsx
│   │   ├── TaskForm.tsx / TaskList.tsx / WeeklyProgress.tsx
│   ├── hooks/                # useTasks, useAccounts, useContent (Dexie useLiveQuery)
│   └── lib/                  # db (Dexie), auth, calendar, projectIO, export, contentPdf, media
├── shared/                   # Lógica IA compartida cliente/server
│   ├── advisor.ts
│   ├── captionGenerator.ts
│   └── taskPlanner.ts
├── netlify/functions/        # Endpoints serverless (producción)
│   ├── advisor.mts
│   ├── generate-caption.mts
│   └── generate-tasks.mts
└── public/                   # Iconos PWA, favicon
```

## Cómo funciona la IA

La lógica de los prompts y el parseo vive en `shared/` y la consumen **tanto el
servidor Express de desarrollo como las Netlify Functions de producción**, para
evitar divergencia entre entornos. El navegador **nunca** llama directamente a la
API de Groq: siempre lo hace a través de `/api/advisor`, `/api/generate-tasks` y
`/api/generate-caption`, que en dev los resuelve Express y en prod los
Netlify redirects (`netlify.toml`).

La `GROQ_API_KEY` es estrictamente **server-side**: se lee de variables de
entorno y nunca se incluye en el bundle del navegador.

## Despliegue en Netlify

El proyecto está preparado para Netlify:

- **Build command:** `npm run build:client`
- **Publish directory:** `dist`
- **Functions:** `netlify/functions` (bundler `esbuild`)
- **Redirects:** `/api/*` → `/.netlify/functions/*` (rewrite) y SPA fallback `/*` → `/index.html`.

Configura las variables de entorno `GROQ_API_KEY` y (opcional)
`VITE_GOOGLE_CLIENT_ID` en el panel de Netlify (Site settings → Environment).

## Servicios externos

- **Groq API** — único proveedor de IA (LLM Llama 3.3 70B).
- **Google Identity Services / OAuth 2.0** — login (opcional).
- **Google Calendar API** — sincronización unidireccional de tareas (opcional).
- **Google Fonts** — tipografías Hanken Grotesk y JetBrains Mono.

## Notas y limitaciones

- Los datos se guardan **localmente en IndexedDB**, por navegador y dispositivo.
  No hay sincronización en la nube: usa el export/import de proyecto para
  respaldar o migrar.
- La sincronización con Google Calendar es **unidireccional** (push): los cambios
  hechos directamente en Google Calendar no se reflejan en la app.
- El login de Google usa un flujo de token implícito: la sesión dura ~1 hora y
  debe renovarse volviendo a iniciar sesión.
