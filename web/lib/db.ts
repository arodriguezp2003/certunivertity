import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log("Executed query", { text, duration, rows: res.rowCount });
  return res;
}

export async function getClient() {
  const client = await pool.connect();
  return client;
}

// Initialize database schema
export async function initDatabase() {
  const client = await getClient();

  try {
    await client.query("BEGIN");

    // Create universities table
    await client.query(`
      CREATE TABLE IF NOT EXISTS universities (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        wallet_address VARCHAR(42) UNIQUE NOT NULL,
        credits INTEGER DEFAULT 0,
        has_free_tokens_claimed BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create certificates table
    await client.query(`
      CREATE TABLE IF NOT EXISTS certificates (
        id SERIAL PRIMARY KEY,
        cert_id VARCHAR(66) UNIQUE NOT NULL,
        university_id INTEGER REFERENCES universities(id) ON DELETE CASCADE,
        student_name VARCHAR(255) NOT NULL,
        student_email VARCHAR(255) NOT NULL,
        certificate_name VARCHAR(255) NOT NULL,
        person_name_hash VARCHAR(66) NOT NULL,
        email_hash VARCHAR(66) NOT NULL,
        issue_date BIGINT NOT NULL,
        expiration_date BIGINT DEFAULT 0,
        metadata_uri TEXT,
        tx_hash VARCHAR(66),
        valid BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_certificates_cert_id ON certificates(cert_id);
      CREATE INDEX IF NOT EXISTS idx_certificates_university_id ON certificates(university_id);
      CREATE INDEX IF NOT EXISTS idx_universities_wallet ON universities(wallet_address);
      CREATE INDEX IF NOT EXISTS idx_universities_email ON universities(email);
    `);

    await client.query("COMMIT");
    console.log("Database initialized successfully");
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("Error initializing database:", e);
    throw e;
  } finally {
    client.release();
  }
}

export default pool;
