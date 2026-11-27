CREATE TABLE `children` (
	`id` char(26) NOT NULL,
	`book_id` char(26) NOT NULL,
	`name` varchar(60) NOT NULL,
	`birth_year` smallint NOT NULL,
	`education_savings` bigint NOT NULL DEFAULT 0,
	`created_by` char(26) NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updated_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`deleted_at` datetime(3),
	CONSTRAINT `children_id` PRIMARY KEY(`id`),
	CONSTRAINT `children_savings_nonneg` CHECK(`children`.`education_savings` >= 0)
);
--> statement-breakpoint
ALTER TABLE `children` ADD CONSTRAINT `children_book_id_books_id_fk` FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `children_book_idx` ON `children` (`book_id`,`deleted_at`);