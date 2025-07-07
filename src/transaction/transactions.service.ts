import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Transaction } from './transaction.entity';
import { User } from '../user/user.entity';
import { Book } from '../books/book.entity';
import { Account } from '../accounts/account.entity';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction) private txRepo: Repository<Transaction>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Book) private bookRepo: Repository<Book>,
    @InjectRepository(Account) private accountRepo: Repository<Account>,
    private dataSource: DataSource,
  ) {}

  async purchaseBook(userId: number, bookId: number): Promise<string> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const buyer = await queryRunner.manager.findOne(User, { where: { id: userId } });
      const admin = await queryRunner.manager.findOne(User, { where: { email: 'admin@example.com' } });
      const book = await queryRunner.manager.findOne(Book, { where: { id: bookId } });

      if (!buyer || !admin || !book) throw new NotFoundException('Buyer, admin, or book not found');
      if (book.quantity < 1) throw new BadRequestException('Book out of stock');

      const buyerAccount = await queryRunner.manager
        .getRepository(Account)
        .createQueryBuilder('account')
        .leftJoinAndSelect('account.user', 'user')
        .where('user.id = :id', { id: userId })
        .getOne();

      const adminAccount = await queryRunner.manager
        .getRepository(Account)
        .createQueryBuilder('account')
        .leftJoinAndSelect('account.user', 'user')
        .where('user.id = :id', { id: admin.id })
        .getOne();

      if (!buyerAccount || !adminAccount) {
        throw new NotFoundException('Account not found for buyer or admin');
      }

      if (Number(buyerAccount.balance) < Number(book.price)) {
        console.log('💰 Buyer balance:', buyerAccount.balance);
        console.log('📚 Book price:', book.price);
        throw new BadRequestException('Insufficient funds');
       
      }

      buyerAccount.balance = Number(buyerAccount.balance) - Number(book.price);
      adminAccount.balance = Number(adminAccount.balance) + Number(book.price);

      book.quantity -= 1;

      await queryRunner.manager.save(Account, buyerAccount);
      await queryRunner.manager.save(Account, adminAccount);
      await queryRunner.manager.save(Book, book);

      const tx = this.txRepo.create({
        sender: buyer,
        receiver: admin,
        book,
        amount: book.price,
      });
      await queryRunner.manager.save(tx);

      await queryRunner.commitTransaction();
      return 'Transaction completed successfully';
    } catch (err) {
      await queryRunner.rollbackTransaction();
      console.error('💥 Transaction failed:', err);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}