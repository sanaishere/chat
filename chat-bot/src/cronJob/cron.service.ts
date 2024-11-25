import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entity/user.entity';
import { WebsocketGateway } from 'src/websocket/webSocket.gateaway';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { Message } from 'src/message/entity/message.entity';

@Injectable()
export class CronService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private webSocket: WebsocketGateway,
    @InjectRepository(Message) private messageRepository: Repository<Message>,
  ) {}
  @Cron('0 0 * * * *')
  async sendHappyBirthDay() {
    let users = await this.userRepository.find({});
    const today = new Date();
    for (let user of users) {
      const birthDate = user.DateOfBirth;
      if (
        birthDate.getDate() === today.getDate() &&
        birthDate.getMonth() === today.getMonth()
      ) {
        const message = this.messageRepository.create({
          text: `happy birthday dear ${user.firstname} `,
        });
        message.sender = null;
        message.writer = null;
        this.webSocket.sendMessage(message, user);
      }
    }
  }
}
