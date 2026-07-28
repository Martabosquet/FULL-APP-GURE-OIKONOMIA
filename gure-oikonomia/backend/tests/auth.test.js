import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/prisma.js';

describe('Auth Module (/api/auth)', () => {
    const timestamp = Date.now();
    const testUser = {
        name: 'Test Auth User',
        email: `authtest_${timestamp}@example.com`,
        password: 'Password123!',
        role: 'CUSTOMER',
    };

    let authCookie = null;

    afterAll(async () => {
        // Limpiar los usuarios creados durante las pruebas
        await prisma.user.deleteMany({
            where: { email: { startsWith: 'authtest_' } },
        });
    });

    describe('POST /api/auth/register', () => {
        it('debe registrar un nuevo usuario con éxito (201)', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send(testUser);

            expect(res.status).toBe(201);
            expect(res.body.ok).toBe(true);
            expect(res.body.data).toHaveProperty('id');
            expect(res.body.data.email).toBe(testUser.email);
            expect(res.body.data).not.toHaveProperty('password');
        });

        it('debe rechazar un registro con email duplicado (409)', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send(testUser);

            expect(res.status).toBe(409);
            expect(res.body.ok).toBe(false);
            expect(res.body.error).toContain('registrado');
        });

        it('debe devolver error 400 si faltan campos obligatorios', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ name: 'Sin Email' });

            expect(res.status).toBe(400);
            expect(res.body.ok).toBe(false);
        });
    });

    describe('POST /api/auth/login', () => {
        it('debe iniciar sesión con credenciales correctas y devolver cookie (200)', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password,
                });

            expect(res.status).toBe(200);
            expect(res.body.ok).toBe(true);
            expect(res.body.user.email).toBe(testUser.email);

            // Verificar que se haya enviado la cabecera Set-Cookie
            const cookies = res.headers['set-cookie'];
            expect(cookies).toBeDefined();
            expect(cookies[0]).toContain('token=');
            authCookie = cookies[0];
        });

        it('debe rechazar contraseña incorrecta (401)', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: 'wrongpassword',
                });

            expect(res.status).toBe(401);
            expect(res.body.ok).toBe(false);
        });
    });

    describe('GET /api/auth/me', () => {
        it('debe devolver los datos del usuario si se pasa la cookie de sesión (200)', async () => {
            const res = await request(app)
                .get('/api/auth/me')
                .set('Cookie', [authCookie]);

            expect(res.status).toBe(200);
            expect(res.body.ok).toBe(true);
            expect(res.body.data.email).toBe(testUser.email);
        });

        it('debe rechazar acceso si no se proporciona cookie o token (403)', async () => {
            const res = await request(app).get('/api/auth/me');

            expect(res.status).toBe(403);
            expect(res.body.ok).toBe(false);
        });
    });

    describe('POST /api/auth/logout', () => {
        it('debe cerrar la sesión con éxito (200)', async () => {
            const res = await request(app).post('/api/auth/logout');

            expect(res.status).toBe(200);
            expect(res.body.ok).toBe(true);
            expect(res.body.message).toContain('cerrada');
        });
    });
});

