import { Module } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [PortfolioService],
  exports: [PortfolioService],
})
export class PortfolioModule {}
