-- Create trainer_courses mapping table
CREATE TABLE IF NOT EXISTS trainer_courses (
    id SERIAL PRIMARY KEY,
    trainer_id INTEGER NOT NULL REFERENCES trainer(trainer_id) ON DELETE CASCADE,
    course_id CHARACTER VARYING(15) NOT NULL REFERENCES course(course_id) ON DELETE CASCADE,
    UNIQUE(trainer_id, course_id)
);

-- Ensure trainer table has role and is_active columns if they don't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trainer' AND column_name='role') THEN
        ALTER TABLE trainer ADD COLUMN role CHARACTER VARYING(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='trainer' AND column_name='is_active') THEN
        ALTER TABLE trainer ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;
