import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'otp' })
export class Otp {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  otp: string;
  @Column()
  expiresIn: Date;
  @Column()
  token: string;
}
