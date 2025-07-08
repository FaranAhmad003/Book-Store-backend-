import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { Account } from '../accounts/account.entity';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,

    private readonly jwtService: JwtService,
  ) {}

  async signup(
    firstname: string,
    lastname: string,
    email: string,
    password: string,
  ): Promise<User | null> {
    try {
      console.log('📩 signup() triggered');
      const existing = await this.userRepo.findOne({ where: { email } });
      if (existing) {
        console.warn(`⚠️ User with email ${email} already exists`);
        return null;
      }

      const user = this.userRepo.create({ firstname, lastname, email, password });
      const savedUser = await this.userRepo.save(user);
      console.log(`✅ User created with ID: ${savedUser.id}`);

      // ✅ Use actual User entity object (not { id })
      const account = this.accountRepo.create({
        user: savedUser,
        balance: 60.0,
        currency: 'USD',
      });

      const savedAccount = await this.accountRepo.save(account);
      console.log(`💰 Account created for user ID ${savedUser.id} with balance: $${savedAccount.balance}`);

      return savedUser;
    } catch (err) {
      console.error('❌ Error during signup:', err);
      throw new InternalServerErrorException('Signup failed due to server error');
    }
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { email } });

    console.log('🔐 Login attempt:', {
      email,
      password,
      user,
    });

    if (!user || user.password !== password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async generateJwt(user: User): Promise<string> {
    const userIndex = user.id.toString(16);
    const payload = { sub_hex: userIndex, email: user.email };
    return this.jwtService.signAsync(payload);
  }
}
