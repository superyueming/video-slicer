ALTER TABLE `video_jobs` ADD `step` enum('uploaded','audio_extracted','transcribed','analyzed','completed') DEFAULT 'uploaded';--> statement-breakpoint
ALTER TABLE `video_jobs` ADD `audio_url` text;--> statement-breakpoint
ALTER TABLE `video_jobs` ADD `audio_key` text;