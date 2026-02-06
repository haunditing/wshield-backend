import { Router } from 'express';
import { register, login, getMe, recoverPassword, changePassword, resetPassword } from './auth.controller';
import { registerSchema, loginSchema, recoverPasswordSchema, changePasswordSchema, resetPasswordSchema } from './auth.types';
import { validate } from '../../middlewares/validate.middleware';
import { protect } from '../../middlewares/auth.middleware';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/me', protect, getMe);
router.post('/recover-password', validate(recoverPasswordSchema), recoverPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
router.post('/change-password', protect, validate(changePasswordSchema), changePassword);

export default router;