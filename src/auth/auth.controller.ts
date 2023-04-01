import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { CreateUserDto } from '../system/dto';
import { RefreshTokenDto, ResponseTokenDto } from './dto';
import { Pattern } from './enums/pattern.enum';

@Controller('auth-service')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern(Pattern.LOGIN)
  login(@Payload() CreateUserDto: CreateUserDto) {
    return this.authService.login(CreateUserDto);
  }

  @MessagePattern(Pattern.REGISTRATION)
  registration(@Payload() user: CreateUserDto) {
    return this.authService.registration(user);
  }

  @MessagePattern(Pattern.REFRESH_TOKEN)
  refreshToken(@Payload() body: RefreshTokenDto) {
    return this.authService.refreshToken(body);
  }
}
