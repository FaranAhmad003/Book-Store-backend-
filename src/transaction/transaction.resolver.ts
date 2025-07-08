import { Resolver, Mutation, Args, Context, Int } from '@nestjs/graphql';
import { TransactionService } from './transactions.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';

@Resolver()
export class TransactionResolver {
  constructor(
    private readonly txService: TransactionService,
    private readonly jwtService: JwtService,
  ) {}

  @Mutation(() => String)
  async purchaseBook(
    @Args('bookId', { type: () => Int }) bookId: number, // ✅ explicitly define as Int
    @Context() context: any,
  ): Promise<string> {
    const req = context.req;
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No auth token provided');
    }

    const token = authHeader.split(' ')[1];
    const payload = await this.jwtService.verifyAsync(token);
    const userId = parseInt(payload.sub_hex || payload.sub, 16);

    return this.txService.purchaseBook(userId, bookId);
  }
}
