import CartModel from "../models/carts.model.js"
import ProductServices from '../services/productServices.js'
import logger from "../utils/logger.js"
const productServices = new ProductServices()

class CartServices {
    async createCart() {
        try {
            const newCart = new CartModel({ products: [] })
            await newCart.save()

            logger.info(`Cart created: ${JSON.stringify(newCart)}`)
            return newCart
        } catch (error) {
            logger.error("Error creating a cart", error)
        }
    }

    async getCartById(cartId) {
        try {
            // Se verifica si el carrito existe en el array de carritos
            const cart = await CartModel.findById(cartId)
            if (!cart) {
                logger.error(`No cart exist with the id ${cartId}`)
                return null
            }

            logger.info(`Cart found: ${JSON.stringify(cart)}`)
            return cart
        } catch (error) {
            logger.error("Error retrieving the cart by id", error)
        }
    }

    async sacarProductToCart(cartId, productId, quantity = 1, quantitySpeed) {
        console.log("sacar", quantitySpeed)
        try {
            // Se verifica si el carrito existe en el array de carritos
            const cart = await this.getCartById(cartId)
            if (!cart) {
                logger.error(`No cart exists with the id ${cartId}`)
                return cartId
            }

            // Se verifica si el producto existe en el array de productos
            const product = await productServices.getProductById(productId)
            if (!product) {
                logger.error(`A product with the id ${productId} was not found.`)
                return productId
            }

            // Se verifica que la cantidad sea un número positivo
            if (typeof quantity !== 'number' || quantity <= 0) {
                logger.error(`Quantity (${quantity}) must be a positive number.`)
                return quantity
            }

            // Se verifica si el producto ya existe en el carrito y, sino, se agrega.
            const productExist = cart.products.find(p => p.product.equals(productId))
            if (productExist) {
                productExist.quantity = quantitySpeed ? quantitySpeed : productExist.quantity - quantity
            } else {
                logger.error(`A product with the id ${productId} was not found.`)
                return
            }

            // Se marca la propiedad "products" como modificada antes de guardar
            cart.markModified("products")

            await cart.save()
            logger.info(`Product revomed: ${JSON.stringify(cart)}`)
            return cart

        } catch (error) {
            logger.error("Error adding a product to the cart", error)
        }
    }


    async addProductToCart(cartId, productId, quantity = 1, quantitySpeed) {
        try {
            // Se verifica si el carrito existe en el array de carritos
            const cart = await this.getCartById(cartId)
            if (!cart) {
                logger.error(`No cart exists with the id ${cartId}`)
                return cartId
            }

            // Se verifica si el producto existe en el array de productos
            const product = await productServices.getProductById(productId)
            if (!product) {
                logger.error(`A product with the id ${productId} was not found.`)
                return productId
            }

            // Se verifica que la cantidad sea un número positivo
            if (typeof quantity !== 'number' || quantity <= 0) {
                logger.error(`Quantity (${quantity}) must be a positive number.`)
                return quantity
            }

            // Se verifica si el producto ya existe en el carrito y, sino, se agrega.
            const productExist = cart.products.find(p => p.product.equals(productId))
            if (productExist) {
                productExist.quantity = quantitySpeed ? quantitySpeed : productExist.quantity + quantity
            } else {
                cart.products.push({ product: productId, quantity })
            }

            // Se marca la propiedad "products" como modificada antes de guardar
            cart.markModified("products")

            await cart.save()
            logger.info(`Product added: ${JSON.stringify(cart)}`)
            return cart

        } catch (error) {
            logger.error("Error adding a product to the cart", error)
        }
    }

    async clearCart(cartId) {
        try {
            // Se verifica si el carrito existe en el array de carritos
            const cart = await CartModel.findById(cartId).lean().exec()
            if (!cart) {
                logger.error(`No cart exists with the id ${cartId}`)
                return cartId
            }

            // Se vacia el array de productos del carrito
            cart.products = []
            await CartModel.findByIdAndUpdate(cartId, { products: cart.products }).exec()

            logger.info(`Cart cleared: ${JSON.stringify(cart)}`)
            return cart
        } catch (error) {
            logger.error("Error clearing the cart", error)
            throw error
        }
    }

    async deleteProductFromCart(cartId, productId) {
        try {
            // Se verifica si el producto existe en el array de productos
            const verifyProductId = await productServices.getProductById(productId)
            if (!verifyProductId) {
                logger.error(`A product with the id ${productId} was not found.`)
                return productId
            }

            // Se busca el carrito por su ID y se actualiza el array de productos
            const updatedCart = await CartModel.findByIdAndUpdate(
                cartId,
                { $pull: { products: { product: productId } } }, // Se utiliza $pull para eliminar el producto del array
                { new: true } // Nos devuelve el carrito actualizado después de la operación
            )

            if (!updatedCart) {
                logger.error(`No cart exists with the id ${cartId}`)
                return null
            }

            logger.info(`A product with the id ${productId} was deleted from the cart: ${JSON.stringify(updatedCart)}`)
            return updatedCart
        } catch (error) {
            logger.error("Error deleting product from cart", error)
            throw error
        }
    }

    async updateProductQuantityInCart(cartId, productId, newQuantity) {
        try {
            // Se verifica si el carrito existe en el array de carritos
            const cart = await this.getCartById(cartId)
            if (!cart) {
                logger.error(`No cart exists with the id ${cartId}`)
                return null
            }

            // Se verifica si el producto existe en el array de productos
            const verifyProductId = await productServices.getProductById(productId)
            if (!verifyProductId) {
                logger.error(`A product with the id ${productId} was not found.`)
                return productId
            }

            // Se verifica si el producto existe en el carrito
            const productToUpdate = cart.products.find(p => p.product.equals(productId))
            if (!productToUpdate) {
                logger.error(`A product with the id ${productId} was not found in the cart.`)
                return null
            }

            // Se verifica que la nueva cantidad sea un número positivo
            if (typeof newQuantity !== 'number' || newQuantity <= 0) {
                logger.error(`Quantity (${newQuantity}) must be a positive number.`)
                return newQuantity
            }

            // Se actualiza la cantidad del producto
            productToUpdate.quantity = newQuantity

            // Se guardan los cambios
            await cart.save()
            logger.info(`Quantity updated: ${JSON.stringify(cart)}`)
            return cart
        } catch (error) {
            logger.error("Error updating product quantity in cart", error)
            throw error
        }
    }

    async updateCart(cartId, newProducts) {
        try {
            const updatedCart = await CartModel.findByIdAndUpdate(cartId, { products: newProducts }, { new: true })
            logger.info(`Cart updated: ${JSON.stringify(updatedCart)}`)
            return updatedCart
        } catch (error) {
            logger.error("Error updating cart:", error)
            throw error
        }
    }
}
export default CartServices