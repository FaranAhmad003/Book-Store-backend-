import {
  Controller,
  Post,
  Body,
  Get,
  Request,
  UseGuards,
  Req,
  Res,
  Headers,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { User } from 'lucide-react';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../accounts/account.entity';
import { User as UserEntity } from '../user/user.entity';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private jwtService: JwtService,
    @InjectRepository(Account) private accountRepo: Repository<Account>,
    @InjectRepository(UserEntity) private userRepo: Repository<UserEntity>,
  ) {}

 @Post('signup')
async signup(@Body() body: { firstname: string; lastname: string; email: string; password: string }) {
  const { firstname, lastname, email, password } = body;

  if (!firstname || !lastname || !email || !password) {
    return { message: 'All fields are required' };
  }

  const user = await this.authService.signup(firstname, lastname, email, password);
  if (!user) {
    return { message: 'Signup failed' };
  }

  const token = await this.authService.generateJwt(user);
  return {
    message: 'Signup successful',
    token,
    user: {
      id: user.id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
    },
  };
}


  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      return { message: 'Invalid credentials' };
    }
    const token = await this.authService.generateJwt(user);
    return {
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        user_type: user.user_type,
      },
    };
  }

  @Get('me')
  async me(@Headers('authorization') authHeader: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { message: 'No token provided' };
    }
    const token = authHeader.split(' ')[1];
    try {
      const payload = await this.jwtService.verifyAsync(token);
      return { id: payload.sub, email: payload.email };
    } catch (e) {
      return { message: 'Invalid or expired token' };
    }
  }

  @Get('logout')
  logout() {
    return { message: 'Logged out (stateless, delete token on client)' };
  }

  @Get('details')
  async details(@Headers('authorization') authHeader: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { message: 'No token provided' };
    }
    const token = authHeader.split(' ')[1];
    try {
      const payload = await this.jwtService.verifyAsync(token);
      const userId = parseInt(payload.sub_hex || payload.sub, 16) || payload.sub;
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) return { message: 'User not found' };
      const account = await this.accountRepo.findOne({ where: { user: { id: userId } } });
      return {
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        balance: account?.balance ?? null,
        currency: account?.currency ?? null,
        createdAt: account?.createdAt ?? null,
        updatedAt: account?.updatedAt ?? null,
      };
    } catch (e) {
      return { message: 'Invalid or expired token' };
    }
  }
}
