import { Type } from 'class-transformer';

export class RefreshTokenDto {
  @Type(() => String)
  refresh_token: string;

  constructor(partial?: Partial<RefreshTokenDto>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
