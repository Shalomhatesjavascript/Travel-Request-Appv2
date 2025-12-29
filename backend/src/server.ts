import dotenv from 'dotenv';
import app from './app';
import { testConnection } from './config/database';
import { runMigrations } from './config/schema';

// Load environment variables first
dotenv.config();

/**
 * Application Entry Point
 * 
 * This is where our backend application starts.
 * It will:
 * 1. Test database connection
 * 2. Run migrations to create tables
 * 3. Start the Express server
 */

const PORT = process.env.PORT || 5000;

/**
 * Initialize Application
 */
const initializeApp = async () => {
  try {
    console.log('🚀 Starting Travel Request Application Backend...\n');
    
    // Step 1: Test database connection
    console.log('📡 Testing database connection...');
    await testConnection();
    
    // Step 2: Run database migrations
    console.log('\n📦 Running database migrations...');
    await runMigrations();
    
    // Step 3: Start Express server
    console.log('\n🌐 Starting Express server...');
    
    app.listen(PORT, () => {
      console.log(`✅ Server is running on http://localhost:${PORT}`);
      console.log(`📍 API base URL: http://localhost:${PORT}/api`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      console.log('\n📚 Available endpoints:');
      console.log('   Authentication:');
      console.log('   POST   /api/auth/login');
      console.log('   POST   /api/auth/register (admin only)');
      console.log('   GET    /api/auth/me');
      console.log('   POST   /api/auth/logout');
      console.log('');
      console.log('   User Management:');
      console.log('   GET    /api/users (admin only)');
      console.log('   GET    /api/users/approvers');
      console.log('   GET    /api/users/stats (admin only)');
      console.log('   GET    /api/users/:id');
      console.log('   PUT    /api/users/:id');
      console.log('   DELETE /api/users/:id (admin only)');
      console.log('');
      console.log('   Travel Requests:');
      console.log('   POST   /api/travel-requests');
      console.log('   GET    /api/travel-requests');
      console.log('   GET    /api/travel-requests/my-requests');
      console.log('   GET    /api/travel-requests/pending-approvals');
      console.log('   GET    /api/travel-requests/stats');
      console.log('   GET    /api/travel-requests/:id');
      console.log('   PUT    /api/travel-requests/:id');
      console.log('   DELETE /api/travel-requests/:id');
      console.log('   POST   /api/travel-requests/:id/submit');
      console.log('   POST   /api/travel-requests/:id/approve');
      console.log('   POST   /api/travel-requests/:id/reject');
      console.log('   POST   /api/travel-requests/:id/cancel');
      console.log('\n✨ Backend is ready to accept requests!\n');
    });
    
  } catch (error) {
    console.error('❌ Failed to initialize application:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n⚠️  SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n⚠️  SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start the application
initializeApp();