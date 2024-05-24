import { Module, forwardRef } from '@nestjs/common';
import { ChatController, searchController } from './chat.controller';
import { ChatService } from './chat.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chat } from './entity/chat.entity';
import { UsersModule } from 'src/users/users.module';
import { Message } from 'src/message/entity/message.entity';
import { WebsocketModule } from 'src/websocket/websocket.module';
import { Group } from 'src/group/entity/group.entity';
@Module({
  imports:[TypeOrmModule.forFeature([Chat,Message,Group]),UsersModule],
  controllers: [ChatController,searchController],
  providers: [ChatService],
  exports:[ChatService]
})
export class ChatModule {}
