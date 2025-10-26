import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ThemesService } from './themes.service';
import { ThemesController, ProviderThemesController } from './themes.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [ThemesController, ProviderThemesController],
  providers: [ThemesService],
  exports: [ThemesService],
})
export class ThemesModule {}
