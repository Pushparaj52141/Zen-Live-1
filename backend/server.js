const pool = require('./src/config/db');

// Database initialization
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        customer_name VARCHAR(255) NOT NULL,
        course_name VARCHAR(255) NOT NULL,
        rating INT CHECK (rating >= 1 AND rating <= 5) NOT NULL,
        review_text TEXT,
        review_date DATE NOT NULL,
        source VARCHAR(50) DEFAULT 'manual',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      ALTER TABLE reviews ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual';
      CREATE TABLE IF NOT EXISTS google_reviews (
        id SERIAL PRIMARY KEY,
        author_name TEXT NOT NULL,
        rating INT CHECK (rating >= 1 AND rating <= 5) NOT NULL,
        review_text TEXT,
        review_time TIMESTAMP NOT NULL,
        profile_photo_url TEXT,
        relative_time_description TEXT,
        source VARCHAR(50) DEFAULT 'google',
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(author_name, review_time)
      );
      CREATE TABLE IF NOT EXISTS review_sync_log (
        id SERIAL PRIMARY KEY,
        sync_date TIMESTAMP DEFAULT NOW(),
        reviews_fetched INT DEFAULT 0,
        reviews_saved INT DEFAULT 0,
        status VARCHAR(50) NOT NULL,
        error_message TEXT,
        place_id VARCHAR(255)
      );

      CREATE TABLE IF NOT EXISTS student_enrollment_requests (
        enrollment_id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        country_code VARCHAR(10) DEFAULT '+91',
        mobile_number VARCHAR(15) NOT NULL,
        role VARCHAR(255),
        college TEXT,
        location TEXT,
        course_id TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        additional_info TEXT,
        rejection_reason TEXT,
        unit_id UUID REFERENCES unit(unit_id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processed_at TIMESTAMP,
        processed_by UUID REFERENCES users(user_id)
      );

      ALTER TABLE student_enrollment_requests ADD COLUMN IF NOT EXISTS role VARCHAR(255);
      ALTER TABLE student_enrollment_requests ADD COLUMN IF NOT EXISTS college TEXT;
      ALTER TABLE student_enrollment_requests ADD COLUMN IF NOT EXISTS location TEXT;
      
      -- Change course_id to TEXT if it exists as a foreign key
      DO $$ 
      BEGIN
        ALTER TABLE student_enrollment_requests ALTER COLUMN course_id TYPE TEXT;
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END $$;

      CREATE TABLE IF NOT EXISTS trainer_enrollment_requests (
        enrollment_id SERIAL PRIMARY KEY,
        trainer_name VARCHAR(255) NOT NULL,
        trainer_email VARCHAR(255) NOT NULL,
        trainer_mobile VARCHAR(15) NOT NULL,
        specialization TEXT,
        experience_years INTEGER,
        bio TEXT,
        certifications TEXT,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        rejection_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processed_at TIMESTAMP,
        processed_by UUID REFERENCES users(user_id)
      );

      CREATE INDEX IF NOT EXISTS idx_student_enrollment_status ON student_enrollment_requests(status);
      CREATE INDEX IF NOT EXISTS idx_trainer_enrollment_status ON trainer_enrollment_requests(status);
      
      -- Add new columns for enrollment features
      ALTER TABLE student_enrollment_requests ADD COLUMN IF NOT EXISTS language TEXT;
      ALTER TABLE student_enrollment_requests ADD COLUMN IF NOT EXISTS resume_url TEXT;
      ALTER TABLE student_enrollment_requests ADD COLUMN IF NOT EXISTS aadhar_card_url TEXT;
      ALTER TABLE student_enrollment_requests ADD COLUMN IF NOT EXISTS photo_url TEXT;
      ALTER TABLE student_enrollment_requests ADD COLUMN IF NOT EXISTS school_college_id VARCHAR(255);
      ALTER TABLE trainer_enrollment_requests ADD COLUMN IF NOT EXISTS language TEXT;
      ALTER TABLE trainer_enrollment_requests ADD COLUMN IF NOT EXISTS resume_url TEXT;
      ALTER TABLE trainer_enrollment_requests ADD COLUMN IF NOT EXISTS aadhar_card_url TEXT;
      ALTER TABLE trainer_enrollment_requests ADD COLUMN IF NOT EXISTS role VARCHAR(255);
      ALTER TABLE trainer_enrollment_requests ADD COLUMN IF NOT EXISTS photo_url TEXT;
      ALTER TABLE trainer_enrollment_requests ADD COLUMN IF NOT EXISTS employee_id VARCHAR(255);

      -- Accept-step columns (accept* handlers); must be UUID to match users.user_id
      DO $$
      DECLARE
        col_type text;
      BEGIN
        ALTER TABLE student_enrollment_requests ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;
        SELECT c.data_type INTO col_type
        FROM information_schema.columns c
        WHERE c.table_schema = 'public' AND c.table_name = 'student_enrollment_requests' AND c.column_name = 'accepted_by';
        IF col_type IS NULL THEN
          ALTER TABLE student_enrollment_requests ADD COLUMN accepted_by UUID REFERENCES users(user_id);
        ELSIF col_type = 'integer' THEN
          ALTER TABLE student_enrollment_requests DROP COLUMN accepted_by;
          ALTER TABLE student_enrollment_requests ADD COLUMN accepted_by UUID REFERENCES users(user_id);
        END IF;

        ALTER TABLE trainer_enrollment_requests ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;
        SELECT c.data_type INTO col_type
        FROM information_schema.columns c
        WHERE c.table_schema = 'public' AND c.table_name = 'trainer_enrollment_requests' AND c.column_name = 'accepted_by';
        IF col_type IS NULL THEN
          ALTER TABLE trainer_enrollment_requests ADD COLUMN accepted_by UUID REFERENCES users(user_id);
        ELSIF col_type = 'integer' THEN
          ALTER TABLE trainer_enrollment_requests DROP COLUMN accepted_by;
          ALTER TABLE trainer_enrollment_requests ADD COLUMN accepted_by UUID REFERENCES users(user_id);
        END IF;
      END $$;

      ALTER TABLE trainer ADD COLUMN IF NOT EXISTS role VARCHAR(255);
      ALTER TABLE trainer ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

      -- Lead Priority Migration
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='priority') THEN
          ALTER TABLE leads ADD COLUMN priority character varying(20) DEFAULT 'normal' CHECK (priority IN ('normal', 'warm', 'hot'));
        END IF;
      END $$;

      ALTER TABLE leads ADD COLUMN IF NOT EXISTS follow_up_date DATE;
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS follow_up_note TEXT;
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS follow_up_at TIMESTAMPTZ;
      CREATE INDEX IF NOT EXISTS idx_leads_follow_up_date ON leads(follow_up_date)
        WHERE follow_up_date IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_leads_follow_up_at ON leads(follow_up_at)
        WHERE follow_up_at IS NOT NULL;
      UPDATE leads SET follow_up_at = follow_up_date::timestamp
        WHERE follow_up_date IS NOT NULL AND follow_up_at IS NULL;
    `);
    console.log('✅ Reviews tables verified/created');
  } catch (err) {
    console.error('❌ Error initializing reviews tables:', err.message);
  }
}

initDB();

const app = require("./src/app");
const PORT = process.env.PORT || 3000
const swaggerUi = require('swagger-ui-express');
const swaggerFile = require('./swagger-output.json');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));



app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const cron = require('node-cron');
const imageHandler = require('./src/utils/imageHandler');
const reviewsCron = require('./src/cron/reviewsCron');

// Schedule daily cleanup of old images (older than 30 days) at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('Running daily image cleanup task...');
  try {
    await imageHandler.cleanupOldImages(30);
  } catch (err) {
    console.error('Error in daily image cleanup:', err);
  }
});

// Run cleanup once on server startup
imageHandler.cleanupOldImages(30).catch(err => console.error('Startup cleanup error:', err));

// Initialize Google Reviews cron job
reviewsCron.scheduleReviewsSync();


