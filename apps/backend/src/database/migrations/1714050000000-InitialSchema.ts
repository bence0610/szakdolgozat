import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1714050000000 implements MigrationInterface {
  name = 'InitialSchema1714050000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Users
    await queryRunner.query(`
      CREATE TABLE \`users\` (
        \`id\` varchar(36) NOT NULL,
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`version\` int NOT NULL DEFAULT '1',
        \`email\` varchar(255) NOT NULL,
        \`password_hash\` varchar(255) NOT NULL,
        \`first_name\` varchar(100) NOT NULL,
        \`last_name\` varchar(100) NOT NULL,
        \`phone_number\` varchar(32) NULL,
        \`date_of_birth\` date NULL,
        \`role\` enum('fan','admin','super_admin') NOT NULL DEFAULT 'fan',
        \`loyalty_tier\` enum('bronze','silver','gold','platinum') NOT NULL DEFAULT 'bronze',
        \`loyalty_points\` int unsigned NOT NULL DEFAULT '0',
        \`email_verified\` tinyint NOT NULL DEFAULT 0,
        \`two_factor_enabled\` tinyint NOT NULL DEFAULT 0,
        \`two_factor_secret\` varchar(255) NULL,
        \`last_login_at\` timestamp NULL,
        \`is_active\` tinyint NOT NULL DEFAULT 1,
        UNIQUE INDEX \`idx_users_email\` (\`email\`),
        UNIQUE INDEX \`IDX_users_email_unique\` (\`email\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Matches
    await queryRunner.query(`
      CREATE TABLE \`matches\` (
        \`id\` varchar(36) NOT NULL,
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`version\` int NOT NULL DEFAULT '1',
        \`home_team\` varchar(100) NOT NULL,
        \`away_team\` varchar(100) NOT NULL,
        \`competition\` enum('NB1','NB2','magyar_kupa','friendly') NOT NULL DEFAULT 'NB1',
        \`venue\` varchar(200) NOT NULL,
        \`kickoff_at\` timestamp NOT NULL,
        \`status\` enum('scheduled','on_sale','sold_out','postponed','cancelled','finished') NOT NULL DEFAULT 'scheduled',
        \`capacity\` int unsigned NOT NULL DEFAULT '0',
        \`base_price\` decimal(10,2) NOT NULL,
        \`banner_image_url\` varchar(500) NULL,
        \`description\` text NULL,
        \`is_season_pass_eligible\` tinyint NOT NULL DEFAULT 1,
        INDEX \`idx_matches_kickoff\` (\`kickoff_at\`),
        INDEX \`idx_matches_status\` (\`status\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Seats
    await queryRunner.query(`
      CREATE TABLE \`seats\` (
        \`id\` varchar(36) NOT NULL,
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`version\` int NOT NULL DEFAULT '1',
        \`section\` varchar(32) NOT NULL,
        \`row\` varchar(16) NOT NULL,
        \`number\` int unsigned NOT NULL,
        \`category\` enum('standard','premium','vip','standing') NOT NULL DEFAULT 'standard',
        \`price_modifier\` decimal(10,2) NOT NULL DEFAULT '1.00',
        \`is_accessible\` tinyint NOT NULL DEFAULT 0,
        \`is_active\` tinyint NOT NULL DEFAULT 1,
        UNIQUE INDEX \`idx_seats_section_row_number\` (\`section\`,\`row\`,\`number\`),
        INDEX \`idx_seats_category\` (\`category\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Season passes
    await queryRunner.query(`
      CREATE TABLE \`season_passes\` (
        \`id\` varchar(36) NOT NULL,
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`version\` int NOT NULL DEFAULT '1',
        \`user_id\` varchar(36) NOT NULL,
        \`seat_id\` varchar(36) NULL,
        \`season_label\` varchar(32) NOT NULL,
        \`valid_from\` date NOT NULL,
        \`valid_until\` date NOT NULL,
        \`status\` enum('active','expired','cancelled','pending_payment') NOT NULL DEFAULT 'pending_payment',
        \`price_paid\` decimal(10,2) NOT NULL,
        \`currency\` varchar(8) NOT NULL DEFAULT 'HUF',
        \`qr_code\` varchar(64) NOT NULL,
        \`auto_renew\` tinyint NOT NULL DEFAULT 0,
        \`stripe_payment_intent_id\` varchar(255) NULL,
        UNIQUE INDEX \`IDX_season_passes_qr\` (\`qr_code\`),
        INDEX \`idx_season_passes_user\` (\`user_id\`),
        INDEX \`idx_season_passes_status\` (\`status\`),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`fk_season_passes_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE RESTRICT,
        CONSTRAINT \`fk_season_passes_seat\` FOREIGN KEY (\`seat_id\`) REFERENCES \`seats\` (\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Tickets
    await queryRunner.query(`
      CREATE TABLE \`tickets\` (
        \`id\` varchar(36) NOT NULL,
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`version\` int NOT NULL DEFAULT '1',
        \`match_id\` varchar(36) NOT NULL,
        \`seat_id\` varchar(36) NOT NULL,
        \`user_id\` varchar(36) NOT NULL,
        \`season_pass_id\` varchar(36) NULL,
        \`status\` enum('pending_payment','paid','cancelled','refunded','used') NOT NULL DEFAULT 'pending_payment',
        \`source\` enum('single','season_pass','loan') NOT NULL DEFAULT 'single',
        \`price_paid\` decimal(10,2) NOT NULL,
        \`currency\` varchar(8) NOT NULL DEFAULT 'HUF',
        \`qr_code\` varchar(64) NOT NULL,
        \`stripe_payment_intent_id\` varchar(255) NULL,
        \`used_at\` timestamp NULL,
        UNIQUE INDEX \`uq_tickets_match_seat\` (\`match_id\`,\`seat_id\`),
        UNIQUE INDEX \`IDX_tickets_qr\` (\`qr_code\`),
        INDEX \`idx_tickets_user\` (\`user_id\`),
        INDEX \`idx_tickets_status\` (\`status\`),
        INDEX \`idx_tickets_payment_intent\` (\`stripe_payment_intent_id\`),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`fk_tickets_match\` FOREIGN KEY (\`match_id\`) REFERENCES \`matches\` (\`id\`) ON DELETE RESTRICT,
        CONSTRAINT \`fk_tickets_seat\` FOREIGN KEY (\`seat_id\`) REFERENCES \`seats\` (\`id\`) ON DELETE RESTRICT,
        CONSTRAINT \`fk_tickets_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE RESTRICT,
        CONSTRAINT \`fk_tickets_season_pass\` FOREIGN KEY (\`season_pass_id\`) REFERENCES \`season_passes\` (\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Pass loans
    await queryRunner.query(`
      CREATE TABLE \`pass_loans\` (
        \`id\` varchar(36) NOT NULL,
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`version\` int NOT NULL DEFAULT '1',
        \`season_pass_id\` varchar(36) NOT NULL,
        \`lender_user_id\` varchar(36) NOT NULL,
        \`borrower_user_id\` varchar(36) NULL,
        \`match_id\` varchar(36) NOT NULL,
        \`borrower_email\` varchar(255) NOT NULL,
        \`status\` enum('pending','accepted','revoked','expired','used') NOT NULL DEFAULT 'pending',
        \`invitation_token\` varchar(64) NOT NULL,
        \`expires_at\` timestamp NOT NULL,
        \`accepted_at\` timestamp NULL,
        UNIQUE INDEX \`IDX_pass_loans_token\` (\`invitation_token\`),
        INDEX \`idx_pass_loans_pass\` (\`season_pass_id\`),
        INDEX \`idx_pass_loans_borrower\` (\`borrower_user_id\`),
        INDEX \`idx_pass_loans_match\` (\`match_id\`),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`fk_pass_loans_season_pass\` FOREIGN KEY (\`season_pass_id\`) REFERENCES \`season_passes\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`fk_pass_loans_lender\` FOREIGN KEY (\`lender_user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE RESTRICT,
        CONSTRAINT \`fk_pass_loans_borrower\` FOREIGN KEY (\`borrower_user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL,
        CONSTRAINT \`fk_pass_loans_match\` FOREIGN KEY (\`match_id\`) REFERENCES \`matches\` (\`id\`) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Loyalty transactions
    await queryRunner.query(`
      CREATE TABLE \`loyalty_transactions\` (
        \`id\` varchar(36) NOT NULL,
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`version\` int NOT NULL DEFAULT '1',
        \`user_id\` varchar(36) NOT NULL,
        \`type\` enum('earn','redeem','adjustment','expiry') NOT NULL,
        \`source\` enum('ticket_purchase','season_pass_purchase','promotion','reward_redeem','admin') NOT NULL,
        \`points\` int NOT NULL,
        \`balance_after\` int unsigned NOT NULL,
        \`reference_id\` varchar(36) NULL,
        \`description\` varchar(255) NULL,
        INDEX \`idx_loyalty_user\` (\`user_id\`),
        INDEX \`idx_loyalty_created\` (\`created_at\`),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`fk_loyalty_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Waitlist
    await queryRunner.query(`
      CREATE TABLE \`waitlist\` (
        \`id\` varchar(36) NOT NULL,
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`version\` int NOT NULL DEFAULT '1',
        \`user_id\` varchar(36) NOT NULL,
        \`match_id\` varchar(36) NOT NULL,
        \`status\` enum('active','notified','converted','expired','cancelled') NOT NULL DEFAULT 'active',
        \`requested_quantity\` int unsigned NOT NULL DEFAULT '1',
        \`preferred_section\` varchar(32) NULL,
        \`notified_at\` timestamp NULL,
        UNIQUE INDEX \`uq_waitlist_user_match\` (\`user_id\`,\`match_id\`),
        INDEX \`idx_waitlist_match\` (\`match_id\`),
        INDEX \`idx_waitlist_status\` (\`status\`),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`fk_waitlist_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`fk_waitlist_match\` FOREIGN KEY (\`match_id\`) REFERENCES \`matches\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `waitlist`');
    await queryRunner.query('DROP TABLE `loyalty_transactions`');
    await queryRunner.query('DROP TABLE `pass_loans`');
    await queryRunner.query('DROP TABLE `tickets`');
    await queryRunner.query('DROP TABLE `season_passes`');
    await queryRunner.query('DROP TABLE `seats`');
    await queryRunner.query('DROP TABLE `matches`');
    await queryRunner.query('DROP TABLE `users`');
  }
}
