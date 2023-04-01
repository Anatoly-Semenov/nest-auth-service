import { Type } from 'class-transformer';

export class ResponseTokenDto {
  @Type(() => String)
  access_token: string;

  @Type(() => String)
  refresh_token: string;

  @Type(() => String)
  expire_date: string;

  constructor(partial?: Partial<ResponseTokenDto>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
