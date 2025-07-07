import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './transaction.entity';
import { TransactionService } from './transactions.service';
import { TransactionController } from './transactions.controller';
import { User } from '../user/user.entity';
import { Book } from '../books/book.entity';
import { Account } from '../accounts/account.entity';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, User, Book, Account]),
    JwtModule.register({
      secret:  '3ujO0b2cjAa2sP5XyUNuwISpMCfXNky3PGXuYUJtjvo=',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [TransactionService],
  controllers: [TransactionController],
})
export class TransactionModule {}
