import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class ChatMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  sessionId: string;

  @Column()
  role: 'user' | 'assistant' | 'system';

  @Column('text')
  content: string;

  @CreateDateColumn()
  createdAt: Date;
}
