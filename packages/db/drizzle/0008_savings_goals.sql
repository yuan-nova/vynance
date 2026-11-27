CREATE TABLE `goal_contributions` (
	`id` char(26) NOT NULL,
	`book_id` char(26) NOT NULL,
	`goal_id` char(26) NOT NULL,
	`amount` bigint NOT NULL,
	`contributed_on` date NOT NULL,
	`transaction_id` char(26),
	`created_by` char(26) NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updated_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`deleted_at` datetime(3),
	CONSTRAINT `goal_contributions_id` PRIMARY KEY(`id`),
	CONSTRAINT `goal_contributions_amount_pos` CHECK(`goal_contributions`.`amount` > 0)
);
--> statement-breakpoint
CREATE TABLE `savings_goals` (
	`id` char(26) NOT NULL,
	`book_id` char(26) NOT NULL,
	`name` varchar(60) NOT NULL,
	`icon` varchar(32) NOT NULL,
	`target_amount` bigint NOT NULL,
	`initial_amount` bigint NOT NULL DEFAULT 0,
	`target_date` date,
	`wallet_id` char(26),
	`note` varchar(200),
	`created_by` char(26) NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updated_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`deleted_at` datetime(3),
	CONSTRAINT `savings_goals_id` PRIMARY KEY(`id`),
	CONSTRAINT `savings_goals_target_pos` CHECK(`savings_goals`.`target_amount` > 0),
	CONSTRAINT `savings_goals_initial_nonneg` CHECK(`savings_goals`.`initial_amount` >= 0)
);
--> statement-breakpoint
ALTER TABLE `goal_contributions` ADD CONSTRAINT `goal_contributions_book_id_books_id_fk` FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `goal_contributions` ADD CONSTRAINT `goal_contributions_goal_fk` FOREIGN KEY (`goal_id`) REFERENCES `savings_goals`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `goal_contributions` ADD CONSTRAINT `goal_contributions_tx_fk` FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `savings_goals` ADD CONSTRAINT `savings_goals_book_id_books_id_fk` FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `savings_goals` ADD CONSTRAINT `savings_goals_wallet_id_wallets_id_fk` FOREIGN KEY (`wallet_id`) REFERENCES `wallets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `goal_contributions_goal_idx` ON `goal_contributions` (`book_id`,`goal_id`,`contributed_on`);--> statement-breakpoint
CREATE INDEX `savings_goals_book_idx` ON `savings_goals` (`book_id`,`deleted_at`);