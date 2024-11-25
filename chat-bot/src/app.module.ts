import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { config } from 'dotenv';
import { join } from 'path';
import { ChatModule } from './chat/chat.module';
import { MessageModule } from './message/message.module';
import { GroupModule } from './group/group.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { WebsocketModule } from './websocket/websocket.module';
import { CronModule } from './cronJob/cron.module';

require('dotenv').config({ path: 'E:/chat-bot/chat-bot/.env' });
@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: 'E:/chat-bot/chat-bot/public/index.html',
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.HOST,
      port: 3306,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    }),

    UsersModule,
    CronModule,
    ChatModule,
    MessageModule,
    GroupModule,
    WebsocketModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  // configure(consumer: MiddlewareConsumer) {
  //   consumer
  //     .apply(AuthorizationMiddleware)
  //     .forRoutes({ path: '*', method: RequestMethod.ALL });
  // }
}
