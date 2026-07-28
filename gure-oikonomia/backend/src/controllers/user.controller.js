import { userService } from '../services/user.service.js';

const getProfile = async (req, res, next) => {
    try {
        const profile = await userService.getProfile(req.user.id);
        res.json({
            ok: true,
            data: profile,
        });
    } catch (error) {
        next(error);
    }
};

const updateProfile = async (req, res, next) => {
    try {
        const { name, lastName, phone } = req.body;
        const updatedUser = await userService.updateProfile(req.user.id, { name, lastName, phone });
        res.json({
            ok: true,
            message: "Perfil actualizado con éxito",
            data: updatedUser,
        });
    } catch (error) {
        next(error);
    }
};

const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            const error = new Error("Debes proporcionar la contraseña actual y la nueva contraseña");
            error.statusCode = 400;
            throw error;
        }

        const result = await userService.changePassword(req.user.id, currentPassword, newPassword);
        res.json({
            ok: true,
            message: result.message,
        });
    } catch (error) {
        next(error);
    }
};

const getAddresses = async (req, res, next) => {
    try {
        const addresses = await userService.getAddresses(req.user.id);
        res.json({
            ok: true,
            data: addresses,
        });
    } catch (error) {
        next(error);
    }
};

const createAddress = async (req, res, next) => {
    try {
        const newAddress = await userService.createAddress(req.user.id, req.body);
        res.status(201).json({
            ok: true,
            message: "Dirección guardada con éxito",
            data: newAddress,
        });
    } catch (error) {
        next(error);
    }
};

const updateAddress = async (req, res, next) => {
    try {
        const updatedAddress = await userService.updateAddress(req.user.id, req.params.id, req.body);
        res.json({
            ok: true,
            message: "Dirección actualizada con éxito",
            data: updatedAddress,
        });
    } catch (error) {
        next(error);
    }
};

const deleteAddress = async (req, res, next) => {
    try {
        const result = await userService.deleteAddress(req.user.id, req.params.id);
        res.json({
            ok: true,
            message: result.message,
        });
    } catch (error) {
        next(error);
    }
};

const setDefaultAddress = async (req, res, next) => {
    try {
        const defaultAddress = await userService.setDefaultAddress(req.user.id, req.params.id);
        res.json({
            ok: true,
            message: "Dirección predeterminada actualizada",
            data: defaultAddress,
        });
    } catch (error) {
        next(error);
    }
};

export const userController = {
    getProfile,
    updateProfile,
    changePassword,
    getAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
};
