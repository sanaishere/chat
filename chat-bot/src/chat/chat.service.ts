import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Chat } from './entity/chat.entity';
import { In, Repository } from 'typeorm';
import { Message } from 'src/message/entity/message.entity';
import { CreateChatDto } from './dtos/createChat.dto';
import { User } from 'src/users/entity/user.entity';
import { WebsocketGateway } from 'src/websocket/webSocket.gateaway';
import { UsersService } from 'src/users/users.service';
import { SearchDto } from './dtos/search.dto';
import Fuse from 'fuse.js';
import { Group } from 'src/group/entity/group.entity';

const Options = {
  keys: ['name'],
  threshold: 0.3,
};

const Options2 = {
  keys: ['text'],
  threshold: 0.3,
};
@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Chat) private chatRepository: Repository<Chat>,
    @InjectRepository(Message) private messageRepository: Repository<Message>,
    @InjectRepository(Group) private groupRepository: Repository<Group>,
    private userService: UsersService,
  ) {}

  async createChat(body: CreateChatDto, users: User[]) {
    let chat = await this.chatRepository.findOne({
      where: { name: body.name },
      relations: { messages: true },
    });
    if (!chat) {
      chat = this.chatRepository.create(body);
    } else {
      chat.messages.push(body.messages[0]);
    }
    chat.users = users;

    const monthDay = await this.getDay(body.messages[0].createdDate);
    const hourMinutes = await this.getHour(body.messages[0].createdDate);
    const createdChat = await this.chatRepository.save(chat);
    return { createdChat, monthDay, hourMinutes };
  }
  async getChats(user: User) {
    try {
      return await this.chatRepository
        .createQueryBuilder('chat')
        .innerJoinAndSelect('chat.users', 'users')
        .where('users.id=:userId', { userId: user.id })
        .leftJoinAndSelect('chat.users', 'allUsers')
        .orderBy('chat.created_at', 'DESC')
        .getMany();
    } catch (err) {
      throw new HttpException(err, HttpStatus.BAD_REQUEST);
    }
  }
  async getOne(id: number) {
    try {
      const chat = await this.chatRepository
        .createQueryBuilder('chat')
        .leftJoinAndSelect('chat.messages', 'message')
        .leftJoinAndSelect('chat.users', 'users')
        .where('chat.id=:id', { id: id })
        .getOne();

      if (chat === null) {
        throw new HttpException(
          `chat not found`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      return chat;
    } catch (err) {
      throw new HttpException(err, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getchatMessages(id: number) {
    try {
      const chatMessages = await this.messageRepository
        .createQueryBuilder('message')
        .innerJoin('message.chat', 'chat')
        .innerJoinAndSelect('message.sender', 'user1')
        .innerJoinAndSelect('message.writer', 'user2')
        .where('chat.id=:chatId', { chatId: id })
        .orderBy('message.createdDate', 'DESC')
        .getMany();
      const messages = await Promise.all(
        chatMessages.map(async (message) => {
          return {
            hour: await this.getHour(message.createdDate),
            date: await this.getDay(message.createdDate),
            message,
          };
        }),
      );
      return messages;
    } catch (err) {
      throw new HttpException(err, HttpStatus.BAD_REQUEST);
    }
  }
  async checkChat(users: User[]) {
    let userIds = users.map((u) => u.id);
    console.log(userIds);
    let chat;

    try {
      chat = await this.chatRepository
        .createQueryBuilder('chat')
        .innerJoinAndSelect('chat.users', 'users1')
        .innerJoinAndSelect('chat.users', 'users2')
        .where('users1.id = :userId', { userId: userIds[0] })
        .andWhere('users2.id = :userId2', { userId2: userIds[1] })
        .getOne();
    } catch (err) {
      throw new HttpException(err, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    let name = '';
    if (chat && !chat.name.startsWith('#')) {
      name = chat.name;
    }

    return name;
  }
  async deleteChat(id: number) {
    await this.deleteFromMessage(id);
    await this.deleteFromUsers(id);
    try {
      await this.chatRepository.delete(id);
    } catch (err) {
      throw new HttpException(err, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteFromMessage(chatId: number) {
    let messages = await this.messageRepository.find({
      where: { chat: { id: chatId } },
      relations: { chat: true },
    });
    if (messages) {
      messages.forEach(async (m) => {
        await this.messageRepository.delete(m.id);
      });
    }
  }

  async deleteFromUsers(chatId: number) {
    try {
      let chat = await this.getOne(chatId);
      chat.users = null;
      await this.chatRepository.save(chat);
    } catch (err) {
      throw new HttpException(err, HttpStatus.BAD_REQUEST);
    }
  }

  async checkAdmission(user: User, chatId: number) {
    const chat = await this.getOne(chatId);
    let userIds = chat.users.map((u) => u.id);
    if (!userIds.includes(user.id)) {
      throw new HttpException(
        'you dont have access to see/change this chat',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  async getHour(date: Date) {
    const hour = date.getHours();
    const minutes = date.getMinutes();
    return `${hour}:${minutes}`;
  }

  async getDay(date: Date) {
    const day = date.getDate();
    const monthIndex = date.getMonth();
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    const month = monthNames[monthIndex];
    return `${day} ${month}`;
  }

  async deleteGroupChats(name: string) {
    const founded = await this.chatRepository.findOne({
      where: { name: name },
    });
    if (founded) {
      await this.deleteChat(founded.id);
    }
  }

  async deletechatsForRemovedUser(name: string, removed: User) {
    let founded = await this.chatRepository.findOne({
      where: { name: name },
      relations: { users: true },
    });

    let filtered = [];
    if (founded) {
      filtered = founded.users.filter((user) => user.id !== removed.id);
      console.log(filtered);
      founded.users = filtered;
      await this.chatRepository.save(founded);
    }
  }

  async searchChat(search: SearchDto, user: User) {
    let { text } = search;
    const groups = await this.groupRepository.find({
      where: { groupMembers: { id: user.id } },
    });

    const chats = await this.getChats(user);
    let fuse = new Fuse(chats, Options);
    let fuse2 = new Fuse(groups, Options);
    let data = fuse.search(text);
    let data2 = fuse2.search(text);
    let returnvalue = data.map(({ item }) => item);
    let returnvalue2 = data2.map(({ item }) => item);
    return { returnvalue, returnvalue2 };
  }

  async searchMessage(search: SearchDto, user: User, id: number) {
    let { text } = search;
    const chat = await this.getOne(id);
    let messages = chat.messages;
    let fuse = new Fuse(messages, Options2);
    let data = fuse.search(text).map(({ item }) => item);
    return data;
  }

  async getUnSeenMessagges(user: User) {
    let id = user.id;
    let query = `SELECT message.id, message.isSeen,users.firstname
        FROM chat 
        LEFT JOIN users_chats_chat ON chat.id = users_chats_chat.chatId 
        LEFT JOIN users ON users_chats_chat.usersId = users.id 
        LEFT JOIN message ON chat.id = message.chatId 
        WHERE message.isSeen = false 
        AND message.senderId != ${id} AND
         ${id} IN (SELECT usersId FROM users_chats_chat WHERE chatId = chat.id)`;
    try {
      let chat = await this.chatRepository.query(query);
      console.log(chat);
    } catch (err) {
      throw new HttpException(err, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
