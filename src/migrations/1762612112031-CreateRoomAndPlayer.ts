import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRoomAndPlayer1762612112031 implements MigrationInterface {
    name = 'CreateRoomAndPlayer1762612112031'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`players\` (\`id\` varchar(36) NOT NULL, \`playerToken\` varchar(255) NOT NULL, \`playerName\` varchar(100) NOT NULL, \`role\` enum ('POLICE', 'THIEF') NOT NULL, \`isCaptured\` tinyint NOT NULL DEFAULT 0, \`isConnected\` tinyint NOT NULL DEFAULT 1, \`roomId\` varchar(36) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_c15a432b42cd24796ec3244ad2\` (\`playerToken\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`rooms\` (\`id\` varchar(36) NOT NULL, \`passcode_hash\` varchar(255) NOT NULL, \`status\` enum ('WAITING', 'IN_GAME', 'FINISHED') NOT NULL DEFAULT 'WAITING', \`durationSeconds\` int NOT NULL DEFAULT '600', \`gracePeriodSeconds\` int NOT NULL DEFAULT '30', \`startedAt\` datetime NULL, \`hostPlayerId\` varchar(36) NOT NULL, \`maxPlayers\` int NOT NULL DEFAULT '15', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_1c5be4256423f25fbec240560d\` (\`passcode_hash\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`players\` ADD CONSTRAINT \`FK_280e4c471900ea22801fb3ce58c\` FOREIGN KEY (\`roomId\`) REFERENCES \`rooms\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`players\` DROP FOREIGN KEY \`FK_280e4c471900ea22801fb3ce58c\``);
        await queryRunner.query(`DROP INDEX \`IDX_1c5be4256423f25fbec240560d\` ON \`rooms\``);
        await queryRunner.query(`DROP TABLE \`rooms\``);
        await queryRunner.query(`DROP INDEX \`IDX_c15a432b42cd24796ec3244ad2\` ON \`players\``);
        await queryRunner.query(`DROP TABLE \`players\``);
    }

}
