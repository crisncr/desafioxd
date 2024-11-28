import { Controller, Get, Render, Query, Post, Body, Redirect, Res } from '@nestjs/common';
import { UsersService } from './users/users.service';
import { CreateUserDto } from './users/dto/create-user.dto';
import { LoginUserDto } from './users/dto/login-user.dto';
import { Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Redirect('/login')
  getHello(): any {
    return;
  }

  @Get('login')
  @Render('login')
  getLogin(@Query('errorMessage') errorMessage: string): any {
    return { errorMessage };
  }

  @Get('register')
  @Render('register')
  getRegister(): any {
    return { message: 'Crear una nueva cuenta' };
  }

  @Post('users/register')
  @Redirect('/login', 301)
  async register(@Body() createUserDto: CreateUserDto) {
    await this.usersService.create(createUserDto);
    return;
  }

  @Post('users/login')
  async login(@Body() loginUserDto: LoginUserDto, @Res() res: Response) {
    try {
      await this.usersService.login(loginUserDto);
      return res.redirect('/dashboard');
    } catch (error) {
      return res.redirect(`/login?errorMessage=${encodeURIComponent(error.message)}`);
    }
  }

  @Get('dashboard')
  @Render('dashboard')
  getDashboard(): any {
    return { message: 'Bienvenido a tu Dashboard' };
  }

  @Post('logout')
  async logout(@Res() res: Response) {
    res.clearCookie('authToken');
    return res.redirect('/login');
  }

  @Get('users/request-password-reset')
  @Render('request-password-reset')
  getRequestPasswordReset(): any {
    return { message: 'Recuperar tu contraseña' };
  }

  @Post('users/request-password-reset')
  async requestPasswordReset(@Body() body: { email: string }) {
    const { email } = body;
    await this.usersService.requestPasswordReset(email);
    return { message: `Se ha enviado un enlace de recuperación a ${email}` };
  }

  @Get('users/reset-password')
  @Render('reset-password')
  getResetPassword(@Query('token') token: string): any {
    return { token };
  }

  @Post('users/reset-password')
  async resetPassword(@Body() body: { newPassword: string }, @Query('token') token: string) {
    const { newPassword } = body;
    await this.usersService.resetPassword(token, newPassword);
    return { message: 'Contraseña restablecida con éxito' };
  }
}
