import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
 import { WinstonModule } from 'nest-winston';
import { AuthModule } from './auth/auth.module';
import * as winston from 'winston';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.simple(),
          ),
        }),
      ],
    }),

    MongooseModule.forRoot(
      process.env.MONGO_URI || 'mongodb://localhost:27017/nest-auth',
    ),
  CommonModule,
    UsersModule,
    AuthModule,
  ],
})
export class AppModule {}
