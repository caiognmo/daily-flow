CREATE TABLE `dailys` (
	`id` text PRIMARY KEY NOT NULL,
	`client` text NOT NULL,
	`city` text DEFAULT '' NOT NULL,
	`state` text DEFAULT '' NOT NULL,
	`plan` text DEFAULT '' NOT NULL,
	`end_date` text DEFAULT '' NOT NULL,
	`payload` text NOT NULL,
	`audio_key` text,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `permissions` (
	`email` text PRIMARY KEY NOT NULL,
	`can_edit` integer DEFAULT false NOT NULL,
	`can_delete` integer DEFAULT false NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`updated_at` integer NOT NULL
);
