interface ImportMetaEnv {
  readonly VITE_GEMINI_KEY: string
  readonly VITE_OPENROUTER_KEY: string
  readonly VITE_GROQ_KEY: string
  readonly VITE_ALIBABA_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}