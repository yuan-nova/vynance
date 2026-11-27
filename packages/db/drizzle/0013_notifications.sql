CREATE TABLE `budget_alerts` (
	`id` char(26) NOT NULL,
	`book_id` char(26) NOT NULL,
	`category_id` char(26) NOT NULL,
	`month` char(7) NOT NULL,
	`threshold_bp` int NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	CONSTRAINT `budget_alerts_id` PRIMARY KEY(`id`),
	CONSTRAINT `budget_alerts_uq` UNIQUE(`book_id`,`category_id`,`month`,`threshold_bp`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` char(26) NOT NULL,
	`book_id` char(26) NOT NULL,
	`user_id` char(26) NOT NULL,
	`kind` varchar(32) NOT NULL,
	`data` json NOT NULL,
	`read_at` datetime(3),
	`created_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `budget_alerts` ADD CONSTRAINT `budget_alerts_book_id_books_id_fk` FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_book_id_books_id_fk` FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `notifications_user_book_idx` ON `notifications` (`user_id`,`book_id`,`created_at`);