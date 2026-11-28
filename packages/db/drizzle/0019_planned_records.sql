CREATE TABLE `planned_records` (
	`id` char(26) NOT NULL,
	`book_id` char(26) NOT NULL,
	`source_type` enum('income','subscription') NOT NULL,
	`source_id` char(26) NOT NULL,
	`period` char(7) NOT NULL,
	`status` enum('realized','skipped') NOT NULL,
	`transaction_id` char(26),
	`attempt` int NOT NULL DEFAULT 0,
	`created_by` char(26) NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updated_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`deleted_at` datetime(3),
	CONSTRAINT `planned_records_id` PRIMARY KEY(`id`),
	CONSTRAINT `planned_records_uq` UNIQUE(`book_id`,`source_type`,`source_id`,`period`)
);
--> statement-breakpoint
ALTER TABLE `planned_records` ADD CONSTRAINT `planned_records_book_id_books_id_fk` FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `planned_records_book_period_idx` ON `planned_records` (`book_id`,`period`);