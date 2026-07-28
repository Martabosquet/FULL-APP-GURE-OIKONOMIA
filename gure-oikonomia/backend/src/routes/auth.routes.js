import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { authController } from "../controllers/auth.controller.js"

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.getProfile);

export default router;