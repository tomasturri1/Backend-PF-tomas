import logger from '../utils/logger.js'
import passport from 'passport'
import jwt from 'jsonwebtoken'
import UserModel from '../models/user.model.js'
import { createHash, isValidPassword } from '../utils/hashBcrypt.js'
import configObject from '../config/config.js'
import CartModel from '../models/carts.model.js'
import CartServices from '../services/cartServices.js'
import { generateResetToken } from '../utils/password.js'
import EmailServices from '../services/emailServices.js'

const { secret_cookie_token, admin_username, admin_email, admin_password, admin_data, admin_role } = configObject
const cartServices = new CartServices()
const emailServices = new EmailServices()

class UserController {
    // Funciones para administrador
    async getAllUsers(req, res) {
        try {
            const users = await UserModel.find({}, 'username email role')
            res.json({ users })
        } catch (error) {
            logger.error("Error getting the products", error)
            res.satus(500).json({ message: 'Internal Server Error' })
        }
    }

    async changeUserRole(req, res) {
        try {
            const { uid } = req.params
            const user = await UserModel.findOne({ id: uid })

            if (!user) {
                return res.status(404).json({ message: 'User not found' })
            }

            // Se verifica si el usuario ha cargado los documentos requeridos
            const requiredDocuments = ['Proof of account status.pdf']
            const userDocuments = user.documents.map(doc => doc.name)
            const hasRequiredDocuments = requiredDocuments.every(doc => userDocuments.includes(doc))

            if (!hasRequiredDocuments) {
                return res.status(400).json({ message: 'The user must upload the following documents: Proof of account status.pdf' })
            }

            const newRole = user.role === 'user' ? 'premium' : 'user'

            const updatedUser = await UserModel.findByIdAndUpdate(uid, { role: newRole }, { new: true })
            res.status(200).json({ updatedUser })
        } catch (error) {
            logger.error('Error changing user role:', error)
            res.status(500).json({ message: 'Internal server error' })
        }
    }

    async deleteUser(req, res) {
        const userId = req.params.uid
        try {
            const user = await UserModel.findById(userId)
            if (!user) {
                return res.status(404).json({ message: 'User not found' })
            }

            await emailServices.sendUserDeletionEmail(user.email, user.first_name, user.last_name)
            await CartModel.findByIdAndDelete(user.cart)
            await UserModel.findByIdAndDelete(userId)
            res.status(200).json({ message: 'User deleted successfully', user: user })
        } catch (error) {
            logger.error('Error deleting user:', error)
            res.status(500).json({ message: 'Error deleting user', error })
        }
    }

    async deleteInactiveUsers(req, res) {
        try {
            // const thresholdDate = new Date(Date.now() - 5 * 60 * 1000) // Últimos 5 minutos
            const thresholdDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // Últimos 2 días
            const inactiveUsers = await UserModel.find({ last_connection: { $lt: thresholdDate } })

            // Se verifica si no hay usuarios inactivos para eliminar
            if (inactiveUsers.length === 0) {
                return res.status(404).json({ message: 'No inactive users found' })
            }

            for (const user of inactiveUsers) {
                await emailServices.sendUserInactivityDeletionEmail(user.email, user.first_name, user.last_name)
                await CartModel.findByIdAndDelete(user.cart)
                await UserModel.findByIdAndDelete(user._id)
            }

            res.status(200).json({ message: `${inactiveUsers.length} inactive users deleted` })
        } catch (error) {
            logger.error('Error deleting users:', error)
            res.status(500).json({ message: 'Error deleting inactive users', error })
        }
    }

    // Funciones para usuarios
    async register_validate(req, res, next) {
        const { username, email } = req.body
        const errors = {}

        // Se valida si el usuario ya existe
        const existingUser = await UserModel.findOne({ $or: [{ username: username }, { email: email }] })

        // Se valida si el username ya está registrado
        if (existingUser?.username || username === admin_username) {
            errors.username = 'The username is already registered'
        }

        // Se valida si el correo electrónico ya está registrado
        if (existingUser?.email || email === admin_email) {
            errors.email = 'The email address is already registered'
        }

        // Se verifica si hay algun error presente
        if (Object.keys(errors).length > 0) {
            return res.json({ errors })
        }
        next()
    }

