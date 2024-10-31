import { Module } from '@nestjs/common';
import { SmsController, UsersController, verifyController } from './users.controller';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { MulterModule } from '@nestjs/platform-express';
import { Otp } from './entity/otp.entity';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategy/jwt.strategy';
import { ScheduleModule } from '@nestjs/schedule';
import { WebsocketModule } from 'src/websocket/websocket.module';
import { forwardRef } from '@nestjs/common';
import { Message } from 'src/message/entity/message.entity';
import { CacheService } from './cache/cache.service';
require('dotenv').config()
@Module({
imports:[TypeOrmModule.forFeature([User,Otp,Message]),
MulterModule.register({dest:'./files'})
,PassportModule,
JwtModule.register({secret:process.env.JWTSECRET
  ,signOptions:{expiresIn:'30d'}
}),
ScheduleModule.forRoot(),],

  controllers: [UsersController,SmsController,verifyController],
  providers: [UsersService,JwtStrategy,CacheService],
  exports:[UsersService]
})
export class UsersModule {}
