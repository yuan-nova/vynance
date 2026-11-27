CREATE TABLE `book_invitations` (
	`id` char(26) NOT NULL,
	`book_id` char(26) NOT NULL,
	`token_hash` char(64) NOT NULL,
	`expires_at` datetime(3) NOT NULL,
	`used_at` datetime(3),
	`used_by` char(26),
	`revoked_at` datetime(3),
	`created_by` char(26) NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updated_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`deleted_at` datetime(3),
	CONSTRAINT `book_invitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `book_invitations_token_uq` UNIQUE(`token_hash`)
);
--> statement-breakpoint
ALTER TABLE `book_invitations` ADD CONSTRAINT `book_invitations_book_id_books_id_fk` FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `book_invitations` ADD CONSTRAINT `book_invitations_used_by_users_id_fk` FOREIGN KEY (`used_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `book_invitations_book_expires_idx` ON `book_invitations` (`book_id`,`expires_at`);