import { Chat } from "src/chat/entity/chat.entity";
import { Message } from "src/message/entity/message.entity";
import { User } from "src/users/entity/user.entity";
import { Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity({name:'group'})
export class Group {
@PrimaryGeneratedColumn()
id:number

@Column({default:()=>'CURRENT_TIMESTAMP'})
createdDate:Date

@Column()
name:string

@Column()
isPrivate:boolean

@Column({nullable:true})
numberOfMembers?:number

@ManyToMany(()=>User,(groupMembers)=>groupMembers.groups,{cascade:true})
groupMembers?:User[]



@ManyToOne(()=>User,(a)=>a.groups)
admin:User


}