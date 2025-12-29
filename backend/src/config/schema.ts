import { query } from './database';

/**
 * Database Schema Migration
 * 
 * This file creates all necessary database tables with their
 * constraints, indexes, and relationships.
 * 
 * Run this once to set up the database structure.
 */

/**
 * Create Users Table
 */
const createUsersTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'approver', 'admin')),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createIndexes = `
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
  `;

  await query(createTableQuery);
  await query(createIndexes);
  console.log('✅ Users table created');
};

/**
 * Create Travel Requests Table
 */
const createTravelRequestsTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS travel_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      approver_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      destination VARCHAR(255) NOT NULL,
      departure_date DATE NOT NULL,
      return_date DATE NOT NULL,
      purpose TEXT NOT NULL,
      estimated_budget DECIMAL(10, 2) NOT NULL CHECK (estimated_budget > 0),
      transportation_mode VARCHAR(50),
      accommodation_details TEXT,
      additional_notes TEXT,
      status VARCHAR(20) NOT NULL DEFAULT 'draft' 
        CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'cancelled')),
      approval_comments TEXT,
      submitted_at TIMESTAMP,
      approved_rejected_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      CONSTRAINT check_dates CHECK (return_date >= departure_date),
      CONSTRAINT check_approver_not_self CHECK (user_id != approver_id)
    );
  `;

  const createIndexes = `
    CREATE INDEX IF NOT EXISTS idx_travel_requests_user_id ON travel_requests(user_id);
    CREATE INDEX IF NOT EXISTS idx_travel_requests_approver_id ON travel_requests(approver_id);
    CREATE INDEX IF NOT EXISTS idx_travel_requests_status ON travel_requests(status);
    CREATE INDEX IF NOT EXISTS idx_travel_requests_dates ON travel_requests(departure_date, return_date);
  `;

  await query(createTableQuery);
  await query(createIndexes);
  console.log('✅ Travel requests table created');
};

/**
 * Create Notification Logs Table
 */
const createNotificationLogsTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS notification_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      travel_request_id UUID NOT NULL REFERENCES travel_requests(id) ON DELETE CASCADE,
      recipient_email VARCHAR(255) NOT NULL,
      notification_type VARCHAR(50) NOT NULL 
        CHECK (notification_type IN ('submission', 'approval', 'rejection', 'cancellation')),
      sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status VARCHAR(20) NOT NULL DEFAULT 'sent' 
        CHECK (status IN ('sent', 'failed')),
      error_message TEXT
    );
  `;

  const createIndexes = `
    CREATE INDEX IF NOT EXISTS idx_notification_logs_request_id ON notification_logs(travel_request_id);
    CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);
  `;

  await query(createTableQuery);
  await query(createIndexes);
  console.log('✅ Notification logs table created');
};

/**
 * Create Update Timestamp Trigger
 * 
 * This automatically updates the "updated_at" column
 * whenever a row is modified.
 */
const createUpdateTimestampTrigger = async () => {
  // First, create the trigger function
  const createFunction = `
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `;

  // Apply trigger to users table
  const applyToUsers = `
    DROP TRIGGER IF EXISTS update_users_updated_at ON users;
    CREATE TRIGGER update_users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  `;

  // Apply trigger to travel_requests table
  const applyToTravelRequests = `
    DROP TRIGGER IF EXISTS update_travel_requests_updated_at ON travel_requests;
    CREATE TRIGGER update_travel_requests_updated_at
      BEFORE UPDATE ON travel_requests
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  `;

  await query(createFunction);
  await query(applyToUsers);
  await query(applyToTravelRequests);
  console.log('✅ Update timestamp triggers created');
};

/**
 * Insert Default Admin User
 * 
 * Creates an admin account for initial system access.
 * Default credentials:
 *   Email: admin@company.com
 *   Password: Admin@123
 * 
 * ⚠️ IMPORTANT: Change this password immediately after first login!
 */
const insertDefaultAdmin = async () => {
  const bcrypt = require('bcrypt');
  
  // Hash the default password
  const passwordHash = await bcrypt.hash('Admin@123', 10);
  
  const insertQuery = `
    INSERT INTO users (email, password_hash, first_name, last_name, role)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (email) DO NOTHING
    RETURNING id;
  `;
  
  const result = await query(insertQuery, [
    'admin@company.com',
    passwordHash,
    'System',
    'Administrator',
    'admin'
  ]);
  
  if (result.rowCount > 0) {
    console.log('✅ Default admin user created');
    console.log('📧 Email: admin@company.com');
    console.log('🔑 Password: Admin@123');
    console.log('⚠️  CHANGE THIS PASSWORD IMMEDIATELY!');
  } else {
    console.log('ℹ️  Admin user already exists');
  }
};

/**
 * Main Migration Function
 * 
 * Runs all schema creation functions in order.
 */
export const runMigrations = async () => {
  console.log('🚀 Starting database migrations...\n');
  
  try {
    await createUsersTable();
    await createTravelRequestsTable();
    await createNotificationLogsTable();
    await createUpdateTimestampTrigger();
    await insertDefaultAdmin();
    
    console.log('\n✅ All migrations completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  }
};

/**
 * Drop All Tables (USE WITH CAUTION!)
 * 
 * This function deletes all tables and data.
 * Only use during development for a fresh start.
 */
export const dropAllTables = async () => {
  console.log('⚠️  Dropping all tables...');
  
  await query('DROP TABLE IF EXISTS notification_logs CASCADE;');
  await query('DROP TABLE IF EXISTS travel_requests CASCADE;');
  await query('DROP TABLE IF EXISTS users CASCADE;');
  await query('DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;');
  
  console.log('✅ All tables dropped');
};