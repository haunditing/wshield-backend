import crypto from "crypto";
import { AppError } from "../../AppError";
import { User } from "../../models/user.model";
import { sendEmail } from "../../services/email.service";
import { comparePassword, hashPassword } from "../../utils/hash";
import { signToken } from "../../utils/jwt";
import { ChangePasswordInput, LoginInput, RegisterInput, ResetPasswordInput } from "./auth.types";

export class AuthService {
  async register(data: RegisterInput) {
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new AppError("El email ya está registrado", 409);
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
      throw new AppError("Credenciales inválidas", 401);
    }

    const isMatch = await comparePassword(data.password, user.passwordHash);
    if (!isMatch) {
      throw new AppError("Credenciales inválidas", 401);
    }

    const token = signToken({ userId: user.id, email: user.email });
    return { user: this.sanitizeUser(user), token };
  }

  async recoverPassword(email: string) {
    const user = await User.findOne({ email });
    if (!user) {
      // Por seguridad, no revelamos si el usuario existe o no
      return;
    }

    // 1. Generar un token aleatorio para el usuario
    const resetToken = crypto.randomBytes(32).toString("hex");

    // 2. Hashear el token y guardarlo en la base de datos
    (user as any).passwordResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // 3. Establecer una fecha de expiración (ej. 10 minutos)
    (user as any).passwordResetExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    // 4. Enviar el token SIN hashear al usuario por correo
    const message = `Has solicitado recuperar tu contraseña en WShield.\n\nUsa este token para restablecerla: ${resetToken}\n\nEste token expira en 10 minutos.\n\nSi no solicitaste esto, ignora este mensaje.`;

    await sendEmail(
      user.email,
      "Recuperación de Contraseña - WShield",
      message,
    );
  }

  async resetPassword(data: ResetPasswordInput) {
    const hashedToken = crypto
      .createHash("sha256")
      .update(data.token)
      .digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new AppError("El token es inválido o ha expirado", 400);
    }

    user.passwordHash = await hashPassword(data.newPassword);
    (user as any).passwordResetToken = undefined;
    (user as any).passwordResetExpires = undefined;
    await user.save();

    const token = signToken({ userId: user.id, email: user.email });
    return { user: this.sanitizeUser(user), token };
  }

  async changePassword(userId: string, data: ChangePasswordInput) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError("Usuario no encontrado", 404);
    }

    const isMatch = await comparePassword(
      data.currentPassword,
      user.passwordHash,
    );
    if (!isMatch) {
      throw new AppError("La contraseña actual es incorrecta", 401);
    }

    const hashedPassword = await hashPassword(data.newPassword);
    user.passwordHash = hashedPassword;
    await user.save();
  }

  private sanitizeUser(user: any) {
    const { passwordHash, ...userWithoutPassword } = user.toObject();
    return userWithoutPassword;
  }
}
