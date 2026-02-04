import { Router } from 'express';
import { register, login, getMe } from './auth.controller';
import { registerSchema, loginSchema } from './auth.types';
import { validate } from '../../middlewares/validate.middleware';
import { protect } from '../../middlewares/auth.middleware';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/me', protect, getMe);

export default router;