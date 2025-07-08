import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../accounts/account.entity';
import { User } from '../user/user.entity';
import { JwtService } from '@nestjs/jwt';
import { ObjectType, Field, Int, GraphQLISODateTime, InputType } from '@nestjs/graphql';
import { AuthService } from './auth.service';

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
  @Field(() => String)
  user_type: string;
  @Field(() => Number, { nullable: true })
  balance: number | null;
  @Field(() => String, { nullable: true })
  currency: string | null;
  @Field(() => GraphQLISODateTime, { nullable: true })
  createdAt: Date | null;
  @Field(() => GraphQLISODateTime, { nullable: true })
  updatedAt: Date | null;
}

@ObjectType()
export class AuthResponse {
  @Field()
  message: string;

  @Field({ nullable: true })
  token?: string;

  @Field(() => UserDetails, { nullable: true })
  user?: UserDetails;
}

@InputType()
export class SignupInput {
  @Field()
  firstname: string;
  @Field()
  lastname: string;
  @Field()
  email: string;
  @Field()
  password: string;
}

@InputType()
export class LoginInput {
  @Field()
  email: string;
  @Field()
  password: string;
}

@Resolver(() => UserDetails)
export class AuthResolver {
  constructor(
    @InjectRepository(Account) private accountRepo: Repository<Account>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private jwtService: JwtService,
    private authService: AuthService,
  ) {}

  @Query(() => UserDetails, { nullable: true })
  async me(@Context() context: any): Promise<UserDetails | null> {
    const req = context.req;
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
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
        user_type: user.user_type,
        balance: account?.balance ?? null,
        currency: account?.currency ?? null,
        createdAt: account?.createdAt ?? null,
        updatedAt: account?.updatedAt ?? null,
      };
    } catch (e) {
      return null;
    }
  }

  @Mutation(() => AuthResponse)
 async signup(@Args('input') input: SignupInput): Promise<AuthResponse> {
  const { firstname, lastname, email, password } = input;
  if (!firstname || !lastname || !email || !password) {
    return { message: 'All fields are required' };
  }

  const user = await this.authService.signup(firstname, lastname, email, password);
  if (!user) {
    return { message: 'Signup failed' };
  }

  // 🧾 Fetch account after signup
  const account = this.accountRepo.create({
    user: user,
    balance: 60,
    currency: 'USD',
  });
  await this.accountRepo.save(account);
  console.log('Account created for user:', user.id);

  const token = await this.authService.generateJwt(user);

  return {
    message: 'Signup successful',
    token,
    user: {
      id: user.id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      user_type: user.user_type,
      balance: account?.balance ?? null,
      currency: account?.currency ?? null,
      createdAt: account?.createdAt ?? null,
      updatedAt: account?.updatedAt ?? null,
    },
  };
}

  @Mutation(() => AuthResponse)
  async login(@Args('input') input: LoginInput): Promise<AuthResponse> {
    const user = await this.authService.validateUser(input.email, input.password);
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
        balance: null,
        currency: null,
        createdAt: null,
        updatedAt: null,
      },
    };
  }

  @Query(() => String)
  logout(): string {
    return 'Logged out (stateless, delete token on client)';
  }
}
