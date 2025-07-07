import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../user/user.entity';
import { Book } from '../books/book.entity';

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  sender: User;

  @ManyToOne(() => User)
  receiver: User;

  @ManyToOne(() => Book)
  book: Book;

  @Column('numeric', { precision: 12, scale: 2 })
  amount: number;

  @CreateDateColumn()
  createdAt: Date;
}