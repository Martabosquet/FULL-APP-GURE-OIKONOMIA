import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';

const app = express();

// =========================================================
// MIDDLEWARES DE SEGURIDAD
// =========================================================

// Cabeceras HTTP de seguridad
app.use(helmet());

// Limitador de peticiones global
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

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// =========================================================
// RUTAS
// =========================================================

app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        mensaje: 'Servidor de Gure Oikonomia inicializado con éxito',
        timestamp: new Date()
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// =========================================================
// ERROR HANDLER GLOBAL
// =========================================================

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error(err);
    const status = err.statusCode || err.status || 500;
    const message = err.message || 'Error interno del servidor';
    res.status(status).json({ ok: false, error: message });
});

// Exportamos la app configurada
export default app;
