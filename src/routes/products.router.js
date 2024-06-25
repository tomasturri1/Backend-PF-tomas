import express from 'express'
const router = express.Router()

export default (productController) => {
    // Ruta GET /api/products - se listan todos los productos con paginación, filtros y ordenamiento
    router.get("/", productController.getProducts)

    // Ruta GET /api/products/:pid - se obtiene un producto por su id
    router.get("/:pid", productController.getProductById)

    // Ruta POST /api/products - se añade un producto
    router.post("/", productController.addProduct)

    // Ruta PUT /api/products/:pid - se actualiza un producto
    router.put("/:pid", productController.updateProduct)

    // Ruta DELETE /api/products/:pid - se elimina un producto
    router.delete("/:pid", productController.deleteProduct)

    return router
}