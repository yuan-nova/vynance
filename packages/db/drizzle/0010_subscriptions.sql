CREATE TABLE `reference_rates` (
	`id` char(26) NOT NULL,
	`kind` enum('gold_gram','fx') NOT NULL,
	`currency` char(3) NOT NULL,
	`value` decimal(18,6) NOT NULL,
	`fetched_at` datetime(3) NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	CONSTRAINT `reference_rates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` char(26) NOT NULL,
	`book_id` char(26) NOT NULL,
	`name` varchar(60) NOT NULL,
	`service_key` varchar(32),
	`currency` char(3) NOT NULL DEFAULT 'IDR',
	`original_amount` decimal(18,6) NOT NULL,
	`fx_rate` decimal(18,6),
	`amount_idr` bigint NOT NULL,
	`cycle` enum('monthly','yearly') NOT NULL,
	`billing_day` int NOT NULL,
	`billing_month` int,
	`wallet_id` char(26) NOT NULL,
	`category_id` char(26),
	`start_date` date NOT NULL,
	`paused_at` datetime(3),
	`created_by` char(26) NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updated_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`deleted_at` datetime(3),
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscriptions_day` CHECK(`subscriptions`.`billing_day` between 1 and 31),
	CONSTRAINT `subscriptions_month` CHECK(`subscriptions`.`billing_month` is null or `subscriptions`.`billing_month` between 1 and 12),
	CONSTRAINT `subscriptions_amount_pos` CHECK(`subscriptions`.`amount_idr` > 0)
);
--> statement-breakpoint
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_book_id_books_id_fk` FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_wallet_id_wallets_id_fk` FOREIGN KEY (`wallet_id`) REFERENCES `wallets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `reference_rates_kind_currency_idx` ON `reference_rates` (`kind`,`currency`,`fetched_at`);--> statement-breakpoint
CREATE INDEX `subscriptions_book_idx` ON `subscriptions` (`book_id`,`deleted_at`);--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `tx_subscription_fk` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON DELETE no action ON UPDATE no action;