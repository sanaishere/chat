import { IsNotEmpty, IsString } from "class-validator";

export class CreateMessageDto{
    @IsNotEmpty({message:'text can not be empty'})
    @IsString()
    text:string
    
}