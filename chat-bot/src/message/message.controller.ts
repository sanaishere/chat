import { Body, Controller, Delete, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { MessageService } from './message.service';
import { CreateMessageDto } from './dtos/createMessage.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ForwardMessageDto } from './dtos/forwardmessage.dto';

@Controller('message')
export class MessageController {
    constructor(private messageService:MessageService){}
    
    @Post('write/:userId')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    async writeMessage(@Body() body:CreateMessageDto,@Request() {user},@Param('userId') id:number){
        return await this.messageService.sendmessageToUser(id,user,user,body)
    }

    @Post('forward')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    async forwardMessage(@Body() body:ForwardMessageDto,@Request() {user},@Query('messageIds') messageIds:string){
        let messageIds2=messageIds.split('&')
        return await this.messageService.forwardMessages(user,body,messageIds2)
    }

    @Post('sendGroup/:groupId')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    async writeMessageToGroup(@Body() body:CreateMessageDto,@Request() {user},@Param('groupId') id:number){
       await this.messageService.checkRoles(user,[id])
        return await this.messageService.sendMessageToGroup(id,user,user,body)
    }

    @Post('forwardGroup')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    async forwardMessageToGroup(@Body() body:ForwardMessageDto,@Request() {user},@Query('messageIds') messageIds:string){
       await this.messageService.checkRoles(user,body.reciversId)
       let messageIds2=messageIds.split('&')
       let turnIdsToNumbers=messageIds2.map((m)=>Number(m))
        return await this.messageService.forwardmessagesToGroup(user,body,turnIdsToNumbers)
    }

    
    @Delete(':id')
    @UseGuards(AuthGuard('jwt'))
    async deleteMessage(@Param('id') id:number,@Request() {user}){
        await this.messageService.checkAdmission(user,id)
        return await this.messageService.deleteMessage(id)

    }

    @Put(':id')
    @UseGuards(AuthGuard('jwt'))
    async updateMessage(@Param('id') id:number,@Request() {user},@Body() body:CreateMessageDto){
      await  this.messageService.checkAdmission(user,id)
        return await this.messageService.updateMessage(user,id,body)
    }

    

    

    
}
