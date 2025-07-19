/// <reference types="node" />
/// <reference types="electron" />

declare namespace NodeJS {
  interface ProcessEnv {
    VITE_DEV_SERVER_URL: string
    DIST: string
    PUBLIC: string
  }
} 