import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/prisma.js';

describe('User Module (/api/users)', () => {
    const timestamp = Date.now();
    const testUser = {
        name: 'Original Name',
        email: `usertest_${timestamp}@example.com`,
        password: 'Password123!',
        role: 'CUSTOMER',
    };

    let authCookie = null;
    let createdAddressId = null;

    beforeAll(async () => {
        // Registrar e iniciar sesión con el usuario de prueba
        await request(app).post('/api/auth/register').send(testUser);
        const loginRes = await request(app).post('/api/auth/login').send({
            email: testUser.email,
            password: testUser.password,
        });

        authCookie = loginRes.headers['set-cookie'][0];
    });

    afterAll(async () => {
        // Limpiar usuario y sus direcciones
        await prisma.user.deleteMany({
            where: { email: { startsWith: 'usertest_' } },
        });
    });

    describe('GET & PUT /api/users/profile', () => {
        it('debe obtener el perfil del usuario autenticado (200)', async () => {
            const res = await request(app)
                .get('/api/users/profile')
                .set('Cookie', [authCookie]);

            expect(res.status).toBe(200);
            expect(res.body.ok).toBe(true);
            expect(res.body.data.email).toBe(testUser.email);
            expect(res.body.data.name).toBe('Original Name');
        });

        it('debe actualizar los datos personales del perfil (200)', async () => {
            const res = await request(app)
                .put('/api/users/profile')
                .set('Cookie', [authCookie])
                .send({
                    name: 'Nombre Actualizado',
                    lastName: 'Apellidos Prueba',
                    phone: '+34611223344',
                });

            expect(res.status).toBe(200);
            expect(res.body.ok).toBe(true);
            expect(res.body.data.name).toBe('Nombre Actualizado');
            expect(res.body.data.lastName).toBe('Apellidos Prueba');
            expect(res.body.data.phone).toBe('+34611223344');
        });

        it('debe ignorar el cambio de rol si un usuario intenta promoverse a ADMIN (200)', async () => {
            const res = await request(app)
                .put('/api/users/profile')
                .set('Cookie', [authCookie])
                .send({
                    name: 'Intento Hack',
                    role: 'ADMIN',
                });

            expect(res.status).toBe(200);
            expect(res.body.data.role).toBe('CUSTOMER');
        });

        it('debe denegar el acceso al perfil si no se envía la cookie (403)', async () => {
            const res = await request(app).get('/api/users/profile');

            expect(res.status).toBe(403);
            expect(res.body.ok).toBe(false);
        });
    });

    describe('PUT /api/users/change-password', () => {
        it('debe rechazar el cambio si la contraseña actual es errónea (400)', async () => {
            const res = await request(app)
                .put('/api/users/change-password')
                .set('Cookie', [authCookie])
                .send({
                    currentPassword: 'wrongPassword!',
                    newPassword: 'NewPassword123!',
                });

            expect(res.status).toBe(400);
            expect(res.body.ok).toBe(false);
        });

        it('debe rechazar el cambio si la nueva contraseña es corta (400)', async () => {
            const res = await request(app)
                .put('/api/users/change-password')
                .set('Cookie', [authCookie])
                .send({
                    currentPassword: testUser.password,
                    newPassword: '123',
                });

            expect(res.status).toBe(400);
            expect(res.body.ok).toBe(false);
        });

        it('debe cambiar la contraseña con éxito (200)', async () => {
            const res = await request(app)
                .put('/api/users/change-password')
                .set('Cookie', [authCookie])
                .send({
                    currentPassword: testUser.password,
                    newPassword: 'NewPassword123!',
                });

            expect(res.status).toBe(200);
            expect(res.body.ok).toBe(true);

            // Comprobar que se puede iniciar sesión con la nueva contraseña
            const reloginRes = await request(app).post('/api/auth/login').send({
                email: testUser.email,
                password: 'NewPassword123!',
            });
            expect(reloginRes.status).toBe(200);
            authCookie = reloginRes.headers['set-cookie'][0];
        });
    });

    describe('CRUD /api/users/addresses', () => {
        it('debe crear una nueva dirección (201)', async () => {
            const newAddress = {
                label: 'Casa',
                fullName: 'Nombre Destinatario',
                street: 'Gran Vía',
                number: '45',
                floorDoor: '3º A',
                city: 'Madrid',
                province: 'Madrid',
                postalCode: '28013',
                country: 'España',
                phone: '+34600112233',
                isDefault: true,
            };

            const res = await request(app)
                .post('/api/users/addresses')
                .set('Cookie', [authCookie])
                .send(newAddress);

            expect(res.status).toBe(201);
            expect(res.body.ok).toBe(true);
            expect(res.body.data).toHaveProperty('id');
            expect(res.body.data.street).toBe('Gran Vía');
            expect(res.body.data.isDefault).toBe(true);

            createdAddressId = res.body.data.id;
        });

        it('debe obtener la lista de direcciones del usuario (200)', async () => {
            const res = await request(app)
                .get('/api/users/addresses')
                .set('Cookie', [authCookie]);

            expect(res.status).toBe(200);
            expect(res.body.ok).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data.length).toBeGreaterThan(0);
        });

        it('debe modificar la dirección existente (200)', async () => {
            const res = await request(app)
                .put(`/api/users/addresses/${createdAddressId}`)
                .set('Cookie', [authCookie])
                .send({
                    street: 'Gran Vía Modificada',
                    floorDoor: '4º B',
                });

            expect(res.status).toBe(200);
            expect(res.body.ok).toBe(true);
            expect(res.body.data.street).toBe('Gran Vía Modificada');
        });

        it('debe devolver error 404 al intentar modificar una dirección inexistente (404)', async () => {
            const res = await request(app)
                .put('/api/users/addresses/999999')
                .set('Cookie', [authCookie])
                .send({ street: 'Inexistente' });

            expect(res.status).toBe(404);
            expect(res.body.ok).toBe(false);
        });

        it('debe marcar la dirección como predeterminada (200)', async () => {
            const res = await request(app)
                .patch(`/api/users/addresses/${createdAddressId}/default`)
                .set('Cookie', [authCookie]);

            expect(res.status).toBe(200);
            expect(res.body.ok).toBe(true);
            expect(res.body.data.isDefault).toBe(true);
        });

        it('debe eliminar la dirección creada (200)', async () => {
            const res = await request(app)
                .delete(`/api/users/addresses/${createdAddressId}`)
                .set('Cookie', [authCookie]);

            expect(res.status).toBe(200);
            expect(res.body.ok).toBe(true);
            expect(res.body.message).toContain('eliminada');
        });

        it('debe devolver error 404 al intentar eliminar una dirección inexistente (404)', async () => {
            const res = await request(app)
                .delete('/api/users/addresses/999999')
                .set('Cookie', [authCookie]);

            expect(res.status).toBe(404);
            expect(res.body.ok).toBe(false);
        });
    });
});