    async register(req, res) {
        try {
            const { username, first_name, last_name, email, password, age, role, forTesting } = req.body
            const errors = {}

            // Se valida si el usuario ya existe
            const existingUser = await UserModel.findOne({ $or: [{ username: username }, { email: email }] })

            // Se valida si el username ya está registrado
            if (existingUser?.username || username === admin_username) {
                errors.username = 'The username is already registered'
            }

            // Se valida si el correo electrónico ya está registrado
            if (existingUser?.email || email === admin_email) {
                errors.email = 'The email address is already registered'
            }

            // Se verifica si hay algun error presente
            if (Object.keys(errors).length > 0) {
                return res.json({ errors })
            }

            const newCart = await cartServices.createCart()

            const newUser = {
                username,
                first_name,
                last_name,
                email,
                password: createHash(password),
                age,
                role,
                cart: newCart._id,
                forTesting
            }

            await UserModel.create(newUser)

            res.render('registerSuccess', { title: 'Register Success' })
        } catch (error) {
            logger.error('Error in register:', error)
            res.status(500).send({ error: 'Error in register' })
        }
    }

    // renderFailedRegister(req, res) {
    //     res.render('failedRegister', { title: 'Failed Register' })
    // }

    async login_validate(req, res, next) {
        const { email, password } = req.body
        const user = await UserModel.findOne({ email: email })
        const errors = {}

        const adminUser = {
            username: admin_username,
            first_name: admin_data,
            last_name: admin_data,
            email: admin_email,
            password: admin_password,
            age: admin_data,
            role: admin_role
        }

        if (email === adminUser.email && password === adminUser.password) {
            const token = jwt.sign({ user: adminUser }, secret_cookie_token, { expiresIn: '1h' })
            res.cookie('cookieAppStore', token, {
                maxAge: 3600000,
                httpOnly: true
            })
            res.redirect('/realtimeproducts')
            return
        }

        if (user) {
            // Se verifica si el email y la contraseña son validos para iniciar sesión
            if (user.email !== email || !isValidPassword(password, user)) {
                errors.email = 'The email address or password are incorrect'
                errors.password = 'The email address or password are incorrect'
            }
        } else {
            errors.email = 'The email address or password are incorrect'
            errors.password = 'The email address or password are incorrect'
        }

        // Se verifica si hay algun error presente
        if (Object.keys(errors).length > 0) {
            return res.json({ errors })
        }
        next()
    }

    async login(req, res) {
        const { email, password } = req.body
        try {
            const adminUser = {
                username: admin_username,
                first_name: admin_data,
                last_name: admin_data,
                email: admin_email,
                password: admin_password,
                age: admin_data,
                role: admin_role
            }

            if (email === adminUser.email && password === adminUser.password) {
                const token = jwt.sign({ user: adminUser }, secret_cookie_token, { expiresIn: '1h' })
                res.cookie('cookieAppStore', token, {
                    maxAge: 3600000,
                    httpOnly: true
                })
                res.redirect('/realtimeproducts')
                return
            }

            const user = await UserModel.findOne({ email: email })
            const errors = {}

            if (user) {
                // Se verifica si el email y la contraseña son validos para iniciar sesión
                if (user.email !== email || !isValidPassword(password, user)) {
                    errors.email = 'The email address or password are incorrect'
                    errors.password = 'The email address or password are incorrect'
                }
            } else {
                errors.email = 'The email address or password are incorrect'
                errors.password = 'The email address or password are incorrect'
            }

            // Se verifica si hay algun error presente
            if (Object.keys(errors).length > 0) {
                return res.json({ errors })
            }

            const token = jwt.sign({ user: user }, secret_cookie_token, { expiresIn: '1h' })

            res.cookie('cookieAppStore', token, {
                maxAge: 3600000,
                httpOnly: true
            })

            res.redirect('/products')
        } catch (error) {
            logger.error('Error in login:', error)
            res.status(500).send({ error: 'Error in login' })
        }
    }

