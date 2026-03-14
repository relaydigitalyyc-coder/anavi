CREATE TABLE `user_flags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`flagType` enum('whitelist','blacklist','watchlist') NOT NULL,
	`reason` text,
	`flaggedBy` int,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_flags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `escrow_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealId` int NOT NULL,
	`stripeAccountId` varchar(255) NOT NULL,
	`stripePaymentIntentId` varchar(255),
	`fundedAmount` decimal(15,2) DEFAULT '0.00',
	`releasedAmount` decimal(15,2) DEFAULT '0.00',
	`status` enum('unfunded','funded','partially_released','released','refunded') NOT NULL DEFAULT 'unfunded',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `escrow_accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `nda_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`jurisdiction` varchar(128) DEFAULT 'US',
	`isDefault` boolean DEFAULT false,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `nda_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crypto_assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`symbol` varchar(32) NOT NULL,
	`name` varchar(128) NOT NULL,
	`balance` decimal(24,8) DEFAULT '0',
	`value` decimal(18,2) DEFAULT '0',
	`avgCost` decimal(18,4),
	`currentPrice` varchar(32),
	`pnl` varchar(32),
	`pnlValue` varchar(32),
	`allocation` int,
	`type` enum('crypto','stablecoin','tokenization') DEFAULT 'crypto',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `crypto_assets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fee_collections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` varchar(64) NOT NULL,
	`source` varchar(255),
	`amount` decimal(18,2) NOT NULL,
	`date` varchar(16),
	`status` enum('pending','collected') DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fee_collections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `network_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`status` enum('pending','active') DEFAULT 'pending',
	`tier` enum('basic','premium','partner') DEFAULT 'basic',
	`industry` varchar(128),
	`allocatedCapital` decimal(18,2) DEFAULT '0',
	`deployedCapital` decimal(18,2) DEFAULT '0',
	`totalReturns` decimal(18,2) DEFAULT '0',
	`returnPercent` decimal(8,2) DEFAULT '0',
	`joinDate` varchar(16),
	`expertise` json,
	`connections` json,
	`contributionScore` int DEFAULT 0,
	`referrals` int DEFAULT 0,
	`verified` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `network_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `operator_intakes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`operatorName` varchar(255) NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(32),
	`linkedIn` varchar(512),
	`dealTitle` varchar(512) NOT NULL,
	`assetClass` varchar(128),
	`geography` varchar(255),
	`targetRaise` varchar(64),
	`minimumInvestment` varchar(64),
	`investmentThesis` text,
	`trackRecord` text,
	`skinInGame` text,
	`timeline` varchar(255),
	`accreditedOnly` boolean DEFAULT false,
	`manualReview` boolean DEFAULT false,
	`noAutomation` boolean DEFAULT false,
	`status` enum('pending','in_review','approved','rejected') DEFAULT 'pending',
	`reviewNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `operator_intakes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trading_positions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`asset` varchar(128) NOT NULL,
	`type` enum('long','short') DEFAULT 'long',
	`entryPrice` decimal(18,4) NOT NULL,
	`currentPrice` decimal(18,4) NOT NULL,
	`quantity` decimal(18,4) NOT NULL,
	`pnl` decimal(18,2),
	`pnlPercent` decimal(8,2),
	`status` enum('active','closed') DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `trading_positions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `docusign_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`provider` enum('docusign') NOT NULL DEFAULT 'docusign',
	`environment` enum('demo','prod') NOT NULL DEFAULT 'demo',
	`integrationKey` varchar(64) NOT NULL,
	`accountId` varchar(128) NOT NULL,
	`baseUri` varchar(255) NOT NULL,
	`impersonatedUserId` varchar(128) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `docusign_accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `docusign_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`envelopeId` int NOT NULL,
	`providerDocumentId` varchar(64) NOT NULL,
	`dealRoomDocumentId` int,
	`name` varchar(255) NOT NULL,
	`sha256PreSend` varchar(128),
	`sha256PostComplete` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `docusign_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `docusign_envelope_recipients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`envelopeId` int NOT NULL,
	`providerRecipientId` varchar(64) NOT NULL,
	`role` enum('signer','viewer','cc') NOT NULL DEFAULT 'signer',
	`routingOrder` int NOT NULL DEFAULT 1,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`userId` int,
	`status` enum('created','sent','delivered','signed','declined','completed') NOT NULL DEFAULT 'created',
	`signedAt` timestamp,
	`declinedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `docusign_envelope_recipients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `docusign_envelopes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealRoomId` int NOT NULL,
	`dealId` int,
	`providerEnvelopeId` varchar(128) NOT NULL,
	`templateId` varchar(128),
	`subject` varchar(255) NOT NULL,
	`status` enum('draft','created','sent','delivered','completed','declined','voided','expired','error') NOT NULL DEFAULT 'draft',
	`sentAt` timestamp,
	`completedAt` timestamp,
	`voidedAt` timestamp,
	`lastProviderEventAt` timestamp,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `docusign_envelopes_id` PRIMARY KEY(`id`),
	CONSTRAINT `docusign_envelopes_providerEnvelopeId_unique` UNIQUE(`providerEnvelopeId`)
);
--> statement-breakpoint
CREATE TABLE `docusign_oauth_states` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`state` varchar(128) NOT NULL,
	`codeVerifier` varchar(255) NOT NULL,
	`redirectUri` varchar(512) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`usedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `docusign_oauth_states_id` PRIMARY KEY(`id`),
	CONSTRAINT `docusign_oauth_states_state_unique` UNIQUE(`state`)
);
--> statement-breakpoint
CREATE TABLE `docusign_oauth_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`accessToken` text NOT NULL,
	`refreshToken` text,
	`scope` varchar(512),
	`tokenType` varchar(32),
	`expiresAt` timestamp,
	`providerUserId` varchar(128),
	`providerAccountId` varchar(128),
	`providerBaseUri` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `docusign_oauth_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `docusign_oauth_tokens_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `docusign_webhook_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`providerEventId` varchar(128) NOT NULL,
	`providerEnvelopeId` varchar(128) NOT NULL,
	`eventType` varchar(128) NOT NULL,
	`payloadJson` json NOT NULL,
	`processStatus` enum('pending','processed','failed') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`receivedAt` timestamp NOT NULL DEFAULT (now()),
	`processedAt` timestamp,
	CONSTRAINT `docusign_webhook_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `docusign_webhook_events_providerEventId_unique` UNIQUE(`providerEventId`)
);
--> statement-breakpoint
ALTER TABLE `payouts` MODIFY COLUMN `payoutType` enum('originator_fee','introducer_fee','advisor_fee','lifetime_attribution','milestone_bonus','success_fee') NOT NULL;--> statement-breakpoint
ALTER TABLE `audit_log` ADD `prevHash` varchar(64);--> statement-breakpoint
ALTER TABLE `audit_log` ADD `hash` varchar(64);--> statement-breakpoint
ALTER TABLE `deals` ADD `isFollowOn` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `deals` ADD `originalDealId` int;--> statement-breakpoint
ALTER TABLE `payouts` ADD `stripeTransferId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerified` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `participantType` enum('originator','investor','developer','institutional','acquirer');--> statement-breakpoint
ALTER TABLE `users` ADD `primaryPersona` enum('originator','investor','principal');--> statement-breakpoint
ALTER TABLE `users` ADD `enabledPersonas` json;--> statement-breakpoint
ALTER TABLE `users` ADD `primaryIndustries` json;--> statement-breakpoint
ALTER TABLE `users` ADD `onboardingStep` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `users` ADD `onboardingCompleted` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `investmentFocus` json;--> statement-breakpoint
ALTER TABLE `users` ADD `dealVerticals` json;--> statement-breakpoint
ALTER TABLE `users` ADD `typicalDealSize` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `geographicFocus` json;--> statement-breakpoint
ALTER TABLE `users` ADD `yearsExperience` int;--> statement-breakpoint
ALTER TABLE `users` ADD `linkedinUrl` varchar(512);