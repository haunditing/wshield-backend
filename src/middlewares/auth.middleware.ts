import { Request, Response, NextFunction } from "express";
import { AppError } from "../AppError";
import { verifyToken } from "../utils/jwt";
import { User } from "../models/user.model";

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("No autorizado. Token faltante.", 401);
    }

    const [, token] = authHeader.split(" ");

    if (!token) {
      throw new AppError("Token missing", 401);
    }

    const decoded = verifyToken(token);

    const user = await User.findById(decoded.userId).select("-passwordHash");
    if (!user || !user.isActive) {
      throw new AppError("Usuario no encontrado o inactivo.", 401);
    }

    // Inyectar usuario en la request
    (req as any).user = user;
    next();
  } catch (error) {
    next(new AppError("Token inválido o expirado.", 401));
  }
};
