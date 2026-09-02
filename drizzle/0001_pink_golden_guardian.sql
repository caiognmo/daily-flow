CREATE INDEX `idx_dailys_created_at` ON `dailys` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_dailys_client_location` ON `dailys` (`client`,`city`,`state`);