import { ArrayNotEmpty, IsArray, IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateGroupDto{
    @IsNotEmpty({message:'name of group can not be empty'})
    @IsString()
    name:string

   
    @IsArray()
    @ArrayNotEmpty({message:'enter members'})
    @IsNumber({}, { each: true })
    groupMembersId:number[]

    @IsNotEmpty()
    isPrivate:boolean

}