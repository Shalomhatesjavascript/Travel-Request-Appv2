import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * PostgreSQL Connection Pool
 * 
 * A "pool" is a collection of reusable database connections.
 * Instead of creating a new connection for each query (slow),
 * we reuse connections from the pool (fast and efficient).
 * 
 * The Pool will:
 * - Create connections as needed
 * - Reuse idle connections
 * - Close connections when not needed
 * - Handle connection errors gracefully
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  
  // Maximum number of clients in the pool
  max: 20,
  
  // How long to wait for a connection before timing out (30 seconds)
  connectionTimeoutMillis: 30000,
  
  // How long a client can be idle before being closed (10 minutes)
  idleTimeoutMillis: 600000,
});

/**
 * Test Database Connection
 * 
 * This function attempts to connect to the database
 * and logs success or failure.
 */
export const testConnection = async (): Promise<void> => {
  try {
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    
    // Test query to verify connection works
    const result = await client.query('SELECT NOW()');
    console.log('📅 Database time:', result.rows[0].now);
    
    // Release the client back to the pool
    client.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1); // Exit the application if database connection fails
  }
};

/**
 * Execute a Query
 * 
 * This is a helper function that:
 * 1. Gets a client from the pool
 * 2. Executes the query
 * 3. Returns the results
 * 4. Automatically releases the client back to the pool
 * 
 * @param text - SQL query string
 * @param params - Array of parameters for the query (prevents SQL injection)
 * @returns Query result
 */
export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Log query execution time (helpful for debugging slow queries)
    console.log('📊 Query executed:', { text, duration: `${duration}ms`, rows: result.rowCount });
    
    return result;
  } catch (error) {
    console.error('❌ Query error:', { text, error });
    throw error;
  }
};

/**
 * Get a Client from Pool
 * 
 * Use this when you need to execute multiple queries
 * in a transaction (all succeed or all fail together).
 */
export const getClient = async () => {
  const client = await pool.connect();
  
  // Helper to execute queries with this specific client
  const query = (text: string, params?: any[]) => {
    return client.query(text, params);
  };
  
  // Helper to release the client back to the pool
  const release = () => {
    client.release();
  };
  
  return {
    query,
    release,
    client, // Direct access to client if needed
  };
};

/**
 * Close All Connections
 * 
 * Call this when shutting down the application
 * to cleanly close all database connections.
 */
export const closePool = async (): Promise<void> => {
  await pool.end();
  console.log('🔌 Database pool closed');
};

// Export the pool for direct access if needed
export default pool;