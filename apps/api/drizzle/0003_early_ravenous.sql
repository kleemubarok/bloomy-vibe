CREATE TABLE `self_order_links` (
	`id` text PRIMARY KEY NOT NULL,
	`uuid` text NOT NULL,
	`product_id` integer NOT NULL,
	`customer_name` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`is_used` integer DEFAULT false NOT NULL,
	`expires_at` integer NOT NULL,
	`created_by` integer,
	`created_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `self_order_links_uuid_unique` ON `self_order_links` (`uuid`);--> statement-breakpoint
CREATE INDEX `self_order_links_uuid_idx` ON `self_order_links` (`uuid`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_name` text NOT NULL,
	`customer_whatsapp` text,
	`total_amount` integer DEFAULT 0 NOT NULL,
	`discount_amount` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'Antri' NOT NULL,
	`payment_status` text DEFAULT 'Pending' NOT NULL,
	`order_type` text DEFAULT 'POS' NOT NULL,
	`delivery_date` integer,
	`message_card` text,
	`sender_name` text,
	`total_hpp_snapshot` integer,
	`price_locked_at` integer,
	`is_synced` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_orders`("id", "customer_name", "customer_whatsapp", "total_amount", "discount_amount", "status", "payment_status", "order_type", "delivery_date", "message_card", "sender_name", "total_hpp_snapshot", "price_locked_at", "is_synced", "created_at", "updated_at") SELECT "id", "customer_name", "customer_whatsapp", "total_amount", "discount_amount", "status", "payment_status", "order_type", "delivery_date", "message_card", "sender_name", "total_hpp_snapshot", "price_locked_at", "is_synced", "created_at", "updated_at" FROM `orders`;--> statement-breakpoint
DROP TABLE `orders`;--> statement-breakpoint
ALTER TABLE `__new_orders` RENAME TO `orders`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `orders_whatsapp_idx` ON `orders` (`customer_whatsapp`);--> statement-breakpoint
CREATE INDEX `orders_status_idx` ON `orders` (`status`);--> statement-breakpoint
CREATE INDEX `orders_created_at_idx` ON `orders` (`created_at`);