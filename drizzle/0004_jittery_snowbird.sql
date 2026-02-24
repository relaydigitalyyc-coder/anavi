CREATE TABLE `enrichment_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entityType` enum('family_office','broker_contact','relationship') NOT NULL,
	`entityId` int NOT NULL,
	`source` varchar(64) NOT NULL,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`userId` int NOT NULL,
	`enrichedData` json,
	`fieldsUpdated` json,
	`errorMessage` text,
	`requestedAt` timestamp NOT NULL DEFAULT (now()),
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `enrichment_jobs_id` PRIMARY KEY(`id`)
);
