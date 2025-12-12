import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { ConfigModule } from '@nestjs/config';
import { EmailListener } from './listeners/email.listener';

@Module({
  imports: [ConfigModule],
  providers: [EmailService, EmailListener],
  exports: [EmailService],
})
export class CommonModule {}