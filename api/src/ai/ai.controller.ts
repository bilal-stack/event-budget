import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AiService } from './ai.service';
import { ChatDto } from './dto/chat.dto';
import { CurrentUser } from '../auth/decorators/user.decorator';

@Controller('events/:eventId/ai')
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('chat')
  chat(
    @CurrentUser() user: { userId: string; workspaceId: string },
    @Param('eventId') eventId: string,
    @Body() dto: ChatDto,
  ) {
    return this.aiService.chat(eventId, user.workspaceId, dto.message);
  }

  @Get('proposal')
  getProposal(
    @CurrentUser() user: { userId: string; workspaceId: string },
    @Param('eventId') eventId: string,
  ) {
    return this.aiService.getPendingProposal(eventId, user.workspaceId);
  }

  @Post('approve')
  approve(
    @CurrentUser() user: { userId: string; workspaceId: string },
    @Param('eventId') eventId: string,
  ) {
    return this.aiService.approve(eventId, user.workspaceId);
  }

  @Post('reject')
  reject(
    @CurrentUser() user: { userId: string; workspaceId: string },
    @Param('eventId') eventId: string,
  ) {
    return this.aiService.reject(eventId, user.workspaceId);
  }
}
