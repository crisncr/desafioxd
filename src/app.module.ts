import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module'; // Asegúrate de que `UsersModule` esté importado aquí
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // Cargar las variables de entorno desde el archivo .env
    ConfigModule.forRoot({
      envFilePath: '.env',  // Ruta del archivo de configuración de variables de entorno
      isGlobal: true,       // Hacer las variables globales para todos los módulos
    }),
    // Configuración de TypeORM para conectar con la base de datos
    TypeOrmModule.forRoot({
      type: 'mysql',        // Tipo de base de datos (MySQL en este caso)
      host: process.env.DB_HOST,       // Obtiene el host desde las variables de entorno
      port: parseInt(process.env.DB_PORT, 10),  // Obtiene el puerto desde las variables de entorno
      username: process.env.DB_USERNAME, // Obtiene el nombre de usuario desde las variables de entorno
      password: process.env.DB_PASSWORD, // Obtiene la contraseña desde las variables de entorno
      database: process.env.DB_NAME,    // Obtiene el nombre de la base de datos desde las variables de entorno
      entities: [__dirname + '/**/*.entity{.ts,.js}'], // Buscar entidades en todo el proyecto
      synchronize: process.env.NODE_ENV === 'development', // Sincronizar en desarrollo
      logging: true, // Activar el registro de consultas de SQL (solo en desarrollo)
    }),
    // Importar el módulo de usuarios
    UsersModule,  // Asegúrate de que UsersModule esté aquí
  ],
  controllers: [AppController], // Controladores de la aplicación
  providers: [AppService],      // Servicios de la aplicación
})
export class AppModule {}
