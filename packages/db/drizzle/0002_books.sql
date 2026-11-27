CREATE TABLE `activity_logs` (
	`id` char(26) NOT NULL,
	`book_id` char(26) NOT NULL,
	`actor_id` char(26) NOT NULL,
	`action` varchar(40) NOT NULL,
	`entity_type` varchar(40) NOT NULL,
	`entity_id` char(26),
	`summary` json,
	`created_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	CONSTRAINT `activity_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `book_members` (
	`id` char(26) NOT NULL,
	`book_id` char(26) NOT NULL,
	`user_id` char(26) NOT NULL,
	`joined_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`left_at` datetime(3),
	`created_by` char(26) NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updated_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`deleted_at` datetime(3),
	CONSTRAINT `book_members_id` PRIMARY KEY(`id`),
	CONSTRAINT `book_members_book_user_uq` UNIQUE(`book_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `book_settings` (
	`book_id` char(26) NOT NULL,
	`passive_income_target_bp` int NOT NULL DEFAULT 3000,
	`education_inflation_bp` int NOT NULL DEFAULT 1200,
	`budget_alert_enabled` boolean NOT NULL DEFAULT true,
	`created_by` char(26) NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updated_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`deleted_at` datetime(3),
	CONSTRAINT `book_settings_book_id` PRIMARY KEY(`book_id`)
);
--> statement-breakpoint
CREATE TABLE `books` (
	`id` char(26) NOT NULL,
	`code` char(8) NOT NULL,
	`name` varchar(40) NOT NULL,
	`purge_after` datetime(3),
	`created_by` char(26) NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updated_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`deleted_at` datetime(3),
	CONSTRAINT `books_id` PRIMARY KEY(`id`),
	CONSTRAINT `books_code_uq` UNIQUE(`code`)
);
--> statement-breakpoint
ALTER TABLE `activity_logs` ADD CONSTRAINT `activity_logs_book_id_books_id_fk` FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activity_logs` ADD CONSTRAINT `activity_logs_actor_id_users_id_fk` FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `book_members` ADD CONSTRAINT `book_members_book_id_books_id_fk` FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `book_members` ADD CONSTRAINT `book_members_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `book_settings` ADD CONSTRAINT `book_settings_book_id_books_id_fk` FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `activity_logs_book_created_idx` ON `activity_logs` (`book_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `book_members_user_left_idx` ON `book_members` (`user_id`,`left_at`);