CREATE TABLE `investment_types` (
	`id` char(26) NOT NULL,
	`book_id` char(26) NOT NULL,
	`name` varchar(40) NOT NULL,
	`icon` varchar(32) NOT NULL,
	`target_value` bigint,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_by` char(26) NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updated_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`deleted_at` datetime(3),
	CONSTRAINT `investment_types_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `onboarded_at` datetime(3);--> statement-breakpoint
ALTER TABLE `investment_types` ADD CONSTRAINT `investment_types_book_id_books_id_fk` FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `investment_types_book_idx` ON `investment_types` (`book_id`,`sort_order`);