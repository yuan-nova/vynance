CREATE TABLE `monthly_plans` (
	`id` char(26) NOT NULL,
	`book_id` char(26) NOT NULL,
	`month` char(7) NOT NULL,
	`spending_cap` bigint,
	`default_wallet_id` char(26),
	`method` enum('custom','50_30_20','60_20_20','70_10_20','fixed') NOT NULL DEFAULT 'custom',
	`version` int NOT NULL DEFAULT 1,
	`updated_by` char(26),
	`created_by` char(26) NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updated_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`deleted_at` datetime(3),
	CONSTRAINT `monthly_plans_id` PRIMARY KEY(`id`),
	CONSTRAINT `monthly_plans_book_month_uq` UNIQUE(`book_id`,`month`)
);
--> statement-breakpoint
CREATE TABLE `plan_allocations` (
	`id` char(26) NOT NULL,
	`book_id` char(26) NOT NULL,
	`plan_id` char(26) NOT NULL,
	`kind` enum('expense','investment') NOT NULL,
	`category_id` char(26),
	`investment_type_id` char(26),
	`mode` enum('amount','percent') NOT NULL DEFAULT 'amount',
	`amount` bigint NOT NULL DEFAULT 0,
	`percent_bp` int NOT NULL DEFAULT 0,
	`carried_over` bigint NOT NULL DEFAULT 0,
	`created_by` char(26) NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updated_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`deleted_at` datetime(3),
	CONSTRAINT `plan_allocations_id` PRIMARY KEY(`id`),
	CONSTRAINT `plan_alloc_target` CHECK((`plan_allocations`.`kind` = 'expense' AND `plan_allocations`.`category_id` IS NOT NULL AND `plan_allocations`.`investment_type_id` IS NULL) OR (`plan_allocations`.`kind` = 'investment' AND `plan_allocations`.`investment_type_id` IS NOT NULL AND `plan_allocations`.`category_id` IS NULL))
);
--> statement-breakpoint
CREATE TABLE `plan_incomes` (
	`id` char(26) NOT NULL,
	`book_id` char(26) NOT NULL,
	`plan_id` char(26) NOT NULL,
	`name` varchar(60) NOT NULL,
	`amount` bigint NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_by` char(26) NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updated_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`deleted_at` datetime(3),
	CONSTRAINT `plan_incomes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `monthly_plans` ADD CONSTRAINT `monthly_plans_book_id_books_id_fk` FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `monthly_plans` ADD CONSTRAINT `monthly_plans_default_wallet_id_wallets_id_fk` FOREIGN KEY (`default_wallet_id`) REFERENCES `wallets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `plan_allocations` ADD CONSTRAINT `plan_allocations_book_id_books_id_fk` FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `plan_allocations` ADD CONSTRAINT `plan_allocations_plan_id_monthly_plans_id_fk` FOREIGN KEY (`plan_id`) REFERENCES `monthly_plans`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `plan_allocations` ADD CONSTRAINT `plan_allocations_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `plan_allocations` ADD CONSTRAINT `plan_allocations_investment_type_id_investment_types_id_fk` FOREIGN KEY (`investment_type_id`) REFERENCES `investment_types`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `plan_incomes` ADD CONSTRAINT `plan_incomes_book_id_books_id_fk` FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `plan_incomes` ADD CONSTRAINT `plan_incomes_plan_id_monthly_plans_id_fk` FOREIGN KEY (`plan_id`) REFERENCES `monthly_plans`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `plan_alloc_plan_idx` ON `plan_allocations` (`book_id`,`plan_id`);--> statement-breakpoint
CREATE INDEX `plan_alloc_category_idx` ON `plan_allocations` (`book_id`,`category_id`);--> statement-breakpoint
CREATE INDEX `plan_incomes_plan_idx` ON `plan_incomes` (`book_id`,`plan_id`);