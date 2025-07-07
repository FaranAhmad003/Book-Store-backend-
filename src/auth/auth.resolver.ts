import { Resolver, Query, Context } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../accounts/account.entity';
import { User } from '../user/user.entity';
import { UseGuards } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import { createParamDecorator } from '@nestjs/common';
import { ObjectType, Field, Int, GraphQLISODateTime } from '@nestjs/graphql';

@ObjectType()
export class UserDetails {
  @Field(() => Int)
  id: number;
  @Field()
  firstname: string;
  @Field()
  lastname: string;
  @Field()
  email: string;
  @Field(() => Number, { nullable: true })
  balance: number | null;
  @Field(() => String, { nullable: true })
  currency: string | null;
  @Field(() => GraphQLISODateTime, { nullable: true })
  createdAt: Date | null;
  @Field(() => GraphQLISODateTime, { nullable: true })
  updatedAt: Date | null;
}

@Resolver(() => UserDetails)
export class AuthResolver {
  constructor(
    @InjectRepository(Account) private accountRepo: Repository<Account>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  @Query(() => UserDetails, { nullable: true })
  async me(@Context() context: any): Promise<UserDetails | null> {
    const req = context.req;
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    const token = authHeader.split(' ')[1];
    try {
      const payload = await this.jwtService.verifyAsync(token);
      const userId = parseInt(payload.sub_hex || payload.sub, 16) || payload.sub;
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) return null;
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
      return null;
    }
  }
} 