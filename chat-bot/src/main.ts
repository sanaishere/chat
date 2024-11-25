import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { config } from 'dotenv';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from 'common/HttpException';
import cors from 'cors';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationExceptionFilter } from 'common/validationException';
config({ path: 'E:/chat-bot/chat-bot/.env' });

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalFilters(new ValidationExceptionFilter());
  const config = new DocumentBuilder()
    .setTitle('Chat')
    .setDescription('chat system')
    .setVersion('1.0')
    .addTag('marvel')
    .build();
  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, document);
  await app.listen(5000);
}
bootstrap();
