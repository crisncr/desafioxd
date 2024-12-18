import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ default: false })
  isActive: boolean;

  @Column({ default: 0 }) // Propiedad para contar intentos fallidos
  loginAttempts: number;

  @Column({ default: false }) // Propiedad para determinar si la cuenta está bloqueada
  isLocked: boolean;

  @Column({ nullable: true }) // Token opcional para recuperación de contraseña
  resetToken: string | null;
}
