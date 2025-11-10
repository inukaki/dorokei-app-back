import { MigrationInterface, QueryRunner } from "typeorm";

export class RemovePlayerTokenColumn1762777709716 implements MigrationInterface {
    name = 'RemovePlayerTokenColumn1762777709716'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_c15a432b42cd24796ec3244ad2\` ON \`players\``);
        await queryRunner.query(`ALTER TABLE \`players\` DROP COLUMN \`playerToken\``);
        await queryRunner.query(`ALTER TABLE \`rooms\` CHANGE \`startedAt\` \`startedAt\` datetime NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`rooms\` CHANGE \`startedAt\` \`startedAt\` datetime NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`players\` ADD \`playerToken\` varchar(255) NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_c15a432b42cd24796ec3244ad2\` ON \`players\` (\`playerToken\`)`);
    }

}
