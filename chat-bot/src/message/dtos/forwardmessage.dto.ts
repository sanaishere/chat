import { ArrayNotEmpty, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ForwardMessageDto {
  @ArrayNotEmpty({ message: 'reciversId can not be empty' })
  @IsNumber({}, { each: true })
  reciversId: number[];
}
