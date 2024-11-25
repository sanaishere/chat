import {
  IsDateString,
  IsEmpty,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty({ message: 'firstname should not be empty' })
  @IsString({ message: 'firstname should be string' })
  firstname: string;

  // @IsEmpty({message:'lastname should not be empty'})
  @IsString({ message: 'lastname should be string' })
  lastname?: string;

  @IsNotEmpty({ message: 'number should not be empty' })
  @IsString()
  phoneNumber: string;

  @IsOptional()
  @IsString({ message: 'srcshould be string' })
  profilePhotoSrc: string;

  @IsOptional()
  @IsDateString()
  DateOfBirth?: Date;
}
