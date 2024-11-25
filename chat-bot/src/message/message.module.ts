import { Module, forwardRef } from '@nestjs/common';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entity/message.entity';
import { Chat } from 'src/chat/entity/chat.entity';
import { UsersModule } from 'src/users/users.module';
import { ChatModule } from 'src/chat/chat.module';
import { WebsocketModule } from 'src/websocket/websocket.module';
import { Group } from 'src/group/entity/group.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([Message]),
    TypeOrmModule.forFeature([Group]),
    UsersModule,
    ChatModule,
    WebsocketModule,
  ],
  controllers: [MessageController],
  providers: [MessageService],
  exports: [MessageService],
})
export class MessageModule {}
