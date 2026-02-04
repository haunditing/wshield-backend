import { AppError } from '../../AppError';
import { User } from '../../models/user.model';
import { comparePassword, hashPassword } from '../../utils/hash';
import { signToken } from '../../utils/jwt';
import { LoginInput, RegisterInput } from './auth.types';

export class AuthService {
  async register(data: RegisterInput) {
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new AppError('El email ya está registrado', 409);
    }

    const hashedPassword = await hashPassword(data.password);

    const newUser = await User.create({
      email: data.email,
      passwordHash: hashedPassword,
    });

    const token = signToken({ userId: newUser.id, email: newUser.email });

    return { user: this.sanitizeUser(newUser), token };
  }

  async login(data: LoginInput) {
    const user = await User.findOne({ email: data.email });
    if (!user || !user.isActive) {
      throw new AppError('Credenciales inválidas', 401);
    }

    const isMatch = await comparePassword(data.password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Credenciales inválidas', 401);
    }

    const token = signToken({ userId: user.id, email: user.email });
    return { user: this.sanitizeUser(user), token };
  }

  private sanitizeUser(user: any) {
    const { passwordHash, ...userWithoutPassword } = user.toObject();
    return userWithoutPassword;
  }
}