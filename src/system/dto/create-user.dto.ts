import { Type } from 'class-transformer';
import { IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsOptional()
  @Type(() => String)
  phone_number: string;

  @IsOptional()
  @Type(() => String)
  email: string;

  @Type(() => String)
  password: string;

  constructor(partial?: Partial<CreateUserDto>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
