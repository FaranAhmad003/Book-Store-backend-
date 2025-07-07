import { Controller, Post, Headers, Body, UnauthorizedException } from '@nestjs/common';
import { TransactionService } from './transactions.service';
import { JwtService } from '@nestjs/jwt';

@Controller('transactions')
export class TransactionController {
  constructor(private txService: TransactionService, private jwtService: JwtService) {}

  @Post('purchase')
  async purchase(@Headers('authorization') authHeader: string, @Body('bookId') bookId: number) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No auth token provided');
    }
    const token = authHeader.split(' ')[1];
    const payload = await this.jwtService.verifyAsync(token);
    const userId = parseInt(payload.sub_hex, 16);
    return this.txService.purchaseBook(userId, bookId);
  }
}