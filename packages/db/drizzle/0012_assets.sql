CREATE TABLE `assets` (
	`id` char(26) NOT NULL,
	`book_id` char(26) NOT NULL,
	`investment_type_id` char(26) NOT NULL,
	`name` varchar(60) NOT NULL,
	`units` decimal(18,6) NOT NULL DEFAULT '0',
	`cost_basis` bigint NOT NULL DEFAULT 0,
	`current_value` bigint NOT NULL DEFAULT 0,
	`value_updated_at` datetime(3),
	`created_by` char(26) NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updated_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`deleted_at` datetime(3),
	CONSTRAINT `assets_id` PRIMARY KEY(`id`),
	CONSTRAINT `assets_cost_nonneg` CHECK(`assets`.`cost_basis` >= 0),
	CONSTRAINT `assets_value_nonneg` CHECK(`assets`.`current_value` >= 0)
);
--> statement-breakpoint
ALTER TABLE `assets` ADD CONSTRAINT `assets_book_id_books_id_fk` FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assets` ADD CONSTRAINT `assets_investment_type_id_investment_types_id_fk` FOREIGN KEY (`investment_type_id`) REFERENCES `investment_types`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `assets_book_idx` ON `assets` (`book_id`,`deleted_at`);--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `tx_asset_fk` FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON DELETE no action ON UPDATE no action;