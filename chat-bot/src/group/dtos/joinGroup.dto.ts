import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';

export class JoinGroupDto {
  @IsNotEmpty({ message: 'name of group can not be empty' })
  @IsString()
  name: string;
}
