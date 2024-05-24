import { ConnectedSocket, MessageBody, OnGatewayConnection, SubscribeMessage, WebSocketGateway, WebSocketServer, WsResponse } from '@nestjs/websockets';
import { Server,Socket } from 'socket.io';
import { Group } from '../group/entity/group.entity';
import { Observable, from, map } from 'rxjs';
import cors from 'cors';
import { UsersService } from 'src/users/users.service';
import { Inject, Injectable, Request } from '@nestjs/common';
import { GroupService } from 'src/group/group.service';
import { forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/users/entity/user.entity';
import { Message } from 'src/message/entity/message.entity';
import { Chat } from 'src/chat/entity/chat.entity';
let handleUnSeenMessages=[]
@WebSocketGateway({
    cors: {
        origin: '*',
      },
    }
)
export class WebsocketGateway implements OnGatewayConnection {
    constructor(private userService:UsersService,
      @InjectRepository(Group) private groupRepository:Repository<Group>,
      @InjectRepository(Chat) private chatRepository:Repository<Chat>
    ) {}
    
   @WebSocketServer() server: Server;
  
 async  handleConnection(client: Socket) {
      console.log(client.id,"connected")
      console.log(client.handshake.headers.authorization)
      client.emit(' hello','hi')
      
        const payload=await this.userService.verifyToken(client.handshake.headers.authorization)
       await this.userService.setSocketId(payload,client.id)
       await this.joinGroupsConnect(client.id)
       await this.getUnSeenMessagges(client.id)
        
   }

   async handleDisconnect(socket: Socket) {
    const user = await this.userService.findBySocketId(socket.id);
    if (user) {
       await this.userService.setSocketId(user.id,null)
    }
}
    
  
  

  emitToClients(clientIds: number[], event: string, payload: Group) {
   // clientIds.forEach((clientId) => {
    console.log("payload from server",{payload})
        this.server.emit('groupCreated', payload);
      //});
    
  }

  @SubscribeMessage('join room')
  join(@MessageBody() data: any,@ConnectedSocket() socketId:any) {
    console.log(data,socketId)
    let roomName=`group${data.groupId}`
   this.server.in(socketId).socketsJoin(roomName)
   console.log(roomName)
   this.server.to(roomName).emit('join room',data)
    
  }

  @SubscribeMessage('remove room')
  remove(@MessageBody() data: any,@ConnectedSocket() sockets:any) {
    console.log(data,sockets)
    let roomName=`group${data.groupId}`
   this.server.in(sockets).socketsLeave(roomName)
   this.server.to(roomName).emit('leave room',data)
    
  }

  @SubscribeMessage('send message')
  sendMessage(@MessageBody() data: Message,@ConnectedSocket() socket:User) {
    console.log("socket",socket.socketId)
    if(socket.socketId===null){
      handleUnSeenMessages.push({'userId':socket.id,'message':data})
    }
    console.log(handleUnSeenMessages)

   this.server.to(socket.socketId).emit('send message',data)

  }

  @SubscribeMessage('send message group')
  sendMessageToGroup(@MessageBody() data: any,@ConnectedSocket() sockets:User[],sender:User) {
    console.log()
    let roomName=`group${data.groupId}`
    for(let socket of sockets){
      if(socket.socketId===null){
        handleUnSeenMessages.push({'userId':socket.id,'message':data})
      }
    }
    this.server.to(roomName).emit('send message',data)
    if (!sockets.includes(sender)){
      this.server.to(sender.socketId).emit('send message',data)
    }

  }

  @SubscribeMessage('delete message')
  deleteMessage(id:number) {
    this.server.emit('delete message',id)
  
  }

  async getUserGroups(user){
    let Allgroups=[]
    const groups=await this.groupRepository.find({where:{groupMembers:{id:user.id}}})
    const groupAsAdmin=await this.groupRepository.find({where:{admin:{id:user.id}}})
    Allgroups=groups.concat(groupAsAdmin)
    console.log(Allgroups)
    return Allgroups;
  }
  async joinGroupsConnect(socketId:string){
   const user=await this.userService.findBySocketId(socketId)
   const groups=await this.getUserGroups(user)
   
   for(let group of groups){
    let roomName=`group${group.id}`
    this.server.in(socketId).socketsJoin(roomName)
   }
   this.server.emit('room','connecting')
  }

async happyBirthDay(socket:User){

this.server.to(socket.socketId).emit('congrats',`happyBirth day dear ${socket.firstname} `)
}

async getUnSeenMessagges(clientId:string){
const user=await this.userService.findBySocketId(clientId)
console.log(user)
let userId=user.id
for (let item of handleUnSeenMessages){
  if(item['userId']===userId){
    this.server.to(clientId).emit('send message',item['message'])
  }
}
}
}