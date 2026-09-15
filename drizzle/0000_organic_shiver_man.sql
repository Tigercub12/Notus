CREATE TABLE `attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`note_id` text NOT NULL,
	`r2_key` text NOT NULL,
	`file_name` text NOT NULL,
	`mime_type` text,
	`size_bytes` integer,
	`created_at` integer DEFAULT (strftime('%s', 'now')),
	FOREIGN KEY (`note_id`) REFERENCES `notes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`event_date` text NOT NULL,
	`end_date` text,
	`recurrence_rule` text,
	`is_notified` integer DEFAULT 0 NOT NULL,
	`note_id` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')),
	`updated_at` integer DEFAULT (strftime('%s', 'now')),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`note_id`) REFERENCES `notes`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `note_tags` (
	`note_id` text NOT NULL,
	`tag_id` text NOT NULL,
	PRIMARY KEY(`note_id`, `tag_id`),
	FOREIGN KEY (`note_id`) REFERENCES `notes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `notes` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`is_pinned` integer DEFAULT 0 NOT NULL,
	`is_archived` integer DEFAULT 0 NOT NULL,
	`canvas_image_url` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')),
	`updated_at` integer DEFAULT (strftime('%s', 'now')),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`color` text DEFAULT '#000000',
	`created_at` integer DEFAULT (strftime('%s', 'now')),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text,
	`full_name` text,
	`avatar_url` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')),
	`updated_at` integer DEFAULT (strftime('%s', 'now'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);