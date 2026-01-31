CREATE TABLE `app_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`version` varchar(20) NOT NULL,
	`min_required_version` varchar(20) NOT NULL,
	`force_update` int NOT NULL DEFAULT 0,
	`enabled` int NOT NULL DEFAULT 1,
	`download_url_windows` text,
	`download_url_mac` text,
	`download_url_linux` text,
	`release_notes` text,
	`release_date` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `app_versions_id` PRIMARY KEY(`id`),
	CONSTRAINT `app_versions_version_unique` UNIQUE(`version`)
);
