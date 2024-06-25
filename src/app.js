import './database.js'
import express from 'express'
import cookieParser from 'cookie-parser'
import session from 'express-session'
import http from 'http'
import expressHandlebars from 'express-handlebars'
import MongoStore from 'connect-mongo'
import passport from 'passport'
import { swaggerUi, specs } from './config/swagger.config.js'

import UserModel from './models/user.model.js'
import ProductController from './controllers/product.controller.js'
import CartController from './controllers/cart.controller.js'
import UserController from './controllers/user.controller.js'
import ViewsController from './controllers/views.controller.js'
import MockingController from './controllers/mocking.controller.js'
import LoggerController from './controllers/logger.controller.js'
import SocketManager from './sockets/socketManager.js'

import handleError from './middleware/handleError.js'
import handleLogger from './middleware/handleLogger.js'
import logger from './utils/logger.js'
import authMiddleware from './middleware/auth.js'
import initializePassport from './config/passport.config.js'

// Rutas
import viewsRouter from './routes/views.router.js'
import productsRouter from './routes/products.router.js'
import cartRouter from './routes/cart.router.js'
import usersRouter from './routes/users.router.js'
import mockingRouter from './routes/mocking.router.js'
import loggerRouter from './routes/logger.router.js'

// Variables de entorno
import configObject from './config/config.js'
const { app_port, app_host, mongo_url } = configObject

// Servidor
const app = express()
const server = http.createServer(app)
const PORT = app_port

// Nuevas instancias de las Clases
const productController = new ProductController()
const cartController = new CartController()
const userController = new UserController()
const viewsController = new ViewsController()
const mockingController = new MockingController()
const loggerController = new LoggerController()

// Middlewares
app.use(handleLogger) // Niveles de errores
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cookieParser())
app.use(session({
    secret: 'secretCoder',
    resave: true,
    saveUninitialized: true,
    store: MongoStore.create({
        mongoUrl: mongo_url, ttl: 3600
    })
}))
initializePassport()
app.use(passport.initialize())
app.use(passport.session())

// Handlebars
const hbs = expressHandlebars.create({
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true,
    },
})
app.engine('handlebars', hbs.engine)
app.set('view engine', 'handlebars')
app.set('views', './src/views')
app.use(authMiddleware)

// Variables globales para el sitio
app.use(async (req, res, next) => {
    res.locals.user = req.user // Establecer datos del usuario para todas las vistas
    if (req.user && req.user.role !== 'admin') {
        const user = await UserModel.findOne({ _id: req.user._id }).populate("cart")
        const usercartProducts = user.cart.products
        let productos = 0
        for (let y = 0; y < usercartProducts.length; y++) {
            productos = productos + usercartProducts[y].quantity
        }
        res.locals.cartQuantity = productos
    } else {
        res.locals.cartQuantity = 0
    }
    res.locals.isUserPremium = req.user && req.user.role === 'premium' // Verifica si el usuario es premium
    res.locals.isUserAdmin = req.user && req.user.role === 'admin' // Verifica si el usuario es administrador
    next() // Continuar con la solicitud
})

// Routing
app.use('/', viewsRouter(viewsController)) // Rutas de vistas
app.use('/api/products', productsRouter(productController)) // Rutas de productos
app.use('/api/carts', cartRouter(cartController)) // Rutas de carritos
app.use('/api/users', usersRouter(userController)) // Rutas de usuarios
app.use('/mockingproducts', mockingRouter(mockingController)) // Ruta de productos fake
app.use('/loggertest', loggerRouter(loggerController)) // Ruta de testeo de errores
app.use(handleError) // Manejo de errores
app.use('/apidocs', swaggerUi.serve, swaggerUi.setup(specs)) // Ruta de documentación de Api

// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static('./src/public'))

// Configuración de manejo de errores 404 - Página no encontrada
app.use((req, res, next) => {
    res.status(404).render('notFound', { title: 'Page Not Found' })
})

// Websockets
new SocketManager(server)

server.listen(PORT, `${app_host}`, () => {
    logger.info(`Server is running at http://localhost:${PORT}`)
})