-- Añadir la columna email a la tabla answers si no existe
ALTER TABLE answers ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Asegurarse de que la restricción de clave foránea esté configurada correctamente
ALTER TABLE answers DROP CONSTRAINT IF EXISTS answers_question_id_fkey;
ALTER TABLE answers
ADD CONSTRAINT answers_question_id_fkey
FOREIGN KEY (question_id)
REFERENCES questions(id)
ON DELETE CASCADE;

