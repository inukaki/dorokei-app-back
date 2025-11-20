import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { Player } from "../../players/entities/player.entity";

export enum RoomStatus {
  WAITING = 'WAITING',
  CLOSED = 'CLOSED',
  IN_GAME = 'IN_GAME',
  FINISHED = 'FINISHED',
}

@Entity('rooms')
export class Room {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 255, unique: true })
    passcode_hash: string;

    @Column({ type: 'enum', enum: RoomStatus, default: RoomStatus.WAITING })
    status: RoomStatus;

    @Column({ type: 'int', default: 600 })
    durationSeconds: number;

    @Column({ type: 'int', default: 30 })
    gracePeriodSeconds: number;

    @Column({ type: 'timestamp', nullable: true })
    startedAt: Date | null;

    @Column({ type: 'uuid' })
    hostPlayerId: string;

    // 最大参加人数のデフォルト値を15に設定
    // フロント側と要相談？
    @Column({ type: 'int', default: 15 })
    maxPlayers: number;

    @OneToMany(() => Player, player => player.room)
    players: Player[];

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;
}
