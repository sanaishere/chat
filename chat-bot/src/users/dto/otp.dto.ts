import { IsNotEmpty, IsNumber } from "class-validator";

export class OtpDto{
    @IsNotEmpty({message:'firstname should not be empty'})
    @IsNumber()
    otp:number
}