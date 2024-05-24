import { Controller, HttpCode, HttpStatus, Post, UseGuards,Request, Body, Get, Put, ParseIntPipe, Param, Delete } from '@nestjs/common';
import { GroupService } from './group.service';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CreateGroupDto } from './dtos/creategroup.dto';
import { JoinGroupDto } from './dtos/joinGroup.dto';
import { ChooseUserDto } from './dtos/addtogroup.dto';
@Controller('group')
export class GroupController {
    constructor(private groupService:GroupService){}
    
    @Post()
    @UseGuards(AuthGuard('jwt'))
    @HttpCode(HttpStatus.CREATED)
    @ApiBearerAuth()
    async createGroup(@Request() {user},@Body() body:CreateGroupDto){
        return await this.groupService.createGroup(user,body)
        

    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth()
    async getAll(){
        return await this.groupService.getGroups()
    }

    @Get(':id')
    @UseGuards(AuthGuard('jwt'))
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth()
    async getOne(@Param('id') id:number,@Request() {user}){
        await this.groupService.checkRoles(user,id)
        return await this.groupService.getGroup(id)
    }

    @Post('join/:joinId')
    @UseGuards(AuthGuard('jwt'))
    @HttpCode(HttpStatus.CREATED)
    @ApiBearerAuth()
    async joinGroup(@Request() {user},@Param('joinId',ParseIntPipe) groupId:number){
        return await this.groupService.joinGroup(user,groupId)
        

    }
    @Post('add/:join')
    @UseGuards(AuthGuard('jwt'))
    @HttpCode(HttpStatus.CREATED)
    @ApiBearerAuth()
    async usersJoin(@Request() {user},@Body() body:ChooseUserDto,@Param('join',ParseIntPipe) groupId:number){
        await this.groupService.checkAdmission(user,groupId)
        return await this.groupService.addToGroup(user,body,groupId)
        

    }

    @Put('leave/:group')
    @UseGuards(AuthGuard('jwt'))
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth()
    async userleave(@Request() {user},@Param('group',ParseIntPipe) groupId:number){
        await this.groupService.checkRoles(user,groupId)
        return await this.groupService.leaveGroup(user,groupId)
    }
    
    @Put('remove/:group')
    @UseGuards(AuthGuard('jwt'))
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth()
    async removeUsers(@Request() {user},@Param('group',ParseIntPipe) groupId:number,@Body() body:ChooseUserDto){
        await this.groupService.checkAdmission(user,groupId)
        return await this.groupService.removeUsers(user,groupId,body)
        

    }

    @Delete(':id')
    @UseGuards(AuthGuard('jwt'))
    async deleteGroup(@Request() {user},@Param('id',ParseIntPipe) groupId:number){
        await this.groupService.checkAdmission(user,groupId)
        return await this.groupService.deleteGroup(user,groupId)
    }

    @Get('get/mygroups')
    @UseGuards(AuthGuard('jwt'))
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth()
    async getAllGroup(@Request() {user}){
        return await this.groupService.getMyGroups(user)
    }

}
