import { Controller, Post, Body, Get, Render, Redirect, Query, Res } from '@nestjs/common';
import { UsersService } from './users/users.service';
import { CreateUserDto } from './users/dto/create-user.dto';
import { LoginUserDto } from './users/dto/login-user.dto';
import { Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly usersService: UsersService) {}

  // Ruta raíz para redirigir al login
  @Get()
  @Redirect('/login')
  getHello(): any {
    return;
  }

  // Ruta para registrar un usuario - Muestra la vista de registro
  @Get('register')
  @Render('register')
  getRegister(): any {
    return { message: 'Crear una nueva cuenta' };
  }

  // Ruta para registrar un usuario - POST
  @Post('users/register')
  @Redirect('/login', 301)
  async register(@Body() createUserDto: CreateUserDto) {
    await this.usersService.create(createUserDto);
    return;
  }

  // Ruta para iniciar sesión - Muestra la vista de login
  @Get('login')
  @Render('login')
  getLogin(@Query('errorMessage') errorMessage: string): any {
    return { message: 'Iniciar sesión', errorMessage };
  }

  // Ruta para el inicio de sesión - POST
  @Post('users/login')
  async login(@Body() loginUserDto: LoginUserDto, @Res() res: Response) {
    try {
      await this.usersService.login(loginUserDto);
      return res.redirect('/dashboard');
    } catch (error) {
      return res.redirect(`/login?errorMessage=${encodeURIComponent(error.message)}`);
    }
  }

  // Ruta para mostrar el dashboard - Muestra la vista del panel de control
  @Get('dashboard')
  @Render('dashboard') // Renderiza la vista 'dashboard.ejs'
  getDashboard(): any {
    return { message: 'Bienvenido a tu Dashboard' };
  }

  // Ruta para cerrar sesión
  @Post('logout')
  async logout(@Res() res: Response) {
    // Aquí podrías limpiar sesiones, cookies o tokens si los usas
    res.clearCookie('authToken'); // Ejemplo: limpiar cookie de autenticación
    return res.redirect('/login');
  }

  // Ruta para la solicitud de restablecimiento de contraseña
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
