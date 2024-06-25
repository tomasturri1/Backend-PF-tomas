import passport from 'passport'
import jwt from 'passport-jwt'
import jwtSign from 'jsonwebtoken'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
const { Strategy: JWTStrategy, ExtractJwt } = jwt

// Traemos las funcionalidades del Carrito
import CartServices from '../services/cartServices.js'
const cartServices = new CartServices()

// Traemos el UserModel y las funciones de bcrypt
import UserModel from '../models/user.model.js'

// Traemos las variables de entorno
import configObject from '../config/config.js'
const { secret_cookie_token, google_client_id, google_client_secret, google_callback_url } = configObject

const initializePassport = () => {
    passport.use('jwt', new JWTStrategy({
        jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
        secretOrKey: secret_cookie_token,
    }, async (jwt_payload, done) => {
        try {
            return done(null, jwt_payload)
        } catch (error) {
            return done(error)
        }
    }))

    // Se agrega una estrategia para el login con Google
    passport.use(new GoogleStrategy({
        clientID: google_client_id,
        clientSecret: google_client_secret,
        callbackURL: google_callback_url,
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            // Se valida si ya existe un usuario de google en la base de datos
            let user = await UserModel.findOne({ email: profile._json.email })
            if (!user) {
                // Si el usuario no existe, crea uno nuevo
                const googleProfileName = profile._json.name // Username original de google
                const userName = googleProfileName.replace(/\s+/g, '').toLowerCase() // Se reemplazan espacios y se convierte a minúsculas
                const newCart = await cartServices.createCart()
                user = await UserModel.create({
                    googleId: profile._json.sub,
                    username: userName,
                    first_name: profile._json.given_name,
                    last_name: profile._json.family_name,
                    email: profile._json.email,
                    cart: newCart._id
                })
            }
            // Se genera JWT
            const token = jwtSign.sign({ user: user }, secret_cookie_token, { expiresIn: '1h' })
            return done(null, token)
        } catch (err) {
            return done(err, null)
        }
    }))
}

const cookieExtractor = (req) => {
    let token = null
    if (req && req.cookies) {
        token = req.cookies['cookieAppStore']
    }
    return token
}

export default initializePassport