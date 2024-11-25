import { IsNotEmpty, IsString } from 'class-validator';

export class LoginUserDto {
  @IsNotEmpty({ message: 'number should not be empty' })
  @IsString({ message: 'number should be in a text ' })
  phoneNumber: string;
}