    async authGoogle(req, res, next) {
        passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next)
    }

    async authGoogleCallback(req, res, next) {
        passport.authenticate('google', { failureRedirect: '/login' }, (err, data) => {
            if (err) {
                return next(err)
            }
            if (!data) {
                return res.redirect('/login')
            }
            const token = data
            res.cookie('cookieAppStore', token, {
                maxAge: 3600000,
                httpOnly: true
            })
            res.redirect('/products')
        })(req, res, next)
    }

    async logout(req, res) {
        res.clearCookie('cookieAppStore')
        req.logger.info('Logout con exito')
        res.redirect('/login')
    }

    // Validaciones del front para requestPasswordReset
    async requestPasswordReset_validate(req, res, next) {
        const { email } = req.body
        const errors = {}

        // Se valida si el usuario ya existe
        const user = await UserModel.findOne({ email })
        if (!user) {
            errors.email = 'The email adress is incorrect'
        }

        // Se verifica si hay algun error presente
        if (Object.keys(errors).length > 0) {
            return res.json({ errors })
        }
        next()
    }

    async requestPasswordReset(req, res) {
        const { email } = req.body
        try {
            const errors = {}

            // Se valida si el usuario ya existe
            const user = await UserModel.findOne({ email })
            if (!user) {
                errors.email = 'The email adress is incorrect'
            }

            // Se verifica si hay algun error presente
            if (Object.keys(errors).length > 0) {
                return res.json({ errors })
            }

            // Se genera un token
            const resetToken = generateResetToken()

            // Se guarda el token en el usuario
            user.resetToken = {
                token: resetToken,
                expiresAt: new Date(Date.now() + 3600000) // 1 hora de duración
            }
            await user.save()

            // Enviar correo electrónico con el enlace de restablecimiento utilizando EmailService
            await emailServices.sendPasswordResetEmail(email, user.first_name, user.last_name, resetToken)

            res.redirect('/resetpassword')
        } catch (error) {
            logger.error('Error in the new password request:', error)
            res.status(500).json({ message: 'Internal server error' })
        }
    }

    // Validaciones del front para passwordReset
    async passwordReset_validate(req, res, next) {
        const { token, email, password } = req.body
        const errors = {}

        // Se valida si el usuario ya existe
        const user = await UserModel.findOne({ email })
        if (!user) {
            errors.email = 'The email adress is incorrect'
        }

        // Se valida si la nueva contraseña es igual a la anterior
        if (isValidPassword(password, user)) {
            errors.newPassword = "The new password can't be the same as the old one"
        }

        // Se obtiene el token de restablecimiento de la contraseña del usuario
        const resetToken = user.resetToken
        if (resetToken.token !== token) {
            errors.token = 'Reset password token is incorrect'
        }

        // Se verifica si hay algun error presente
        if (Object.keys(errors).length > 0) {
            return res.json({ errors })
        }
        next()
    }

    async resetPassword(req, res) {
        const { token, email, password } = req.body
        try {
            const errors = {}

            // Se valida si el usuario ya existe
            const user = await UserModel.findOne({ email })
            if (!user) {
                errors.email = 'The email adress is incorrect'
            }

            // Se valida si la nueva contraseña es igual a la anterior
            if (isValidPassword(password, user)) {
                errors.newPassword = "The new password can't be the same as the old one"
            }

            // Se obtiene el token de restablecimiento de la contraseña del usuario
            const resetToken = user.resetToken
            if (resetToken.token !== token) {
                errors.token = 'Reset password token is incorrect'
            }

            // Se verifica si hay algun error presente
            if (Object.keys(errors).length > 0) {
                return res.json({ errors })
            }

            // Se verifica si el token ha expirado
            const now = new Date()
            if (now > resetToken.expiresAt) {
                // Se redirige a la página de generación de nuevo correo de restablecimiento
                return res.redirect("/requestpasswordreset")
            }

            // Se actualiza la contraseña del usuario
            user.password = createHash(password)
            user.resetToken = undefined // Se marca el token como utilizado
            await user.save()

            // Renderizar la vista de confirmación de cambio de contraseña
            return res.redirect("/login")
        } catch (error) {
            logger.error('Error resetting password:', error)
            res.status(500).json({ message: 'Internal server error' })
        }
    }

    async uploadDocs(req, res) {
        const { uid } = req.params
        const uploadedDocuments = req.files

        try {
            // Se valida si existe el usuario en la base de datos
            const user = await UserModel.findOne({ id: uid })
            if (!user) {
                return res.status(404).json({ message: 'User not found' })
            }

            // Se verifica si se subieron documentos y se actualiza el usuario
            if (uploadedDocuments) {
                if (uploadedDocuments.document) {
                    user.documents = user.documents.concat(uploadedDocuments.document.map(doc => ({
                        name: doc.originalname,
                        reference: doc.path
                    })))
                }
                if (uploadedDocuments.products) {
                    user.documents = user.documents.concat(uploadedDocuments.products.map(doc => ({
                        name: doc.originalname,
                        reference: doc.path
                    })))
                }
                if (uploadedDocuments.profile) {
                    user.documents = user.documents.concat(uploadedDocuments.profile.map(doc => ({
                        name: doc.originalname,
                        reference: doc.path
                    })))
                }
            }

            // Se guardan los cambios en la base de datos
            await user.save()

            res.status(200).json({ message: 'Documents uploaded successfully' })
        } catch (error) {
            logger.error('Error uploading user documents:', error)
            res.status(500).json({ message: 'Internal server error' })
        }
    }
}
export default UserController