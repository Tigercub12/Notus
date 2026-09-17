interface CloudflareEnv {
  DB: D1Database;
  R2_BUCKET?: any; // R2 might be disabled
  AUTH_SECRET?: string;
  AUTH_URL?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
}
