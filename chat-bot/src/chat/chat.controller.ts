import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { AuthGuard } from '@nestjs/passport';
import { SearchDto } from './dtos/search.dto';
import { User } from 'src/users/entity/user.entity';

@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}
  @Get()
  @UseGuards(AuthGuard('jwt'))
  async getChats(@Request() { user }) {
    return await this.chatService.getChats(user);
  }
  @Get('unseen')
  @UseGuards(AuthGuard('jwt'))
  async getUnSeen(@Request() { user }) {
    return await this.chatService.getUnSeenMessagges(user);
  }
  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async getChat(@Request() { user }, @Param('id') id: number) {
    await this.chatService.checkAdmission(user, id);
    return await this.chatService.getchatMessages(id);
  }

  // @Get('users/:id')
  // @UseGuards(AuthGuard('jwt'))
  // async getUsers(@Request() {user},@Param('id') id:number){
  //     return await this.chatService.getOne(id)

  // }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async DeleteChat(@Param('id') chatId: number, @Request() { user }) {
    await this.chatService.checkAdmission(user, chatId);
    return this.chatService.deleteChat(chatId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async deleteChatMessages(@Param('id') chatId: number, @Request() { user }) {
    await this.chatService.checkAdmission(user, chatId);
    return this.chatService.deleteFromMessage(chatId);
  }

  @Post()
  async check(@Body() body: any) {
    return await this.chatService.checkChat(body.ids);
  }
}
@Controller('search')
export class searchController {
  constructor(private chatService: ChatService) {}
  @Get()
  @UseGuards(AuthGuard('jwt'))
  async searchByName(@Query() search: SearchDto, @Request() { user }) {
    return await this.chatService.searchChat(search, user);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async searchByMessage(
    @Query() search: SearchDto,
    @Request() { user },
    @Param('id') id: number,
  ) {
    return await this.chatService.searchMessage(search, user, id);
  }
}
