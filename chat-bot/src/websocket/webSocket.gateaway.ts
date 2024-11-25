import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Group } from '../group/entity/group.entity';
import { UsersService } from 'src/users/users.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/users/entity/user.entity';
import { Message } from 'src/message/entity/message.entity';
import { CacheService } from 'src/users/cache/cache.service';
let handleUnSeenMessages = [];
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class WebsocketGateway implements OnGatewayConnection {
  constructor(
    private userService: UsersService,
    private cachService: CacheService,
    @InjectRepository(Group) private groupRepository: Repository<Group>,
  ) {}

  @WebSocketServer() server: Server;

  async handleConnection(client: Socket) {
    console.log(client.id, 'connected');
    console.log(client.handshake.headers.authorization);
    client.emit(' hello', 'hi');

    const payload = await this.userService.verifyToken(
      client.handshake.headers.authorization,
    );
    await this.cachService.setValue(payload.toString(), client.id);
    await this.joinGroupsConnect(payload);
    await this.getUnSeenMessagges(client.id);
  }

  async handleDisconnect(@ConnectedSocket() socket: Socket) {
    const payload = await this.userService.verifyToken(
      socket.handshake.headers.authorization,
    );
    await this.cachService.delete(payload.toString());
  }

  emitToClients(clientIds: number[], event: string, payload: Group) {
    // clientIds.forEach((clientId) => {
    console.log('payload from server', { payload });
    this.server.emit('groupCreated', payload);
    //});
  }

  @SubscribeMessage('join room')
  async join(@MessageBody() data: { groupId: number; userId: number }) {
    let roomName = `group${data.groupId}`;
    let socketId = await this.cachService.getValue(data.userId.toString());
    this.server.in(socketId).socketsJoin(roomName);
    console.log(roomName);
    this.server.to(roomName).emit('join room', data);
  }

  @SubscribeMessage('remove room')
  async remove(@MessageBody() data: any) {
    let socketId = await this.cachService.getValue(data.userId.toString());
    let roomName = `group${data.groupId}`;
    this.server.in(socketId).socketsLeave(roomName);
    this.server.to(roomName).emit('leave room', data);
  }

  @SubscribeMessage('send message')
  async sendMessage(
    @MessageBody() data: Message,
    @ConnectedSocket() socket: User,
  ) {
    const socketId = await this.cachService.getValue(socket.id.toString());
    console.log('socket', socketId);
    if (socketId === null) {
      await this.cachService.setUsersNotSawMessages(socket.id.toString());
      handleUnSeenMessages.push({ userId: socket.id, message: data });
    }
    console.log(handleUnSeenMessages);

    this.server.to(socketId).emit('send message', data);
  }

  @SubscribeMessage('send message group')
  async sendMessageToGroup(
    @MessageBody() data: any,
    @ConnectedSocket() sockets: User[],
    sender: User,
  ) {
    let roomName = `group${data.groupId}`;
    for (let socket of sockets) {
      const socketId = await this.cachService.getValue(socket.id.toString());
      if (socketId === null) {
        handleUnSeenMessages.push({ userId: socket.id, message: data });
        await this.cachService.setUsersNotSawMessages(socket.id.toString());
      }
    }
    this.server.to(roomName).emit('send message', data);
    if (!sockets.includes(sender)) {
      const senderSocketId = await this.cachService.getValue(
        sender.id.toString(),
      );
      this.server.to(senderSocketId).emit('send message', data);
    }
  }

  @SubscribeMessage('delete message')
  deleteMessage(id: number) {
    this.server.emit('delete message', id);
  }

  async getUserGroups(user) {
    let Allgroups = [];
    const groups = await this.groupRepository.find({
      where: { groupMembers: { id: user.id } },
    });
    const groupAsAdmin = await this.groupRepository.find({
      where: { admin: { id: user.id } },
    });
    Allgroups = groups.concat(groupAsAdmin);
    console.log(Allgroups);
    return Allgroups;
  }
  async joinGroupsConnect(userId: number) {
    const user = await this.userService.findById(userId as number);
    const groups = await this.getUserGroups(user);
    const socketId = await this.cachService.getValue(userId.toString());
    for (let group of groups) {
      let roomName = `group${group.id}`;
      this.server.in(socketId).socketsJoin(roomName);
    }
    this.server.emit('room', 'connecting');
  }

  async happyBirthDay(socket: User) {
    const socketId = await this.cachService.getValue(socket.id.toString());
    this.server
      .to(socketId)
      .emit('congrats', `happyBirth day dear ${socket.firstname} `);
  }

  async getUnSeenMessagges(clientId: string) {
    // const user=await this.userService.findBySocketId(clientId)
    // console.log(user)
    const userIds = await this.cachService.getUsersNotSawMessages();
    let userId = '';
    for (let user of userIds) {
      if ((await this.cachService.getValue(user)) === clientId) {
        userId = user;
      }
    }

    for (let item of handleUnSeenMessages) {
      if (item['userId'] === userId) {
        this.server.to(clientId).emit('send message', item['message']);
      }
    }
  }
}
