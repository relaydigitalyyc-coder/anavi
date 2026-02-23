CREATE TABLE `audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`action` varchar(128) NOT NULL,
	`entityType` varchar(64) NOT NULL,
	`entityId` int,
	`previousState` json,
	`newState` json,
	`metadata` json,
	`ipAddress` varchar(64),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `compliance_checks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entityType` enum('user','deal','relationship') NOT NULL,
	`entityId` int NOT NULL,
	`checkType` enum('sanctions','pep','adverse_media','aml','kyc','kyb','jurisdiction') NOT NULL,
	`status` enum('pending','passed','flagged','failed') DEFAULT 'pending',
	`riskLevel` enum('low','medium','high','critical'),
	`provider` varchar(64),
	`externalCheckId` varchar(255),
	`findings` json,
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`reviewNotes` text,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `compliance_checks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contact_handles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`relationshipId` int,
	`platform` enum('email','phone','telegram','discord','whatsapp','slack','linkedin','twitter','signal','wechat','other') NOT NULL,
	`handle` varchar(255) NOT NULL,
	`displayName` varchar(255),
	`isVerified` boolean DEFAULT false,
	`isPrimary` boolean DEFAULT false,
	`groupChatLink` text,
	`groupChatName` varchar(255),
	`lastActiveAt` timestamp,
	`messageCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contact_handles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deal_participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('originator','buyer','seller','introducer','advisor','legal','escrow','observer') NOT NULL,
	`attributionPercentage` decimal(5,2),
	`expectedPayout` decimal(18,2),
	`actualPayout` decimal(18,2),
	`payoutStatus` enum('pending','partial','completed') DEFAULT 'pending',
	`introducedBy` int,
	`relationshipId` int,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	`leftAt` timestamp,
	CONSTRAINT `deal_participants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deal_room_access` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealRoomId` int NOT NULL,
	`userId` int NOT NULL,
	`accessLevel` enum('view','comment','edit','admin') DEFAULT 'view',
	`ndaSigned` boolean DEFAULT false,
	`ndaSignedAt` timestamp,
	`ndaDocumentId` int,
	`invitedBy` int,
	`expiresAt` timestamp,
	`lastAccessedAt` timestamp,
	`accessCount` int DEFAULT 0,
	`grantedAt` timestamp NOT NULL DEFAULT (now()),
	`revokedAt` timestamp,
	CONSTRAINT `deal_room_access_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deal_rooms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealId` int,
	`matchId` int,
	`name` varchar(255) NOT NULL,
	`description` text,
	`status` enum('active','archived','closed') DEFAULT 'active',
	`accessLevel` enum('private','participants','invited') DEFAULT 'participants',
	`ndaRequired` boolean DEFAULT true,
	`ndaTemplateId` int,
	`settings` json,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deal_rooms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`dealType` enum('commodity_trade','real_estate','equity_investment','debt_financing','joint_venture','acquisition','partnership','other') NOT NULL,
	`dealValue` decimal(18,2),
	`currency` varchar(8) DEFAULT 'USD',
	`stage` enum('lead','qualification','due_diligence','negotiation','documentation','closing','completed','cancelled') DEFAULT 'lead',
	`originatorId` int NOT NULL,
	`buyerId` int,
	`sellerId` int,
	`dealRoomId` int,
	`currentMilestone` varchar(128),
	`milestones` json,
	`expectedCloseDate` timestamp,
	`actualCloseDate` timestamp,
	`complianceStatus` enum('pending','cleared','flagged','blocked') DEFAULT 'pending',
	`complianceNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `document_signatures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`userId` int NOT NULL,
	`status` enum('pending','signed','declined') DEFAULT 'pending',
	`signedAt` timestamp,
	`signatureData` text,
	`ipAddress` varchar(64),
	`requestedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	CONSTRAINT `document_signatures_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealRoomId` int,
	`dealId` int,
	`userId` int,
	`name` varchar(255) NOT NULL,
	`description` text,
	`fileUrl` text NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`fileSize` bigint,
	`mimeType` varchar(128),
	`version` int DEFAULT 1,
	`parentDocumentId` int,
	`isLatest` boolean DEFAULT true,
	`category` enum('nda','contract','financial','legal','technical','due_diligence','presentation','correspondence','other'),
	`tags` json,
	`requiresSignature` boolean DEFAULT false,
	`signatureStatus` enum('not_required','pending','partial','completed') DEFAULT 'not_required',
	`signatureProvider` varchar(64),
	`externalSignatureId` varchar(255),
	`uploadedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `intents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`intentType` enum('buy','sell','invest','seek_investment','partner') NOT NULL,
	`status` enum('active','paused','matched','expired','cancelled') DEFAULT 'active',
	`title` varchar(255) NOT NULL,
	`description` text,
	`assetType` enum('commodity','real_estate','equity','debt','infrastructure','renewable_energy','mining','oil_gas','business','other'),
	`assetSubtype` varchar(128),
	`minValue` decimal(18,2),
	`maxValue` decimal(18,2),
	`currency` varchar(8) DEFAULT 'USD',
	`targetLocations` json,
	`excludedLocations` json,
	`targetTimeline` varchar(64),
	`expiresAt` timestamp,
	`embedding` json,
	`keywords` json,
	`matchPreferences` json,
	`isAnonymous` boolean DEFAULT true,
	`visibilityLevel` enum('private','network','verified','public') DEFAULT 'verified',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `intents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `matches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`intent1Id` int NOT NULL,
	`intent2Id` int NOT NULL,
	`user1Id` int NOT NULL,
	`user2Id` int NOT NULL,
	`compatibilityScore` decimal(5,2) NOT NULL,
	`matchReason` text,
	`aiAnalysis` text,
	`status` enum('pending','user1_interested','user2_interested','mutual_interest','nda_pending','deal_room_created','declined','expired') DEFAULT 'pending',
	`user1Consent` boolean DEFAULT false,
	`user2Consent` boolean DEFAULT false,
	`user1ConsentAt` timestamp,
	`user2ConsentAt` timestamp,
	`dealRoomId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `matches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('match_found','deal_update','document_shared','signature_requested','payout_received','compliance_alert','relationship_request','system') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text,
	`relatedEntityType` varchar(64),
	`relatedEntityId` int,
	`isRead` boolean DEFAULT false,
	`readAt` timestamp,
	`actionUrl` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payouts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealId` int NOT NULL,
	`userId` int NOT NULL,
	`amount` decimal(18,2) NOT NULL,
	`currency` varchar(8) DEFAULT 'USD',
	`payoutType` enum('originator_fee','introducer_fee','advisor_fee','milestone_bonus','success_fee') NOT NULL,
	`attributionPercentage` decimal(5,2),
	`relationshipId` int,
	`isFollowOn` boolean DEFAULT false,
	`originalDealId` int,
	`status` enum('pending','approved','processing','completed','failed') DEFAULT 'pending',
	`milestoneId` varchar(64),
	`milestoneName` varchar(128),
	`paymentMethod` varchar(64),
	`paymentReference` varchar(255),
	`paidAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payouts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `peer_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reviewerId` int NOT NULL,
	`revieweeId` int NOT NULL,
	`dealId` int,
	`rating` int NOT NULL,
	`professionalism` int,
	`reliability` int,
	`communication` int,
	`comment` text,
	`isAnonymous` boolean DEFAULT false,
	`isVerified` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `peer_reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `relationships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`contactId` int NOT NULL,
	`timestampHash` varchar(128) NOT NULL,
	`timestampProof` text,
	`establishedAt` timestamp NOT NULL,
	`relationshipType` enum('direct','introduction','referral','network','professional','personal') DEFAULT 'direct',
	`strength` enum('weak','moderate','strong','very_strong') DEFAULT 'moderate',
	`strengthScore` decimal(5,2) DEFAULT '50.00',
	`isBlind` boolean DEFAULT true,
	`exposureLevel` enum('hidden','partial','full') DEFAULT 'hidden',
	`consentGiven` boolean DEFAULT false,
	`consentGivenAt` timestamp,
	`introducedBy` int,
	`attributionChain` json,
	`totalDealValue` decimal(18,2) DEFAULT '0.00',
	`totalEarnings` decimal(18,2) DEFAULT '0.00',
	`dealCount` int DEFAULT 0,
	`lastContactAt` timestamp,
	`contactFrequency` enum('daily','weekly','monthly','quarterly','yearly','rare'),
	`notes` text,
	`tags` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `relationships_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trust_score_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`previousScore` decimal(5,2),
	`newScore` decimal(5,2) NOT NULL,
	`changeReason` varchar(255) NOT NULL,
	`changeSource` enum('deal_completion','peer_review','verification_upgrade','compliance_check','dispute_resolution','time_decay','manual_adjustment') NOT NULL,
	`relatedEntityId` int,
	`relatedEntityType` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trust_score_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `verification_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`documentType` enum('government_id','passport','business_license','incorporation_docs','proof_of_address','bank_statement','tax_document','accreditation_letter') NOT NULL,
	`fileUrl` text NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`status` enum('pending','approved','rejected') DEFAULT 'pending',
	`reviewNotes` text,
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `verification_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `verificationTier` enum('none','basic','enhanced','institutional') DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `trustScore` decimal(5,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `users` ADD `verificationBadge` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `kybStatus` enum('pending','in_review','approved','rejected') DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `users` ADD `kycStatus` enum('pending','in_review','approved','rejected') DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `users` ADD `company` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `title` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `users` ADD `avatar` text;--> statement-breakpoint
ALTER TABLE `users` ADD `website` varchar(512);--> statement-breakpoint
ALTER TABLE `users` ADD `location` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `sanctionsCleared` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `pepStatus` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `adverseMediaCleared` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `users` ADD `complianceLastChecked` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `jurisdictions` json;--> statement-breakpoint
ALTER TABLE `users` ADD `totalDeals` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `users` ADD `totalDealValue` decimal(18,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `users` ADD `totalEarnings` decimal(18,2) DEFAULT '0.00';