import { HttpException, HttpStatus, Injectable, Request } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entity/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { sign, verify } from 'jsonwebtoken';
import * as jwt from 'jsonwebtoken';
import { Express } from 'express';
import { URL } from 'common/app.url';
import { OtpDto } from './dto/otp.dto';
import { addMinutes } from 'date-fns';
import { Otp } from './entity/otp.entity';
import axios from 'axios';
import { UpdateUserDto } from './dto/update_user.dto';
import * as bcrypt from 'bcryptjs';
import { Cron } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { Message } from 'src/message/entity/message.entity';
import { CacheService } from './cache/cache.service';

require('dotenv').config();
let connections = [];
@Injectable()
export class UsersService {
  request: Request;

  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Otp) private otpRepository: Repository<Otp>,
    @InjectRepository(Message) private messageRepository: Repository<Message>,
    private cacheService: CacheService,
  ) {}

  async create(body: CreateUserDto, profileSrc: string) {
    try {
      const created = this.userRepository.create(body);
      created.profilePhotoSrc =
        profileSrc == '' ? '' : `${URL}/users/${profileSrc}`;
      await this.userRepository.save(created);

      return {
        ...created,
        username: created.firstname + '' + created.lastname,
        acessToken: await this.createToken(created.id),
      };
    } catch (err) {
      throw new HttpException(err, HttpStatus.BAD_REQUEST);
    }
  }

  async createToken(payload: any) {
    const token = sign({ payload }, process.env.JWTSECRET, {
      expiresIn: process.env.EXPIRES,
    });
    // console.log(token)
    return token;
  }

  async verifyToken(token: any) {
    console.log(token);
    try {
      const payload = verify(token, process.env.JWTSECRET);
      console.log(payload);
      return payload['payload'];
    } catch (err) {
      throw new HttpException(err, HttpStatus.BAD_GATEWAY);
    }
  }

  //   async setSocketId(userId:number,socketId:any) {
  //     await this.cacheService.setValue(userId.toString(),socketId)
  //   }

  //   async findBySocketId(socketId:string) {
  //     try{
  //       return await this.cacheService.getValue()
  //          }catch(err){
  //              throw new HttpException('client is disconnected',HttpStatus.BAD_REQUEST)
  //          }
  //   }

  async findById(id: number) {
    console.log(id);
    const user = await this.userRepository.findOne({
      where: { id: id },
      relations: ['blockedUsers', 'sentMessages', 'writeMessages'],
    });
    if (!user) {
      throw new HttpException(
        `user not found with id ${id}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return user;
  }

  async sendSMS(to: string) {
    try {
      const otp = Math.floor(100000 + Math.random() * 900000);
      let message = otp.toString();
      console.log(process.env.USERNAME1);
      const response = await axios.post('http://ippanel.com/api/select', {
        op: 'send',
        uname: process.env.USERNAME1,
        pass: process.env.PASSWORD,
        message: message,
        from: process.env.FROM,
        to: [to],
      });

      const verifyToken = await this.createToken(otp);
      const created = this.otpRepository.create({
        otp: await bcrypt.hash(otp.toString(), 10),
        expiresIn: addMinutes(new Date(), 30),
        token: verifyToken,
      });
      await this.otpRepository.save(created);
      const url = `${URL}/verify/${verifyToken}`;
      if (response.data[0] !== 0) {
        throw new HttpException(response.data[1], HttpStatus.BAD_REQUEST);
      }
      return { verify: url, response: response.data };
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  async verifyOtp(verify: string, body: OtpDto) {
    console.log(verify);
    const foundOtp = await this.otpRepository.findOne({
      where: { token: verify },
    });
    console.log(foundOtp.otp);
    console.log(body.otp);
    if (!foundOtp) {
      throw new HttpException('otp not found', HttpStatus.NOT_FOUND);
    }

    if (foundOtp.expiresIn < new Date()) {
      await this.otpRepository.delete(foundOtp);
      throw new HttpException('otp is expired', HttpStatus.BAD_REQUEST);
    } else if (!bcrypt.compare(body.otp.toString(), foundOtp.otp)) {
      throw new HttpException(
        'your verification code is wrong',
        HttpStatus.BAD_REQUEST,
      );
    } else if (bcrypt.compare(body.otp.toString(), foundOtp.otp)) {
      await this.otpRepository.delete(foundOtp);
      return { message: 'successfully login', url: `${URL}/users/register` };
    }
  }

  async editProfile(body: UpdateUserDto, src: string, id: number) {
    const found = await this.findById(id);
    Object.assign(found, body);
    if (src !== '') {
      found.profilePhotoSrc = src == '' ? '' : `${URL}/users/${src}`;
    }
    return await this.userRepository.save(found);
  }

  async blockUser(id: number, user: User) {
    const userToBlock = await this.findById(id);
    user.blockedUsers.push(userToBlock);
    await this.userRepository.save(user);
    return user.blockedUsers;
  }
  async checkBlockStatus(sender: User, reciver: User) {
    let blockUserIds = reciver.blockedUsers.map((u) => u.id);
    for (let id of blockUserIds) {
      if (sender.id === id) {
        throw new HttpException(
          'you are blocked by user',
          HttpStatus.BAD_REQUEST,
        );
      }
    }
  }

  async login(phone: string) {
    try {
      const user = await this.userRepository.findOneOrFail({
        where: { phoneNumber: phone },
      });
      return { user, accessToken: await this.createToken(user.id) };
    } catch (err) {
      throw new HttpException('you are not registered', HttpStatus.BAD_REQUEST);
    }
  }

  // async deleteUserchats(chatId:number){
  //     const users=await this.userRepository.find({where:{chats:{id:chatId}},relations:{chats:true}})
  //     try{
  //     users.map((u)=>{
  //          this.userRepository.delete(u.id)

  //     })
  //     await this.userRepository.save(users)
  //   }catch(err){
  //     throw new HttpException(err,HttpStatus.INTERNAL_SERVER_ERROR)
  //   }
  // }

  async logOut(req: any) {
    try {
      const user = await this.findById(req.user.id);
      await this.nullifySenderMessageUserId(user.sentMessages);
      await this.nullifyWriterUserInMessages(user.writeMessages);
      await this.userRepository.delete(user.id);
      req.headers.authorization.split(' ')[1] = '';
      return `user with id ${user.id} is logged out`;
    } catch (err) {
      throw new HttpException(err, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  async nullifySenderMessageUserId(messages: Message[]) {
    for (let message of messages) {
      message.sender = null;
      await this.messageRepository.save(message);
    }
  }
  async nullifyWriterUserInMessages(messages: Message[]) {
    for (const message of messages) {
      message.writer = null;
      await this.messageRepository.save(message);
    }
  }
}
