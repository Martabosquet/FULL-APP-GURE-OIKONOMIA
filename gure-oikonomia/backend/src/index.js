import dotenv from 'dotenv';
import app from './app.js';

// Cargar variables de entorno antes de arrancar nada
dotenv.config();

const PORT = process.env.PORT || 3000;

// =========================================================
// ARRANQUE DEL SERVIDOR
// =========================================================
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
  console.log(`📌 Prueba el estado en: http://localhost:${PORT}/api/status`);
});
