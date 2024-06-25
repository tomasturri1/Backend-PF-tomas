import express from 'express'
const router = express.Router()

export default (cartController) => {
    // Ruta POST /api/carts - se crea un nuevo carrito
    router.post('/', cartController.createCart)

    // Ruta GET /api/carts/:cid - se listan los productos que pertenecen a determinado carrito
    router.get('/:cid', cartController.getCartById)

    // Ruta POST /api/carts/:cid/product/:pid - se agregan productos a distintos carritos
    router.post('/:cid/product/:pid', cartController.addProductToCart)

    // Ruta POST /api/carts/:cid/product/:pid/remove - se reduce productos a distintos carritos
    router.delete('/:cid/product/:pid/remove', cartController.sacarProductToCart)

    // Ruta DELETE /api/carts/:cid - se eliminan todos los productos del carrito (se vacía el mismo)
    router.delete('/:cid', cartController.clearCart)

    // Ruta DELETE /api/carts/:cid/products/:pid - se elimina un producto del carrito
    router.delete('/:cid/product/:pid', cartController.deleteProductFromCart)

    // Ruta PUT api/carts/:cid/products/:pid - se actualiza la cantidad de un producto especifico en el carrito
    router.put('/:cid/product/:pid', cartController.updateProductQuantityInCart)

    // Ruta PUT api/carts/:cid - se actualiza el carrito con un arreglo de productos
    router.put('/:cid', cartController.updateCart)

    // Ruta POST api/carts/:cid/purchase - se ejecuta el proceso de finalización de compra
    router.post('/:cid/purchase', cartController.completePurchase)

    return router
}