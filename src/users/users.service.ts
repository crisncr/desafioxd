import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsersService {
  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'axenoider20@gmail.com',
      pass: 'jmniqqdmxyzrlcla',
    },
  });

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private configService: ConfigService,
  ) {}

  // Método para activar la cuenta
  async activateAccount(email: string): Promise<void> {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new Error('Usuario no encontrado.');
    }

    user.isActive = true;
    await this.usersRepository.save(user);
  }

  async create(createUserDto: CreateUserDto) {
    const { email, password, firstName, lastName } = createUserDto;

    if (!this.validateEmail(email)) {
      throw new Error('El correo no tiene un formato válido.');
    }

    if (!this.validatePassword(password)) {
      throw new Error(
        'La contraseña debe contener al menos una mayúscula y un número.',
      );
    }

    const isEmailAvailable = await this.isEmailAvailable(email);
    if (!isEmailAvailable) {
      throw new Error('El correo ya está registrado.');
    }

    const hashedPassword = await this.hashPassword(password);

    const user = this.usersRepository.create({
      email,
      firstName,
      lastName,
      password: hashedPassword,
      isActive: false,
      loginAttempts: 0,
      isLocked: false,
    });

    const savedUser = await this.usersRepository.save(user);

    const baseUrl = this.configService.get<string>('BASE_URL');
    const activationLink = `${baseUrl}/users/activate?email=${email}`;
    await this.sendActivationEmail(email, activationLink);

    return {
      message: 'Usuario registrado exitosamente. Revisa tu correo para activarlo.',
      user: savedUser,
    };
  }

  async login(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;

    const user = await this.findByEmail(email);
    if (!user) {
      throw new Error('Usuario no encontrado.');
    }

    if (!user.isActive) {
      throw new Error('La cuenta no está activada. Revisa tu correo.');
    }

    if (user.isLocked) {
      throw new Error('La cuenta está bloqueada. Restablece tu contraseña.');
    }

    const passwordMatches = await this.comparePasswords(password, user.password);
    if (!passwordMatches) {
      user.loginAttempts += 1;

      if (user.loginAttempts >= 3) {
        user.isLocked = true;
        await this.usersRepository.save(user);

        await this.sendAccountLockedEmail(user.email);
        throw new Error('La cuenta ha sido bloqueada tras 3 intentos fallidos.');
      }

      await this.usersRepository.save(user);
      throw new Error('Contraseña incorrecta.');
    }

    user.loginAttempts = 0;
    await this.usersRepository.save(user);

    return { message: 'Login exitoso', user };
  }

  async requestPasswordReset(email: string) {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new Error('Usuario no encontrado.');
    }

    const resetToken = uuidv4();
    user.resetToken = resetToken;
    await this.usersRepository.save(user);

    const baseUrl = this.configService.get<string>('BASE_URL');
    const resetLink = `${baseUrl}/users/reset-password?token=${resetToken}`;
    await this.sendPasswordResetEmail(email, resetLink);

    return {
      message: 'Te hemos enviado un correo con un enlace para restablecer tu contraseña.',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.usersRepository.findOne({ where: { resetToken: token } });
    if (!user) {
      throw new Error('Token de recuperación inválido o expirado.');
    }

    const isPasswordDifferent = await this.isPasswordDifferent(user, newPassword);
    if (!isPasswordDifferent) {
      throw new Error('La nueva contraseña no puede ser igual a la anterior.');
    }

    if (!this.validatePassword(newPassword)) {
      throw new Error('La contraseña debe contener al menos una mayúscula y un número.');
    }

    const hashedPassword = await this.hashPassword(newPassword);
    user.password = hashedPassword;
    user.resetToken = null;
    user.loginAttempts = 0;
    user.isLocked = false;

    await this.usersRepository.save(user);
    await this.sendPasswordResetSuccessEmail(user.email);

    return { message: 'Contraseña restablecida exitosamente.' };
  }

  // Método para verificar si la nueva contraseña es diferente a la actual
  async isPasswordDifferent(user: User, newPassword: string): Promise<boolean> {
    return !(await bcrypt.compare(newPassword, user.password));
  }


  async findByResetToken(token: string): Promise<User | undefined> {
    return this.usersRepository.findOne({ where: { resetToken: token } });
  }

  // Método para enviar un correo cuando la cuenta se ha bloqueado
  private async sendAccountLockedEmail(email: string): Promise<void> {
    const mailOptions = {
      from: '"Cuenta Bloqueada" <axenoider20@gmail.com>',
      to: email,
      subject: 'Cuenta bloqueada',
      html: `
        <p>¡Hola!</p>
        <p>Tu cuenta ha sido bloqueada tras varios intentos fallidos de inicio de sesión.</p>
        <p>Por favor, restablece tu contraseña para poder acceder nuevamente.</p>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  private async sendActivationEmail(email: string, activationLink: string) {
    const mailOptions = {
      from: '"Activación de Cuenta" <axenoider20@gmail.com>',
      to: email,
      subject: 'Activa tu cuenta',
      html: `
        <p>¡Hola!</p>
        <p>Tu cuenta ha sido registrada. Haz clic en el siguiente enlace para activarla:</p>
        <a href="${activationLink}">Activar mi cuenta</a>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  private async sendPasswordResetEmail(email: string, resetLink: string) {
    const mailOptions = {
      from: '"Recuperación de Contraseña" <axenoider20@gmail.com>',
      to: email,
      subject: 'Recupera tu contraseña',
      html: `
        <p>¡Hola!</p>
        <p>Recibimos una solicitud para restablecer tu contraseña. Haz clic en el siguiente enlace:</p>
        <a href="${resetLink}">Restablecer mi contraseña</a>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  private async sendPasswordResetSuccessEmail(email: string) {
    const mailOptions = {
      from: '"Notificación de Contraseña" <axenoider20@gmail.com>',
      to: email,
      subject: 'Tu contraseña ha sido restablecida con éxito',
      html: `
        <p>¡Hola!</p>
        <p>Tu contraseña ha sido restablecida correctamente.</p>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  private validateEmail(email: string): boolean {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
  }

  private validatePassword(password: string): boolean {
    const regex = /^(?=.*[A-Z])(?=.*\d).+$/;
    return regex.test(password);
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  private async comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  private async findByEmail(email: string): Promise<User> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async isEmailAvailable(email: string): Promise<boolean> {
    const user = await this.usersRepository.findOne({ where: { email } });
    return !user;
  }
}
