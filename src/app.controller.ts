import { Controller, Get, Render, Query, Post, Body, Redirect, Res, HttpException, HttpStatus } from '@nestjs/common';
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
  async resetPassword(
    @Body() body: { newPassword: string },
    @Query('token') token: string,
    @Res() res: Response,
  ) {
    const { newPassword } = body;

    try {
      // Validación: Contraseña debe cumplir requisitos y ser diferente
      const isPasswordValid = /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(newPassword);
      if (!isPasswordValid) {
        throw new HttpException(
          'La contraseña debe contener al menos una letra mayúscula, un número y ser de mínimo 8 caracteres.',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Buscar al usuario por el token de recuperación
      const user = await this.usersService.findByResetToken(token);
      if (!user) {
        throw new HttpException(
          'Token de recuperación inválido o expirado.',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Lógica para asegurar que la contraseña es diferente
      const isPasswordDifferent = await this.usersService.isPasswordDifferent(user, newPassword);
      if (!isPasswordDifferent) {
        throw new HttpException(
          'La nueva contraseña no puede ser igual a la anterior.',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Restablecer la contraseña
      await this.usersService.resetPassword(token, newPassword);

      return res.redirect('/login?successMessage=Contraseña restablecida con éxito');
    } catch (error) {
      return res.redirect(
        `/users/reset-password?token=${encodeURIComponent(token)}&errorMessage=${encodeURIComponent(
          error.message,
        )}`,
      );
    }
  }
}
