import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as path from 'path';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Configura EJS como motor de plantillas
  app.setViewEngine('ejs');

  // Configura la carpeta base de vistas
  app.setBaseViewsDir(path.join(__dirname, '..', 'views'));

  // Habilita el uso de archivos estáticos
  app.useStaticAssets(path.join(__dirname, '..', 'public'));

  // Configuración de CORS si es necesario
  app.enableCors({
    origin: true, // Permite solicitudes desde cualquier origen
    credentials: true, // Permite enviar cookies en las solicitudes
  });

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('API de Autenticación')
    .setDescription('Documentación de la API')
    .setVersion('1.0')
    .addBearerAuth() // Para autenticar con JWT si lo estás utilizando
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // Documentación en /api

  await app.listen(3000);
  console.log('Application is running on: http://localhost:3000');
  console.log('Swagger documentation available at: http://localhost:3000/api');
}

bootstrap();
