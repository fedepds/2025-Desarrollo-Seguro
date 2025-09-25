
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import routes from '../controllers/authController';


const router = Router();

// Limitar a 5 intentos por minuto por IP 
const authLimiter = rateLimit({
	windowMs: 60 * 1000, // 1 minuto
	max: 5,
	message: 'Demasiados intentos, por favor intente más tarde.'
});

router.get('/', routes.ping);


router.post('/login', authLimiter, routes.login);


// POST /auth/forgot-password
router.post('/forgot-password', authLimiter, routes.forgotPassword);

// POST /auth/reset-password
router.post('/reset-password', routes.resetPassword);

// POST /auth/set-password
router.post('/set-password', routes.setPassword);


export default router;
