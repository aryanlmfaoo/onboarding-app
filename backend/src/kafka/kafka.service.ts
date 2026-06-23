import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { Kafka, Producer, logLevel } from 'kafkajs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;
  private readonly logger = new Logger(KafkaService.name);

  constructor(private readonly configService: ConfigService) {
    this.kafka = new Kafka({
      clientId: this.configService.getOrThrow<string>('KAFKA_CLIENT_ID'),
      brokers: [this.configService.getOrThrow<string>('KAFKA_BROKER')],
      logLevel: logLevel.NOTHING,
    });

    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    await this.producer.connect();
    this.logger.log(`Connected to Kafka Producer.`);
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
  }

  async documentUploaded(documentId: string, s3Key: string) {
    await this.producer.send({
      topic: this.configService.getOrThrow('KAFKA_TOPIC'),
      messages: [
        {
          value: JSON.stringify({ documentId, s3Key }),
        },
      ],
    });
  }
}
