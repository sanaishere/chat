import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Group } from './entity/group.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/entity/user.entity';
import { CreateGroupDto } from './dtos/creategroup.dto';
import { UsersService } from 'src/users/users.service';
import { WebsocketGateway } from '../websocket/webSocket.gateaway';
import { ChooseUserDto } from './dtos/addtogroup.dto';
import { ChatService } from 'src/chat/chat.service';
import { forwardRef } from '@nestjs/common';
@Injectable()
export class GroupService {
    constructor(@InjectRepository(Group) private groupRepository:Repository<Group>,
        private userService:UsersService,
        private chatService:ChatService,
        @Inject(forwardRef(()=>WebsocketGateway))
        private readonly websocketGateway: WebsocketGateway){}

    async createGroup(admin:User,body:CreateGroupDto){ console.log(body)
        try{
        const createdGroup= this.groupRepository.create(body)
        createdGroup.admin=admin
        const groupMembers = await Promise.all(
            body.groupMembersId.map((id) => this.userService.findById(id)),
          );
        createdGroup.groupMembers=groupMembers
        const saved=await this.groupRepository.save(createdGroup)

       this.websocketGateway.emitToClients(body.groupMembersId, 'groupCreated', saved);
        return saved;
        }catch(err){
            throw new HttpException(`error in creating group ${err}`,HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }
    async getGroups(){
        try{
            return await this.groupRepository.find({where:{isPrivate:false}})

        }catch(err){
            throw new HttpException(err,HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async getMyGroups(user:User){
        try{
            const foundGroupsAsMembers= await this.groupRepository.createQueryBuilder('group')
            .innerJoin('group.groupMembers', 'user')
            .where('user.id = :userId', { userId: user.id })
            .getMany()
           
            const foundGroupsAsAdmin= await this.groupRepository.createQueryBuilder('group')
            .innerJoin('group.admin', 'user')
            .where('user.id = :userId', { userId: user.id })
            .getMany()
            let data=Object.assign(foundGroupsAsAdmin,foundGroupsAsMembers)

            return {
                data
            }

        
        }catch(err){
            throw new HttpException(err,HttpStatus.INTERNAL_SERVER_ERROR)

        }
    }
    async getGroup(id:number){
        const group=await this.groupRepository.findOne({where:{id:id},
        relations:{admin:true,groupMembers:true}})
        if(!group){
            throw new HttpException(`group with id ${id} not found`,HttpStatus.BAD_REQUEST)
        }
        return group
    }

   async joinGroup(user: User, groupId: number) {
        const group=await this.getGroup(groupId)
        let memebers=group.groupMembers.map((u)=>u.id)
        if(group.admin===user || memebers.includes(user.id)){
            throw new HttpException(`you have already join group`,HttpStatus.BAD_REQUEST)
        }
        if(group.isPrivate==true){
        throw new HttpException(`you cant join private group`,HttpStatus.BAD_REQUEST)
        }
        group.groupMembers.push(user)
        
       
      this.websocketGateway.join({groupId,userId:user.id},user.socketId)
      return  await this.groupRepository.save(group)
        
    }

    async addToGroup(user: User, body:ChooseUserDto,groupId:number) {
        const group=await this.getGroup(groupId)
        if(group.admin.id!==user.id){
            throw new HttpException('you can not change group members',HttpStatus.UNAUTHORIZED)
        }
        let users=[]
        let Ids=[]
        for( let id of body.userIds){
            Ids.push(id)
            let user1=await this.userService.findById(id)
            console.log(user1)
            users.push(user1)
            this.websocketGateway.join({groupId,userId:id},user1.socketId)

        }
        group.groupMembers.push(...users)
       return  await this.groupRepository.save(group)
        
    }

    async leaveGroup(user:User,groupId:number){
        const group=await this.getGroup(groupId)
      let member= group.groupMembers.filter((g)=>g.id!==user.id)
       this.websocketGateway.remove({groupId,userId:user.id},user.socketId)
       await this.chatService.deletechatsForRemovedUser(`#${groupId}`,user)
       group.groupMembers=member;
      return await this.groupRepository.save(group)
    }

    async removeUsers(admin:User,groupId:number,body:ChooseUserDto){
        const group=await this.getGroup(groupId)
        let member=[]
        for (let id of body.userIds){
       let user=await this.userService.findById(id)
      member= group.groupMembers.filter((g)=>g.id!==user.id)
       console.log(member)

       await this.chatService.deletechatsForRemovedUser(`#${groupId}`,user)
       this.websocketGateway.remove({groupId,userId:user.id},user.socketId)
        }
     group.groupMembers=member
      return await this.groupRepository.save(group)
    }

    async deleteGroup(user:User,groupId:number){
       const group=await this.getGroup(groupId);
       let nameChat=`#${groupId}`
       await this.chatService.deleteGroupChats(nameChat)
       await this.deleteFromUsers(group)
       await this.groupRepository.delete(group.id)
       return ` group with id ${group.id} is successfully deleted`
    }

    async checkAdmission(user:User,groupId:number){
        const group=await this.getGroup(groupId)
        let admin=group.admin
        console.log(user)
        if(!(admin.id===user.id)){
            throw new HttpException('you dont have access to see/change this group',HttpStatus.UNAUTHORIZED)
        }
      }
    async checkRoles(user:User,groupId:number){
        const group=await this.getGroup(groupId)
        let userIds=group.groupMembers.map((g)=>g.id)
        if(!(userIds.includes(user.id))){
            throw new HttpException('you dont belong this group',HttpStatus.UNAUTHORIZED)
        }
    }
      async deleteFromUsers(group:Group){
        try{
        group.groupMembers=null
        await this.groupRepository.save(group)
      }catch(err){
        throw new HttpException(err,HttpStatus.BAD_REQUEST)
      }

      }

     
}
