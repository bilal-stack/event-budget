import { IsDateString, IsString, MinLength, Length } from 'class-validator';

export class CreateEventDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsDateString()
  date: string;

  @IsString()
  @Length(3, 3)
  currency: string;
}
