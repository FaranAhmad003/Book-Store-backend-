import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Wishlist } from './wishlist.entity';
import { Repository } from 'typeorm';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(Wishlist)
    private wishlistRepo: Repository<Wishlist>
  ) {}

  async toggle(userId: number, bookId: number) {
    const existing = await this.wishlistRepo.findOne({
      where: { user: { id: userId }, book: { id: bookId } },
      relations: ['user', 'book'],
    });

    if (existing) {
      await this.wishlistRepo.remove(existing);
      return { message: 'Removed from wishlist' };
    }

    const wishlist = this.wishlistRepo.create({
      user: { id: userId },
      book: { id: bookId },
    });
    await this.wishlistRepo.save(wishlist);
    return { message: 'Added to wishlist' };
  }

  async getUserWishlist(userId: number) {
    return this.wishlistRepo.find({
      where: { user: { id: userId } },
      relations: ['book'],
    });
  }
  async createWishlist(userId: number, bookId: number) {
    const wishlist = this.wishlistRepo.create({
      user: { id: userId },
      book: { id: bookId },
    });
    const savedWishlist = await this.wishlistRepo.save(wishlist);
    console.log(savedWishlist);
    if (savedWishlist) {
      return { message: 'Wishlist created' };
    }
    return { message: 'Failed to create wishlist' };

  }

  async remove(userId: number, bookId: number) {
    const existing = await this.wishlistRepo.findOne({
      where: { user: { id: userId }, book: { id: bookId } },
      relations: ['user', 'book'],
    });
    if (existing) {
      await this.wishlistRepo.remove(existing);
      return { message: 'Removed from wishlist' };
    }
    return { message: 'Wishlist entry not found' };
  }
}

