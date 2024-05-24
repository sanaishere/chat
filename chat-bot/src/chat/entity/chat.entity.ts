import { Group } from "src/group/entity/group.entity";
import { Message } from "src/message/entity/message.entity";
import { User } from "src/users/entity/user.entity";
import { Column, Entity, JoinTable, ManyToMany, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity({name:'chat'})
export class Chat {
@PrimaryGeneratedColumn()
id:number

@Column({default:()=>'CURRENT_TIMESTAMP'})
created_at:Date

@Column()
name?:string

@ManyToMany(()=>User,(users)=>users.chats,{cascade:true})
users?:User[]

@OneToMany(()=>Message,(messages)=>messages.chat,{cascade:true})
messages?:Message[]






}