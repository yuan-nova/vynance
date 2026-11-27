CREATE TABLE `transactions` (
	`id` char(26) NOT NULL,
	`book_id` char(26) NOT NULL,
	`type` enum('income','expense','transfer','asset_buy','asset_sell') NOT NULL,
	`amount` bigint NOT NULL,
	`tx_date` date NOT NULL,
	`wallet_id` char(26) NOT NULL,
	`to_wallet_id` char(26),
	`category_id` char(26),
	`asset_id` char(26),
	`note` varchar(200),
	`source` enum('manual','subscription','scan') NOT NULL DEFAULT 'manual',
	`subscription_id` char(26),
	`subscription_period` char(7),
	`idempotency_key` varchar(64),
	`created_by` char(26) NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updated_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`deleted_at` datetime(3),
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `tx_book_idem_uq` UNIQUE(`book_id`,`idempotency_key`),
	CONSTRAINT `tx_subscription_period_uq` UNIQUE(`subscription_id`,`subscription_period`),
	CONSTRAINT `tx_amount_positive` CHECK(`transactions`.`amount` > 0),
	CONSTRAINT `tx_transfer_wallets` CHECK(`transactions`.`type` <> 'transfer' OR (`transactions`.`to_wallet_id` IS NOT NULL AND `transactions`.`to_wallet_id` <> `transactions`.`wallet_id`))
);
--> statement-breakpoint
CREATE TABLE `wallets` (
	`id` char(26) NOT NULL,
	`book_id` char(26) NOT NULL,
	`name` varchar(40) NOT NULL,
	`type` enum('bank','ewallet','cash','credit_card','paylater','rdn') NOT NULL,
	`icon` varchar(32) NOT NULL,
	`opening_balance` bigint NOT NULL DEFAULT 0,
	`credit_limit` bigint,
	`archived_at` datetime(3),
	`created_by` char(26) NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updated_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`deleted_at` datetime(3),
	CONSTRAINT `wallets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_book_id_books_id_fk` FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_wallet_id_wallets_id_fk` FOREIGN KEY (`wallet_id`) REFERENCES `wallets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_to_wallet_id_wallets_id_fk` FOREIGN KEY (`to_wallet_id`) REFERENCES `wallets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `wallets` ADD CONSTRAINT `wallets_book_id_books_id_fk` FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `tx_book_date_idx` ON `transactions` (`book_id`,`tx_date`,`id`);--> statement-breakpoint
CREATE INDEX `tx_book_wallet_date_idx` ON `transactions` (`book_id`,`wallet_id`,`tx_date`);--> statement-breakpoint
CREATE INDEX `tx_book_to_wallet_idx` ON `transactions` (`book_id`,`to_wallet_id`);--> statement-breakpoint
CREATE INDEX `tx_book_category_date_idx` ON `transactions` (`book_id`,`category_id`,`tx_date`);--> statement-breakpoint
CREATE INDEX `wallets_book_idx` ON `wallets` (`book_id`,`deleted_at`);