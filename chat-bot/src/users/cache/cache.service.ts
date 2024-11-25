import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
@Injectable()
export class CacheService {
  redisClient: Redis;
  constructor() {
    this.redisClient = new Redis({
      host: 'localhost',
      port: 6379,
    });
  }
  async setValue(key: string, value: string) {
    await this.redisClient.set(key, value);
  }

  async getValue(key: string): Promise<string> {
    return await this.redisClient.get(key);
  }

  async delete(key: string) {
    await this.redisClient.del(key);
  }

  async setUsersNotSawMessages(users: string) {
    await this.redisClient.sadd('usersNotSaw', users);
  }

  async getUsersNotSawMessages() {
    return await this.redisClient.smembers('usersNotSaw');
  }
}
