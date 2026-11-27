CREATE TABLE `payslips` (
	`id` char(26) NOT NULL,
	`book_id` char(26) NOT NULL,
	`period` char(7) NOT NULL,
	`gross` bigint NOT NULL,
	`deductions` bigint NOT NULL,
	`net` bigint NOT NULL,
	`file_key` varchar(200),
	`created_by` char(26) NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updated_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`deleted_at` datetime(3),
	CONSTRAINT `payslips_id` PRIMARY KEY(`id`),
	CONSTRAINT `payslips_amounts_nonneg` CHECK(`payslips`.`gross` > 0 and `payslips`.`deductions` >= 0 and `payslips`.`net` > 0)
);
--> statement-breakpoint
ALTER TABLE `payslips` ADD CONSTRAINT `payslips_book_id_books_id_fk` FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `payslips_book_period_idx` ON `payslips` (`book_id`,`deleted_at`,`period`);