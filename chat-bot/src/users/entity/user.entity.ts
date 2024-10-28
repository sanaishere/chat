import { Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Chat } from "src/chat/entity/chat.entity";
import { Message } from "src/message/entity/message.entity";
import { Group } from "src/group/entity/group.entity";
@Entity({name:'users'})
export class User {
    @PrimaryGeneratedColumn()
    id:number

    @Column()
    firstname:string

    @Column()
    lastname:string

    @Column({nullable:true})
    profilePhotoSrc?:string

    @Column({nullable:true,
    default: () => 'CURRENT_TIMESTAMP'})
    DateOfBirth:Date

    @Column({unique:true})
    phoneNumber:string

    @ManyToMany(()=>Chat,(chats)=>chats.users)
    @JoinTable()
    chats:Chat[]

    @ManyToMany(()=>Group,(groups)=>groups.groupMembers)
    @JoinTable()
    groups:Group[]

    @ManyToMany(()=>User,(blockedUsers)=>blockedUsers.blockedUsers)
    @JoinTable()
    blockedUsers?:User[]

    @OneToMany(()=>Message,(message)=>message.sender)
    sentMessages:Message[]
    
    @OneToMany(()=>Message,(message)=>message.writer)
    writeMessages:Message[]

    @Column({nullable:true})
    socketId:string



    

}