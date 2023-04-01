import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, ClientKafka, Transport } from '@nestjs/microservices';
import * as bcrypt from 'bcrypt';
import dayjs, { ManipulateType } from 'dayjs';

// Services
import { JwtService } from '@nestjs/jwt';

// Models
import { CreateUserDto } from '../system/dto';
import { RefreshTokenDto } from './dto/';

// Types
import { Token } from './types/token.interface';
import { TokenResponse } from './types/token-response.type';
import { UserServicePattern as Pattern } from '../system/enums/user-service-pattern';
import { UserInterface as User } from '../system/interfaces/user.interface';
type UserId = string | number;

@Injectable()
export class AuthService {
  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {}

  @Client({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'user-service',
        brokers: ['localhost:9092'],
      },
      consumer: {
        groupId: 'user-consumer',
      },
    },
  })
  userService: ClientKafka;

  async onModuleInit() {
    this.userService.subscribeToResponseOf(Pattern.GET_USER);
    this.userService.subscribeToResponseOf(Pattern.CREATE_USER);

    await this.userService.connect();
  }

  async login(user: CreateUserDto): TokenResponse {
    const { phone_number, email, password } = user;

    if (phone_number) {
      return await this.loginByPhoneNumber(phone_number, password);
    } else if (email) {
      return await this.loginByEmail(email, password);
    }
  }

  async loginByPhoneNumber(
    phone_number: string,
    password: string,
  ): TokenResponse {
    const candidate = await this.userService.send(Pattern.GET_USER, {
      phone_number,
    });

    if (!candidate) {
      return `There is no user with phone number ${phone_number} in the system`;
    }

    return await this.loginByPassword(
      // @ts-ignore
      candidate.id,
      password,
      // @ts-ignore
      candidate.password,
    );
  }

  async loginByEmail(email: string, password: string): TokenResponse {
    const candidate = await this.userService.send<User>(Pattern.GET_USER, {
      email,
    });

    if (!candidate) {
      return `There is no user with email ${email} in the system`;
    }

    return await this.loginByPassword(
      // @ts-ignore
      candidate.id,
      password,
      // @ts-ignore
      candidate.password,
    );
  }

  async loginByPassword(
    userId: UserId,
    inputPassword: string,
    userPassword: string,
  ): Promise<Token> {
    const isCorrectPassword: boolean = await bcrypt.compare(
      inputPassword,
      userPassword,
    );

    if (isCorrectPassword) {
      return this.generateToken(userId);
    } else {
      throw 'Incorrect password';
    }
  }

  generateToken(userId: UserId): Token {
    const expireValue: number = Number(
      this.configService.get<string>('auth.jwt_expire_time_value'),
    );
    const expireUnit: ManipulateType = this.configService.get<ManipulateType>(
      'auth.jwt_expire_time_type',
    );

    const expire_date = dayjs().add(expireValue, expireUnit).format();

    return {
      access_token: this.jwtService.sign({ user: userId }),
      refresh_token: this.jwtService.sign(
        { user: userId },
        {
          secret: this.configService.get<string>('auth.jwt_refresh_secret_key'),
          expiresIn: this.configService.get<string>(
            'auth.jwt_refresh_expire_time',
          ),
        },
      ),
      expire_date,
    };
  }

  async registration(user: CreateUserDto): Promise<Token> {
    const { phone_number, email, password } = user;

    try {
      if (phone_number) {
        const candidate = await this.userService.send(Pattern.GET_USER, {
          phone_number,
        });

        if (candidate) {
          throw new BadRequestException(
            `User with phone number ${phone_number} already exists`,
          );
        }
      } else if (email) {
        const candidate = await this.userService.send(Pattern.GET_USER, {
          email,
        });

        if (candidate) {
          throw new BadRequestException(
            `User with email ${email} already exists`,
          );
        }
      }

      // Decode password
      const bcryptPassword: string = await bcrypt.hash(password, 7);

      // @ts-ignore // Create user
      const user: User = await this.userService.send<User>(
        Pattern.CREATE_USER,
        new CreateUserDto({
          phone_number,
          email,
          password: bcryptPassword,
        }),
      );

      return this.generateToken(user.id);
    } catch (error: any) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: error,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async refreshToken(body: RefreshTokenDto): TokenResponse {
    try {
      const decodeToken: any = await this.jwtService.verify(
        body.refresh_token,
        {
          secret: this.configService.get<string>('auth.jwt_refresh_secret_key'),
        },
      );

      if (decodeToken.user) {
        return this.generateToken(decodeToken.user);
      }

      throw new UnauthorizedException();
    } catch (e) {
      throw new UnauthorizedException();
    }
  }
}
