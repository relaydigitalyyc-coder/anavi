-- F13: Immutable audit trail — add hash chain columns
ALTER TABLE `audit_log` ADD `prevHash` varchar(64);
--> statement-breakpoint
ALTER TABLE `audit_log` ADD `hash` varchar(64);
