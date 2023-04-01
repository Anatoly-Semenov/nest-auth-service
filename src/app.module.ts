import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import MainConfig from './system/config/main.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [MainConfig],
      isGlobal: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
