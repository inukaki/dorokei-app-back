import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeRoomIdNullable1763478716237 implements MigrationInterface {
    name = 'MakeRoomIdNullable1763478716237'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "players" DROP CONSTRAINT "FK_280e4c471900ea22801fb3ce58c"`);
        await queryRunner.query(`ALTER TABLE "players" ALTER COLUMN "roomId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "players" ADD CONSTRAINT "FK_280e4c471900ea22801fb3ce58c" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "players" DROP CONSTRAINT "FK_280e4c471900ea22801fb3ce58c"`);
        await queryRunner.query(`ALTER TABLE "players" ALTER COLUMN "roomId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "players" ADD CONSTRAINT "FK_280e4c471900ea22801fb3ce58c" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
