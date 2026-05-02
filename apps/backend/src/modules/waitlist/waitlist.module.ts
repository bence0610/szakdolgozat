import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match, Ticket, Waitlist } from '../../database/entities';
import { AuthModule } from '../auth/auth.module';
import { WaitlistController } from './waitlist.controller';
import { WaitlistService } from './waitlist.service';
import { WaitlistNotificationService } from './waitlist-notification.service';
import { WaitlistExpireJob } from './jobs/waitlist-expire.job';

@Module({
  imports: [TypeOrmModule.forFeature([Waitlist, Match, Ticket]), AuthModule],
  controllers: [WaitlistController],
  providers: [WaitlistService, WaitlistNotificationService, WaitlistExpireJob],
  exports: [WaitlistService, WaitlistNotificationService],
})
export class WaitlistModule {}
