import express from 'express'
const router = express.Router()

export default (loggerController) => {
    // Ruta GET /loggertest - se testean los errores
    router.get("/", loggerController.testingLogger)

    return router
}