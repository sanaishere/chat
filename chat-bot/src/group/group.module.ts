import { Module } from '@nestjs/common';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from './entity/group.entity';
import { WebsocketGateway } from '../websocket/webSocket.gateaway';
import { UsersModule } from 'src/users/users.module';
import { WebsocketModule } from 'src/websocket/websocket.module';
import { ChatModule } from 'src/chat/chat.module';
import { forwardRef } from '@nestjs/common';
@Module({
  imports: [
    TypeOrmModule.forFeature([Group]),
    UsersModule,
    ChatModule,
    WebsocketModule,
  ],
  controllers: [GroupController],
  providers: [GroupService],
  exports: [GroupService],
})
export class GroupModule {}
