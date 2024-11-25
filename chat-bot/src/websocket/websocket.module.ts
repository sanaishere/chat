import { Module } from '@nestjs/common';
import { WebsocketGateway } from './webSocket.gateaway';
import { UsersModule } from 'src/users/users.module';
import { forwardRef } from '@nestjs/common';
import { GroupService } from 'src/group/group.service';
import { GroupModule } from 'src/group/group.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from 'src/group/entity/group.entity';
import { Chat } from 'src/chat/entity/chat.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Group, Chat]), UsersModule],
  providers: [WebsocketGateway],
  exports: [WebsocketGateway],
})
export class WebsocketModule {}
