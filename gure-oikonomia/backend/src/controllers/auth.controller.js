import { authService } from "../services/auth.service.js"

const register = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;

        if (!email || !password) {
            const error = new Error("Email y contraseña son requeridos");
            error.statusCode = 400;
            throw error;
        }

        const newUser = await authService.registerUser(name, email, password, role);

        res.status(201).json({
            ok: true,
            message: "Usuario registrado con éxito",
            data: newUser,
        });
    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            const error = new Error("Email y contraseña son obligatorios")
            error.statusCode = 400
            throw error
        }

        // Suponiendo que authService.login ahora devuelve { token, user } en vez de solo el token
        const { token, user } = await authService.login(email, password)

        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 2 * 60 * 60 * 1000,
        }

        res.cookie("token", token, cookieOptions)

        res.json({
            ok: true,
            message: "El login se realizó con éxito",
            // El token NO va aquí (sigue solo en la cookie httpOnly) pero sí mandamos los datos básicos para pintar la UI
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        })

    } catch (error) {
        next(error);
    }
}

const logout = (req, res, next) => {
    try {
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        };

        res.clearCookie("token", cookieOptions);

        res.json({
            ok: true,
            message: "Sesión cerrada",
        });
    } catch (error) {
        next(error);
    }
};

const meController = async function (req, res, next) {
    try {
        const user = await authService.getMe(req.user.id);
        res.json({
            ok: true,
            data: user,
        });
    } catch (error) {
        next(error);
    }
}

export const authController = {
    register,
    login,
    logout,
    meController,
}