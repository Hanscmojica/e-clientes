-- AlterTable
ALTER TABLE `bp_01_usuario` 
ADD COLUMN `dFechaUltimoCambioPass` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- Update existing records
UPDATE `bp_01_usuario` 
SET `dFechaUltimoCambioPass` = `dFechaCreacion` 
WHERE `dFechaUltimoCambioPass` IS NULL; 