import bcrypt from 'bcrypt';
import prisma from '../config/prisma.js';

/**
 * Obtiene los datos del perfil del usuario autenticado.
 */
const getProfile = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: Number(userId) },
        select: {
            id: true,
            name: true,
            lastName: true,
            email: true,
            phone: true,
            role: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    if (!user) {
        const error = new Error("Usuario no encontrado");
        error.statusCode = 404;
        throw error;
    }

    return user;
};

/**
 * Actualiza la información personal del perfil (nombre, apellidos, teléfono).
 */
const updateProfile = async (userId, { name, lastName, phone }) => {
    const updatedUser = await prisma.user.update({
        where: { id: Number(userId) },
        data: {
            ...(name !== undefined && { name }),
            ...(lastName !== undefined && { lastName }),
            ...(phone !== undefined && { phone }),
        },
        select: {
            id: true,
            name: true,
            lastName: true,
            email: true,
            phone: true,
            role: true,
            updatedAt: true,
        },
    });

    return updatedUser;
};

/**
 * Permite cambiar la contraseña verificando primero la contraseña actual.
 */
const changePassword = async (userId, currentPassword, newPassword) => {
    const user = await prisma.user.findUnique({
        where: { id: Number(userId) },
    });

    if (!user) {
        const error = new Error("Usuario no encontrado");
        error.statusCode = 404;
        throw error;
    }

    // Verificar la contraseña actual con bcrypt
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
        const error = new Error("La contraseña actual es incorrecta");
        error.statusCode = 400;
        throw error;
    }

    if (!newPassword || newPassword.length < 6) {
        const error = new Error("La nueva contraseña debe tener al menos 6 caracteres");
        error.statusCode = 400;
        throw error;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
        where: { id: Number(userId) },
        data: { password: hashedPassword },
    });

    return { message: "Contraseña actualizada con éxito" };
};

/**
 * Obtiene todas las direcciones guardadas por el usuario.
 */
const getAddresses = async (userId) => {
    const addresses = await prisma.address.findMany({
        where: { userId: Number(userId) },
        orderBy: [
            { isDefault: 'desc' },
            { createdAt: 'desc' },
        ],
    });

    return addresses;
};

/**
 * Crea una nueva dirección para el usuario. Si se marca como predeterminada,
 * desmarca las direcciones predeterminadas anteriores.
 */
const createAddress = async (userId, addressData) => {
    const numericUserId = Number(userId);

    const {
        label,
        fullName,
        street,
        number,
        floorDoor,
        city,
        province,
        postalCode,
        country = 'España',
        phone,
        isDefault = false,
    } = addressData;

    if (!fullName || !street || !city || !province || !postalCode) {
        const error = new Error("Nombre completo, calle, ciudad, provincia y código postal son obligatorios");
        error.statusCode = 400;
        throw error;
    }

    // Si la nueva dirección es predeterminada, desmarcar las existentes
    if (isDefault) {
        await prisma.address.updateMany({
            where: { userId: numericUserId, isDefault: true },
            data: { isDefault: false },
        });
    }

    // Si es la primera dirección que crea el usuario, hacerla predeterminada automáticamente
    const addressCount = await prisma.address.count({ where: { userId: numericUserId } });
    const shouldBeDefault = isDefault || addressCount === 0;

    const newAddress = await prisma.address.create({
        data: {
            userId: numericUserId,
            label,
            fullName,
            street,
            number,
            floorDoor,
            city,
            province,
            postalCode,
            country,
            phone,
            isDefault: shouldBeDefault,
        },
    });

    return newAddress;
};

/**
 * Edita una dirección existente comprobando la propiedad.
 */
const updateAddress = async (userId, addressId, addressData) => {
    const numericUserId = Number(userId);
    const numericAddressId = Number(addressId);

    const existingAddress = await prisma.address.findFirst({
        where: { id: numericAddressId, userId: numericUserId },
    });

    if (!existingAddress) {
        const error = new Error("Dirección no encontrada");
        error.statusCode = 404;
        throw error;
    }

    // Si se está marcando como predeterminada, desmarcar las otras
    if (addressData.isDefault) {
        await prisma.address.updateMany({
            where: { userId: numericUserId, isDefault: true },
            data: { isDefault: false },
        });
    }

    const updatedAddress = await prisma.address.update({
        where: { id: numericAddressId },
        data: {
            ...(addressData.label !== undefined && { label: addressData.label }),
            ...(addressData.fullName !== undefined && { fullName: addressData.fullName }),
            ...(addressData.street !== undefined && { street: addressData.street }),
            ...(addressData.number !== undefined && { number: addressData.number }),
            ...(addressData.floorDoor !== undefined && { floorDoor: addressData.floorDoor }),
            ...(addressData.city !== undefined && { city: addressData.city }),
            ...(addressData.province !== undefined && { province: addressData.province }),
            ...(addressData.postalCode !== undefined && { postalCode: addressData.postalCode }),
            ...(addressData.country !== undefined && { country: addressData.country }),
            ...(addressData.phone !== undefined && { phone: addressData.phone }),
            ...(addressData.isDefault !== undefined && { isDefault: addressData.isDefault }),
        },
    });

    return updatedAddress;
};

/**
 * Elimina una dirección comprobando la propiedad.
 */
const deleteAddress = async (userId, addressId) => {
    const numericUserId = Number(userId);
    const numericAddressId = Number(addressId);

    const existingAddress = await prisma.address.findFirst({
        where: { id: numericAddressId, userId: numericUserId },
    });

    if (!existingAddress) {
        const error = new Error("Dirección no encontrada");
        error.statusCode = 404;
        throw error;
    }

    await prisma.address.delete({
        where: { id: numericAddressId },
    });

    // Si se eliminó la dirección predeterminada, asignamos la más reciente como predeterminada si queda alguna
    if (existingAddress.isDefault) {
        const firstRemaining = await prisma.address.findFirst({
            where: { userId: numericUserId },
            orderBy: { createdAt: 'desc' },
        });

        if (firstRemaining) {
            await prisma.address.update({
                where: { id: firstRemaining.id },
                data: { isDefault: true },
            });
        }
    }

    return { message: "Dirección eliminada correctamente" };
};

/**
 * Marca una dirección específica como la predeterminada.
 */
const setDefaultAddress = async (userId, addressId) => {
    const numericUserId = Number(userId);
    const numericAddressId = Number(addressId);

    const existingAddress = await prisma.address.findFirst({
        where: { id: numericAddressId, userId: numericUserId },
    });

    if (!existingAddress) {
        const error = new Error("Dirección no encontrada");
        error.statusCode = 404;
        throw error;
    }

    // Desmarcar las otras direcciones
    await prisma.address.updateMany({
        where: { userId: numericUserId, isDefault: true },
        data: { isDefault: false },
    });

    // Establecer la seleccionada
    const defaultAddress = await prisma.address.update({
        where: { id: numericAddressId },
        data: { isDefault: true },
    });

    return defaultAddress;
};

export const userService = {
    getProfile,
    updateProfile,
    changePassword,
    getAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
};
