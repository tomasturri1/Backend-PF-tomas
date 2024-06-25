import express from 'express'
const router = express.Router()

export default (mockingController) => {
    // Ruta GET /mockingproducts - se generan 100 productsos de manera aleatoria
    router.get("/", mockingController.generateProducts)

    return router
}