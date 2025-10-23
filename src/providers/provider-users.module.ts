import { Module } from '@nestjs/common';
import { ProviderUsersService } from './provider-users.service';
import { DatabaseModule } from '../database/database.module';
import { ProvidersModule } from './providers.module';
import { ProvidersService } from './providers.service';
import { ProvidersController } from './providers.controller';

@Module({
  imports: [DatabaseModule, ProvidersModule],
  providers: [ProviderUsersService, ProvidersService],
  exports: [ProviderUsersService],
  controllers: [ProvidersController],
})
export class ProviderUsersModule {}
