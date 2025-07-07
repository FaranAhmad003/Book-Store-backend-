import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn } from 'typeorm';
import { User } from '../user/user.entity';
import { Book } from '../books/book.entity';

@Entity('wishlist')
export class Wishlist {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.wishlist, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Book, (book) => book.wishlists, { onDelete: 'CASCADE' })
  book: Book;
  
  @CreateDateColumn()
  createdAt : Date;
}

