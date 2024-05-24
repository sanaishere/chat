import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UsersService } from '../users.service';
require('dotenv').config()
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy){
    constructor(private userService:UsersService){
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.JWTSECRET
        })
    }
    async validate(payload:any){
        try{
     const user=await this.userService.findById(payload.payload)
     if(!user){
        throw new HttpException('user not authorized',HttpStatus.UNAUTHORIZED)
     }
        
     return user
        }
        catch(err){
            throw new HttpException(err,HttpStatus.UNAUTHORIZED)
        }
    }
}