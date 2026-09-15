CREATE TABLE `activity_events` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`action` text NOT NULL,
	`report_id` text DEFAULT '' NOT NULL,
	`client` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_activity_time` ON `activity_events` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_activity_user_action_report_time` ON `activity_events` (`email`,`action`,`report_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_activity_report_time` ON `activity_events` (`report_id`,`created_at`);