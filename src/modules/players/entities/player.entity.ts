import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from "typeorm";
import { Room } from "../../rooms/entities/room.entity";

export enum PlayerRole {
    POLICE = 'POLICE',
    THIEF = 'THIEF'
}

@Entity('players')
export class Player {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 100 })
    playerName: string;

    @Column({ type: 'enum', enum: PlayerRole })
    role: PlayerRole;

    @Column({ type: 'boolean', default: false })
    isCaptured: boolean;

    @Column({ type: 'boolean', default: true })
    isConnected: boolean;

    @ManyToOne(() => Room, room => room.players, { onDelete: 'CASCADE' })
    room: Room;

    @Column({ type: 'uuid', nullable: true })
    roomId?: string | null;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;
}
