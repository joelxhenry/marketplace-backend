import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { DatabaseModule } from '../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [DatabaseModule, NotificationsModule],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
