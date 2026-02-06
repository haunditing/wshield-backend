import crypto from "crypto";
import { AppError } from "../../AppError";
import { User } from "../../models/user.model";
import { sendEmail } from "../../services/email.service";
import { comparePassword, hashPassword } from "../../utils/hash";
import { signToken } from "../../utils/jwt";
import {
  ChangePasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from "./auth.types";

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

    // Rate Limiting: 1 envío + 1 reenvío = 2 intentos diarios
    const now = new Date();
    const lastRequest = user.lastOtpRequestDate ? new Date(user.lastOtpRequestDate) : null;

    // Si es un nuevo día, reiniciamos el contador
    if (!lastRequest || lastRequest.toDateString() !== now.toDateString()) {
      user.otpRequestsToday = 0;
    }

    if ((user.otpRequestsToday || 0) >= 2) {
      throw new AppError("Has alcanzado el límite diario de solicitudes (2 por día). Intenta mañana.", 429);
    }

    // 1. Generar un OTP numérico de 6 dígitos
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 2. Hashear el OTP y guardarlo en la base de datos
    user.otpCode = crypto.createHash("sha256").update(otp).digest("hex");

    // 3. Establecer una fecha de expiración (ej. 10 minutos)
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    
    // Actualizar contadores de uso
    user.otpRequestsToday = (user.otpRequestsToday || 0) + 1;
    user.lastOtpRequestDate = now;
    await user.save();

    console.log(
      `[AuthService] Enviando OTP de recuperación a ${email}: ${otp}`,
    );

    const htmlContent = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
    <h2 style="color: #333; text-align: center;">Recuperación de Contraseña</h2>
    <p style="color: #555; font-size: 16px;">Has solicitado recuperar tu contraseña en <strong>WShield</strong>.</p>
    <p style="color: #555; font-size: 16px;">Usa el siguiente código de verificación para restablecerla:</p>
    
    <div style="text-align: center; margin: 30px 0; background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
      <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #007bff;">${otp}</span>
    </div>

    <p style="color: #999; font-size: 12px; text-align: center;">
      Este código expira en 10 minutos.<br>
      Si no solicitaste esto, ignora este mensaje.
    </p>
  </div>
`;
    await sendEmail(
      user.email,
      "Recuperación de Contraseña - WShield",
      htmlContent,
    );
  }

  async resetPassword(data: ResetPasswordInput) {
    const hashedOtp = crypto
      .createHash("sha256")
      .update(data.otp)
      .digest("hex");

    const user = await User.findOne({
      email: data.email,
      otpCode: hashedOtp,
      otpExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new AppError("El código es inválido o ha expirado", 400);
    }

    user.passwordHash = await hashPassword(data.newPassword);
    user.otpCode = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = signToken({ userId: user.id, email: user.email });
    return { user: this.sanitizeUser(user), token };
  }

  async changePassword(userId: string, data: ChangePasswordInput) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError("Usuario no encontrado", 404);
    }

    if (user.plan !== 'PREMIUM') {
      const now = new Date();
      const lastChange = user.lastPasswordChangeDate ? new Date(user.lastPasswordChangeDate) : null;

      if (lastChange && lastChange.toDateString() === now.toDateString()) {
        throw new AppError("Solo puedes cambiar tu contraseña una vez al día con tu plan actual.", 429);
      }
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
    user.lastPasswordChangeDate = new Date();
    await user.save();
  }

  private sanitizeUser(user: any) {
    const { passwordHash, ...userWithoutPassword } = user.toObject();
    return userWithoutPassword;
  }
}
