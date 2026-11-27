CREATE TABLE `categories` (
	`id` char(26) NOT NULL,
	`book_id` char(26) NOT NULL,
	`name` varchar(40) NOT NULL,
	`kind` enum('income','expense') NOT NULL,
	`budget_group` enum('needs','wants','savings'),
	`icon` varchar(32) NOT NULL,
	`monthly_budget` bigint,
	`sort_order` int NOT NULL DEFAULT 0,
	`archived_at` datetime(3),
	`created_by` char(26) NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updated_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`deleted_at` datetime(3),
	CONSTRAINT `categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `categories` ADD CONSTRAINT `categories_book_id_books_id_fk` FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `categories_book_kind_order_idx` ON `categories` (`book_id`,`kind`,`sort_order`);--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `tx_category_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE no action ON UPDATE no action;