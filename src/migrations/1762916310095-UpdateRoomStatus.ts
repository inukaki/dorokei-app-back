import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateRoomStatus1762916310095 implements MigrationInterface {
    name = 'UpdateRoomStatus1762916310095'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`rooms\` CHANGE \`status\` \`status\` enum ('WAITING', 'CLOSED', 'IN_GAME', 'FINISHED') NOT NULL DEFAULT 'WAITING'`);
        await queryRunner.query(`ALTER TABLE \`rooms\` CHANGE \`startedAt\` \`startedAt\` datetime NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`rooms\` CHANGE \`startedAt\` \`startedAt\` datetime NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`rooms\` CHANGE \`status\` \`status\` enum ('WAITING', 'IN_GAME', 'FINISHED') NOT NULL DEFAULT ''WAITING''`);
    }

}
