/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_USE_MOCK_DATA: string
  readonly VITE_ENABLE_AI_FEATURES: string
  readonly VITE_ENABLE_RECOMMENDATIONS: string
  readonly VITE_GOOGLE_API_KEY: string
  readonly VITE_STRIPE_PUBLIC_KEY: string
  readonly DEV: boolean
  readonly PROD: boolean
  readonly MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
