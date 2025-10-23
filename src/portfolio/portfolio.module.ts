import { Module } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { DatabaseModule } from '../database/database.module';
import { PortfolioController } from './portfolio.controller';

@Module({
  imports: [DatabaseModule],
  providers: [PortfolioService],
  exports: [PortfolioService],
  controllers: [PortfolioController],
})
export class PortfolioModule {}
