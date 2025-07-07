import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Wishlist } from '../wishlist/wishlist.entity';

@Entity('books')
export class Book {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  author: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  image: string;

  @Column('numeric', { precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'int', default: 10 })
  quantity: number;

  @OneToMany(() => Wishlist, (wishlist) => wishlist.book)
  wishlists: Wishlist[];
}
