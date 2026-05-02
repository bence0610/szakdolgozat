import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';
import { EmailTemplateService } from './email-template.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [EmailTemplateService, EmailService],
  exports: [EmailService],
})
export class EmailModule {}
