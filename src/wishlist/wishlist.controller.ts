// backend/src/wishlist/wishlist.controller.ts

import { Controller, Post, Param, Get, Headers, Body, Delete } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { JwtService } from '@nestjs/jwt';

@Controller('wishlist')
export class WishlistController {
  constructor(
    private wishlistService: WishlistService,
    private jwtService: JwtService
  ) {}

  @Post('toggle/:bookId')
  async toggleWishlist(
    @Param('bookId') bookId: string,
    @Headers('authorization') authHeader: string
  ) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { message: 'Unauthorized access' };
    }
    const token = authHeader.split(' ')[1];
    const payload = await this.jwtService.verifyAsync(token, { secret: process.env.JWT_SECRET });
    const userId = parseInt(payload.sub_hex, 16);
    return this.wishlistService.toggle(userId, parseInt(bookId));
  }

  @Get()
  async getWishlist(@Headers('authorization') authHeader: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { message: 'Unauthorized access' };
    }
    const token = authHeader.split(' ')[1];
    const payload = await this.jwtService.verifyAsync(token, { secret: process.env.JWT_SECRET });
    const userId = parseInt(payload.sub_hex, 16);
    return this.wishlistService.getUserWishlist(userId);
  }

  @Post('create')
async createWishlist(
  @Headers('authorization') authHeader: string,
  @Body('bookId') bookId: number
) {
  try {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { message: 'Unauthorized access' };
    }

    const token = authHeader.split(' ')[1];
    const payload = await this.jwtService.verifyAsync(token, { secret: process.env.JWT_SECRET });
    console.log('Decoded payload:', payload);

    const userId = parseInt(payload.sub_hex, 16);
    
    console.log('Parsed userId:', userId);

    if (!userId) {
      return { message: 'User ID is required' };
    }

    if (!bookId) {
      return { message: 'Book ID is required' };
    }

    const result = await this.wishlistService.toggle(userId, bookId);
    return result;
  } catch (error) {
    console.error('Error in createWishlist:', error);
    return { message: 'Internal server error', error: error.message };
  }
}

@Delete(':bookId')
async removeFromWishlist(
  @Param('bookId') bookId: string,
  @Headers('authorization') authHeader: string
) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { message: 'Unauthorized access' };
  }
  const token = authHeader.split(' ')[1];
  const payload = await this.jwtService.verifyAsync(token, { secret: process.env.JWT_SECRET });
  const userId = parseInt(payload.sub_hex, 16);
  // Remove the wishlist entry for this user and book
  return this.wishlistService.remove(userId, parseInt(bookId));
}

}