import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus, ValidationPipe } from '@nestjs/common';
import { EventProducerService } from '../services/event-producer.service';
import { PublishEventDto, PublishBatchDto } from '../dtos/event.dto';

@Controller('events')
export class EventController {
  constructor(private readonly eventProducer: EventProducerService) {}

  /**
   * Publish single event
   */
  @Post('publish')
  @HttpCode(HttpStatus.CREATED)
  async publishEvent(@Body(ValidationPipe) publishDto: PublishEventDto) {
    await this.eventProducer.publishEvent(
      publishDto.topic,
      publishDto.data,
      {
        priority: publishDto.priority,
        source: publishDto.source,
        correlationId: publishDto.correlationId,
        userId: publishDto.userId,
        key: publishDto.key,
      },
    );

    return {
      success: true,
      message: 'Event published successfully',
    };
  }

  /**
   * Publish batch of events
   */
  @Post('publish-batch')
  @HttpCode(HttpStatus.CREATED)
  async publishBatch(@Body(ValidationPipe) batchDto: PublishBatchDto) {
    await this.eventProducer.publishBatch(batchDto.topic, batchDto.events);

    return {
      success: true,
      message: `Batch published successfully (${batchDto.events.length} events)`,
    };
  }

  /**
   * Check if event was processed
   */
  @Get('processed/:eventId')
  async checkProcessed(@Param('eventId') eventId: string) {
    const isProcessed = await this.eventProducer.isEventProcessed(eventId);

    return {
      success: true,
      data: {
        eventId,
        processed: isProcessed,
      },
    };
  }
}
