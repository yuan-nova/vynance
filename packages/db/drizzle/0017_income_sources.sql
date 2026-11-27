CREATE TABLE `income_sources` (
	`id` char(26) NOT NULL,
	`book_id` char(26) NOT NULL,
	`name` varchar(60) NOT NULL,
	`kind` enum('active','passive') NOT NULL,
	`category_id` char(26),
	`monthly_amount` bigint NOT NULL,
	`is_recurring` boolean NOT NULL DEFAULT true,
	`created_by` char(26) NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updated_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`deleted_at` datetime(3),
	CONSTRAINT `income_sources_id` PRIMARY KEY(`id`),
	CONSTRAINT `income_sources_amount_pos` CHECK(`income_sources`.`monthly_amount` > 0)
);
--> statement-breakpoint
ALTER TABLE `income_sources` ADD CONSTRAINT `income_sources_book_id_books_id_fk` FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `income_sources` ADD CONSTRAINT `income_sources_category_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `income_sources_book_idx` ON `income_sources` (`book_id`,`deleted_at`);