import { Module } from '@nestjs/common';
import { BudgetItemsService } from './budget-items.service';
import { BudgetItemsController } from './budget-items.controller';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [EventsModule],
  controllers: [BudgetItemsController],
  providers: [BudgetItemsService],
})
export class BudgetItemsModule {}
