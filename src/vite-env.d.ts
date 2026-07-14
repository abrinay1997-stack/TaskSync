/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Google OAuth 2.0 Web Client ID used by Google Identity Services. */
  readonly VITE_GOOGLE_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
