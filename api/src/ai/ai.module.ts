import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { GeminiService } from './gemini.service';
import { EventsModule } from '../events/events.module';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [EventsModule, GatewayModule],
  controllers: [AiController],
  providers: [AiService, GeminiService],
})
export class AiModule {}
