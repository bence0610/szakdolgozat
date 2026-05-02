import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QrService } from './qr.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [QrService],
  exports: [QrService],
})
export class QrModule {}
