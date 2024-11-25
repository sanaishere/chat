import { ArrayNotEmpty, IsArray, IsNumber } from 'class-validator';

export class ChooseUserDto {
  @IsArray()
  @ArrayNotEmpty({ message: 'enter members' })
  @IsNumber({}, { each: true })
  userIds: number[];
}
