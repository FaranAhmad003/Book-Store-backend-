import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

async signup(
  firstname: string,
  lastname: string,
  email: string,
  password: string
): Promise<User | null> {
  const existing = await this.userRepo.findOne({ where: { email } });
  if (existing) return null;

  const user = this.userRepo.create({ firstname, lastname, email, password });
  return this.userRepo.save(user);
}


  async validateUser(email: string, password: string): Promise<User> {
   const user = await this.userRepo.findOne({ where: { email } });
    console.log('Login attempt:', { email, password, user });
    if (!user || user.password !== password) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }

  async generateJwt(user: User): Promise<string> {
    const userIndex = user.id.toString(16);
    const payload = {sub_hex: userIndex, email: user.email};
    return this.jwtService.signAsync(payload);
  }
}
