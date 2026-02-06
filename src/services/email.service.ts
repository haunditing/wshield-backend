// c:\Users\marvi\WShield_Backend\src\services\email.service.ts
import * as nodemailer from "nodemailer";

import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS, // Usa una "Contraseña de aplicación" si tienes 2FA activado
  },
});

export const sendEmail = async (to: string, subject: string, text: string) => {
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to,
    subject,
    text,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] Correo enviado: ${info.messageId}`);
  } catch (error) {
    console.error("[EmailService] Error enviando correo:", error);
    // Dependiendo de tu lógica de negocio, podrías querer lanzar el error
    // throw new Error('No se pudo enviar el correo');
  }
};
