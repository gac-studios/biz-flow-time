-- Migration to fix appointments status values and constraints

-- 1. Update legacy values to new internal values
UPDATE appointments SET status = 'scheduled' WHERE status = 'Agendado';
UPDATE appointments SET status = 'confirmed' WHERE status = 'Confirmado';
UPDATE appointments SET status = 'in_progress' WHERE status = 'Em andamento';
UPDATE appointments SET status = 'done' WHERE status = 'Concluído';
UPDATE appointments SET status = 'canceled' WHERE status = 'Cancelado';
UPDATE appointments SET status = 'no_show' WHERE status = 'Não compareceu';

-- 2. Drop the existing check constraint
-- Note: The constraint name might vary, trying common patterns
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments__status__check;
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;

-- 3. Add the new check constraint with strict internal values
ALTER TABLE appointments 
ADD CONSTRAINT appointments_status_check 
CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'done', 'canceled', 'no_show'));

-- 4. Ensure the default value is 'scheduled'
ALTER TABLE appointments ALTER COLUMN status SET DEFAULT 'scheduled';
