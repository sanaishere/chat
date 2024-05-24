import { Controller,Post,Get,Put,Delete,Body,Query,Request, HttpCode,
   HttpStatus, UseInterceptors, UploadedFile, Param, Res, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update_user.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { editFileName,imageFileFilter } from './utils';
import {  request,Express, } from 'express';
import { URL } from 'common/app.url';
import { extname } from 'path';
import {v4 as uuidv4} from 'uuid'
import { OtpDto } from './dto/otp.dto';
import { JwtStrategy } from './strategy/jwt.strategy';
import { AuthGuard } from '@nestjs/passport';
import { LoginUserDto } from './dto/login.dto';
@Controller('users')
export class UsersController {
    constructor(private usersService:UsersService){}

   @Post('/register')
   @UseInterceptors(FileInterceptor('photo', {
    storage: diskStorage({
      destination: './files/image', 
      filename: (req, file, callback) => {
        const uniqueSuffix = uuidv4() + '-' + Date.now();
        const extension = extname(file.originalname);
        callback(null, uniqueSuffix + extension); // Define the filename
      },
      
    }),
    fileFilter:imageFileFilter,
  }))
      @HttpCode(HttpStatus.CREATED)
      @ApiBearerAuth()
    register(@UploadedFile() file:Express.Multer.File,@Body() body:CreateUserDto ){
        let src=''
        if(file) src=file.filename
        return this.usersService.create(body,src)
   }

   @Put(':id')
   //@UseGuards(AuthGuard('jwt'))
   @UseInterceptors(FileInterceptor('photo', {
    storage: diskStorage({
      destination: './files/image', 
      filename: (req, file, callback) => {
        const uniqueSuffix = uuidv4() + '-' + Date.now();
        const extension = extname(file.originalname);
        callback(null, uniqueSuffix + extension); // Define the filename
      },
      
    }),
    fileFilter:imageFileFilter,
  }))
   @HttpCode(HttpStatus.CREATED)
   @ApiBearerAuth()
   async editProfile(@Body() body:UpdateUserDto,@UploadedFile() file:Express.Multer.File,@Param('id') id:number){
    let src=''
    if(file) src=file.filename
      return this.usersService.editProfile(body,src,id)
   }

   @Post('login')
   @HttpCode(HttpStatus.OK)
   @ApiBearerAuth()
   async login(@Body() body:LoginUserDto){
    return await this.usersService.login(body.phoneNumber)
      
   }

   @Put('block/:id')
   @HttpCode(HttpStatus.OK)
   @UseGuards(AuthGuard('jwt'))
   @ApiBearerAuth()
   async blockUser(@Request() {user},@Param('id') id:number){
    return await this.usersService.blockUser(id,user)
      
   }

   @Delete('logout')
   @UseGuards(AuthGuard('jwt'))
   async userLogOut(@Request() req:Request){
      return await this.usersService.logOut(req)
   }

   @Get('/me')
   @UseGuards(AuthGuard('jwt'))
   @HttpCode(HttpStatus.OK)
   @ApiBearerAuth()
   async getProfile(@Request() {user}){
   return await this.usersService.findById(user.id)

   }
  
   @Get(':imgpath')
   seeUploadedFile(@Param('imgpath') image, @Res() res) {
     return res.sendFile(image, { root: './files/image' });
   }
}

@Controller('sms')
export class SmsController {
    constructor(private usersService:UsersService) {}

    @Post()
    async sendSMS(@Body() body:any) {
       return await this.usersService.sendSMS(body.phoneNumber);
        
    }
}

@Controller('verify')
export class verifyController {
    constructor(private usersService:UsersService) {}

    @Post('/:verify')
    async sendSMS(@Body() body:OtpDto,@Param('verify') verify:string) {
      console.log(verify)
       return await this.usersService.verifyOtp(verify,body);
        
    }
}



