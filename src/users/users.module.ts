import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User])],  // Asegúrate de que esta línea esté presente
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],  // Exporta el servicio si lo necesitas en otro módulo
})
export class UsersModule {}
