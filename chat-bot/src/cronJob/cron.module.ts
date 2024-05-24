import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "src/users/entity/user.entity";
import { WebsocketModule } from "src/websocket/websocket.module";
import { ScheduleModule } from '@nestjs/schedule';
import { CronService } from "./cron.service";
import { MessageModule } from "src/message/message.module";
import { Message } from "src/message/entity/message.entity";


@Module({
    imports:[TypeOrmModule.forFeature([User,Message]),WebsocketModule,
      ScheduleModule.forRoot(),MessageModule ],
   
    providers: [CronService],
    exports:[]
  })
  export class CronModule {}