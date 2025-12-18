import 'dotenv/config';

import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is required');
}

// Neon Local (Docker) support
// When using the Neon serverless driver against Neon Local, you must route queries
// through the local HTTP endpoint (/sql). We auto-detect common Neon Local hosts.
try {
  const url = new URL(DATABASE_URL);
  const host = url.hostname;
  const port = url.port || '5432';

  if (['neon-local', 'localhost', '127.0.0.1'].includes(host)) {
    neonConfig.fetchEndpoint = `http://${host}:${port}/sql`;
    neonConfig.useSecureWebSocket = false;
    neonConfig.poolQueryViaFetch = true;
  }
} catch {
  // Ignore parse issues and let the driver surface a connection error.
}

const sql = neon(DATABASE_URL);
const db = drizzle(sql);

export { db, sql };
