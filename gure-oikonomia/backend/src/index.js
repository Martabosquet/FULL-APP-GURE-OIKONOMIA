import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import authRoutes from './routes/auth.routes.js';

// Cargar variables de entorno del archivo .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// =========================================================
// MIDDLEWARES DE SEGURIDAD
// =========================================================

// Cabeceras HTTP de seguridad (XSS, clickjacking, MIME sniffing, etc.)
app.use(helmet());

// Limitador de peticiones global: máximo 100 req cada 15 minutos por IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones. Inténtalo de nuevo en 15 minutos.' }
});
app.use(limiter);

// =========================================================
// MIDDLEWARES GLOBALES
// =========================================================

// Configuración de CORS para que tu frontend de React (Vite) pueda hacer peticiones
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true  // Permite el intercambio seguro de cookies/tokens
}));

// Permitir que el servidor entienda datos en formato JSON (body de las peticiones)
app.use(express.json());

// Permitir que el servidor lea cookies (esencial para login con Refresh Tokens)
app.use(cookieParser());

// =========================================================
// RUTAS
// =========================================================

// Ruta base para comprobar que el servidor responde correctamente
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    mensaje: 'Servidor de Gure Oikonomia inicializado con éxito',
    timestamp: new Date()
  });
});

app.use('/api/auth', authRoutes);

// =========================================================
// ERROR HANDLER GLOBAL
// =========================================================

// Debe ir DESPUÉS de todas las rutas. Captura cualquier error lanzado con next(error)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Error interno del servidor';
  res.status(status).json({ ok: false, error: message });
});

// =========================================================
// ARRANQUE DEL SERVIDOR
// =========================================================
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
  console.log(`📌 Prueba el estado en: http://localhost:${PORT}/api/status`);
});
