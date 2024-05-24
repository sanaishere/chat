import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Message } from './entity/message.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/entity/user.entity';
import { Chat } from 'src/chat/entity/chat.entity';
import { CreateMessageDto } from './dtos/createMessage.dto';
import { ForwardMessageDto } from './dtos/forwardmessage.dto';
import { types } from './entity/message.entity';
import { UsersService } from 'src/users/users.service';
import { ChatService } from 'src/chat/chat.service';
import { WebsocketGateway } from 'src/websocket/webSocket.gateaway';
import { Group } from 'src/group/entity/group.entity';
import { SearchDto } from 'src/chat/dtos/search.dto';
@Injectable()
export class MessageService {
    constructor(@InjectRepository(Message) private messageRepository:Repository<Message>,
    @InjectRepository(Group) private groupRepository:Repository<Group>,
    private usersService:UsersService,
    private chatService:ChatService,
    private webSocketGateAway:WebsocketGateway){}


    async sendmessageToUser(recieverId:number,sender:User,writer:User,body:CreateMessageDto){
    const reciever=await this.usersService.findById(recieverId)
    await this.usersService.checkBlockStatus(sender,reciever)
    const message = this.messageRepository.create({
      text: body.text,  
      sender: sender,  
      writer: writer  
  });
  
    await this.messageRepository.save(message)
    
     this.webSocketGateAway.sendMessage(message,reciever)
     let users=[sender,reciever]
     let foundName=await this.chatService.checkChat(users)
     
     let name=''
     if(foundName!==''){
         name=foundName
    }
    else{
      name=reciever.firstname +" " +reciever.lastname+sender.id+reciever.id
    }
    const chat= await this.chatService.createChat({messages:[message],name},users)
    return chat
   }
  

    async forwardMessages(sender:User,body:ForwardMessageDto,messageIds:string[]){
      let chats=[]
      let turnToIds=messageIds.map((m)=>Number(m))
      for(let messageId of turnToIds){
        for (let id of body.reciversId){
          let message=await this.getMessage(messageId)
          let body={text:message.text}
          const chat= await this.sendmessageToUser(id,sender,message.writer,body)
          chats.push(chat)
        }

      }
      return chats

    }

    async getMessage(id:number){
        const message=await this.messageRepository.findOne({where:{id}
            ,relations:{sender:true,writer:true,chat:true
        }})
        if(!message){
            throw new HttpException('message not found',HttpStatus.BAD_REQUEST)
        }
        return message
    }
    

    async deleteFromMessage(chatId:number){

      try{
      const messages=await this.messageRepository.find({where:{chat:{id:chatId}}})
      messages.forEach(async(m)=>{
        await this.messageRepository.delete(m.id)
      })
     
       }
      catch(err){
        throw new HttpException(err,HttpStatus.BAD_REQUEST)
      }
    }

    async deleteMessage(messageId:number){

      try{
     const message=await this.getMessage(messageId)
     await this.messageRepository.delete(messageId)
      this.webSocketGateAway.deleteMessage(messageId)
      }catch(err){
        throw new HttpException(err,HttpStatus.BAD_REQUEST)
      }
    }

    async updateMessage(user:User,id:number,body:CreateMessageDto){
      const message=await this.getMessage(id)
      Object.assign(message,body)
      return await this.messageRepository.save(message)

    }

    async checkAdmission(user:User,messageId:number){
      const message=await this.getMessage(messageId)
      if(message.sender.id!==user.id){
        throw new HttpException('you can not delete this message',HttpStatus.BAD_REQUEST)
      }
    }

    async sendMessageToGroup(groupId:number,sender:User,writer:User,body:CreateMessageDto){
     const group=await this.groupRepository.findOne({where:{id:groupId},relations:{groupMembers:true,admin:true}})
     if(!group){
      throw new HttpException('group is not found',HttpStatus.NOT_FOUND)
     }
    const message= this.messageRepository.create(body)
    message.writer=writer
    message.sender=sender
    await this.messageRepository.save(message)
    let users=group.groupMembers
    let admin=group.admin
    users.push(admin)
    this.webSocketGateAway.sendMessageToGroup({message,groupId},users,sender)
    if(!users.includes(sender)){
      users.push(sender)
    }
    
    
    let name=`#${groupId}`
    const chat= await this.chatService.createChat({messages:[message],name},users)
    return chat
    }

    async forwardmessagesToGroup(sender:User,body:ForwardMessageDto,messageIds:number[]){
      let chats=[]
      for(let messageId of messageIds){
        for (let id of body.reciversId){
          let message=await this.getMessage(messageId)
          let body2={text:message.text}
          const chat=await this.sendMessageToGroup(id,sender,message.writer,body2)
          chats.push(chat)
        }

      }
      return chats
    }

    async checkRoles(user:User,groupIds:number[]){
      for( let groupId of groupIds){
      const group=await this.groupRepository.findOne({where:{id:groupId},relations:{groupMembers:true}})
       let ids=group.groupMembers.map((u)=>u.id)
      if(!group){
        throw new HttpException('group is not found',HttpStatus.NOT_FOUND)
       }
       if(group.isPrivate&&!ids.includes(user.id)){
        throw new HttpException('you cannot send to this group',HttpStatus.UNAUTHORIZED)
       }

    }
  }
 


}
