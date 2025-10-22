import { Module } from '@nestjs/common';
import { SearchService } from './search.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
