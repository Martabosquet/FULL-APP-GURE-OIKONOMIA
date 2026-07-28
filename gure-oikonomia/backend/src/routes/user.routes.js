import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { userController } from '../controllers/user.controller.js';

const router = express.Router();

// Aplicar authMiddleware a todas las rutas de usuario
router.use(authMiddleware);

// Rutas de Perfil
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.put('/change-password', userController.changePassword);

// Rutas de Direcciones
router.get('/addresses', userController.getAddresses);
router.post('/addresses', userController.createAddress);
router.put('/addresses/:id', userController.updateAddress);
router.delete('/addresses/:id', userController.deleteAddress);
router.patch('/addresses/:id/default', userController.setDefaultAddress);

export default router;
