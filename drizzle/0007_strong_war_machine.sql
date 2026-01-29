ALTER TABLE `upload_sessions` MODIFY COLUMN `uploaded_chunks` json NOT NULL;--> statement-breakpoint
ALTER TABLE `upload_sessions` MODIFY COLUMN `s3_parts` json;