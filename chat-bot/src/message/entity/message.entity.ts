import { Chat } from "src/chat/entity/chat.entity";
import { Group } from "src/group/entity/group.entity";
import { User } from "src/users/entity/user.entity";
import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

export enum types{
    DRAFT='draft',
    SENT='sent'
}

@Entity({name:'message'})
export class Message{
  @PrimaryGeneratedColumn()
  id:number

  @Column()
  text:string

  @Column({default:types.DRAFT})
  type?:types
  
   @Column({default:()=>'CURRENT_TIMESTAMP'})
   createdDate:Date

  @Column({default:false})
  isSeen?:boolean

  @ManyToOne(()=>User,{ cascade: true })
  sender:User

  @ManyToOne(()=>User,{ cascade: true })
  writer:User
  
  @ManyToOne(()=>Chat,(chats)=>chats.messages)
  chat?:Chat
}