import { Module } from '@nestjs/common';
import { ProviderUsersService } from './provider-users.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [ProviderUsersService],
  exports: [ProviderUsersService],
})
export class ProviderUsersModule {}
