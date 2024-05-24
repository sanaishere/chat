import { IsNotEmpty, IsString } from "class-validator";
import { Message } from "src/message/entity/message.entity";

export class CreateChatDto{
    @IsNotEmpty({message:'name can not be empty'})
    @IsString()
    name:string
    
    messages:Message[]
    
}