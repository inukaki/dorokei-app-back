import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialPostgresSetup1763474169293 implements MigrationInterface {
    name = 'InitialPostgresSetup1763474169293'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."players_role_enum" AS ENUM('POLICE', 'THIEF')`);
        await queryRunner.query(`CREATE TABLE "players" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "playerName" character varying(100) NOT NULL, "role" "public"."players_role_enum" NOT NULL, "isCaptured" boolean NOT NULL DEFAULT false, "isConnected" boolean NOT NULL DEFAULT true, "roomId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_de22b8fdeee0c33ab55ae71da3b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."rooms_status_enum" AS ENUM('WAITING', 'CLOSED', 'IN_GAME', 'FINISHED')`);
        await queryRunner.query(`CREATE TABLE "rooms" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "passcode_hash" character varying(255) NOT NULL, "status" "public"."rooms_status_enum" NOT NULL DEFAULT 'WAITING', "durationSeconds" integer NOT NULL DEFAULT '600', "gracePeriodSeconds" integer NOT NULL DEFAULT '30', "startedAt" TIMESTAMP, "hostPlayerId" uuid NOT NULL, "maxPlayers" integer NOT NULL DEFAULT '15', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_1c5be4256423f25fbec240560d5" UNIQUE ("passcode_hash"), CONSTRAINT "PK_0368a2d7c215f2d0458a54933f2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "players" ADD CONSTRAINT "FK_280e4c471900ea22801fb3ce58c" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "players" DROP CONSTRAINT "FK_280e4c471900ea22801fb3ce58c"`);
        await queryRunner.query(`DROP TABLE "rooms"`);
        await queryRunner.query(`DROP TYPE "public"."rooms_status_enum"`);
        await queryRunner.query(`DROP TABLE "players"`);
        await queryRunner.query(`DROP TYPE "public"."players_role_enum"`);
    }

}
