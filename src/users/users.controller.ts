import { Controller, Post, Body, Query, Get, Render } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('users') // Grupo de endpoints para Swagger
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrar un nuevo usuario' })
  @ApiResponse({ status: 201, description: 'Usuario creado correctamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o usuario ya existente.' })
  async register(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({ status: 200, description: 'Inicio de sesión exitoso.' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas.' })
  @Render('login') // Usamos @Render para renderizar la vista
  async login(@Body() loginUserDto: LoginUserDto) {
    try {
      const result = await this.usersService.login(loginUserDto);
      return { message: result.message, user: result.user }; // Pasamos datos exitosos a la vista
    } catch (error) {
      return { errorMessage: error.message }; // Manejamos errores para mostrarlos en la vista
    }
  }

  @Get('activate')
  @ApiOperation({ summary: 'Activar cuenta de usuario' })
  @ApiResponse({ status: 200, description: 'Cuenta activada correctamente.' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  async activate(@Query('email') email: string) {
    return this.usersService.activateAccount(email);
  }

  @Get('check-email')
  @ApiOperation({ summary: 'Verificar disponibilidad del correo electrónico' })
  @ApiResponse({ status: 200, description: 'Correo verificado correctamente.' })
  @ApiResponse({ status: 400, description: 'Formato de correo inválido.' })
  async checkEmail(@Query('email') email: string) {
    const isAvailable = await this.usersService.isEmailAvailable(email);
    return { isAvailable };
  }

  @Get('login')
  @ApiOperation({ summary: 'Mostrar página de inicio de sesión' })
  @Render('login') // Renderizamos la vista login.ejs
  getLogin() {
    return { errorMessage: null }; // Proporcionamos un error por defecto como nulo
  }
}
