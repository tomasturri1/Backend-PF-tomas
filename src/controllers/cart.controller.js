import UserModel from '../models/user.model.js'
import ProductServices from '../services/productServices.js'
import CartServices from '../services/cartServices.js'
import CartUtils from '../utils/cartUtils.js'
import EmailServices from '../services/emailServices.js'
import TicketModel from '../models/ticket.model.js'
import logger from '../utils/logger.js'

const productServices = new ProductServices()
const cartServices = new CartServices()
const cartUtils = new CartUtils()
const emailServices = new EmailServices()

class CartController {
    async createCart(req, res) {
        try {
            const newCart = await cartServices.createCart()
            res.json({ newCart })
        } catch (error) {
            logger.error('Error creating a new cart', error)
            res.status(500).json({ error: 'Internal Server Error' })
        }
    }

    async getCartById(req, res) {
        const cartId = req.params.cid
        try {
            const cart = await cartServices.getCartById(cartId)
            if (!cart) {
                res.status(404).json({ error: `No cart exists with the id ${cartId}` })
            } else {
                res.json(cart.products)
            }
        } catch (error) {
            logger.error('Error retrieving the cart', error)
            res.status(500).json({ error: 'Internal Server Error' })
        }
    }
    async sacarProductToCart(req, res) {
        // const user = req.session.user
        const cartId = req.params.cid
        const productId = req.params.pid
        const quantity = req.body.quantity || 1
        const quantitySpeed = req.body.quantitySpeed
        try {
            // Se verifica si el carrito existe en el array de carritos
            const verifyCartId = await cartServices.getCartById(cartId)
            if (!verifyCartId) {
                res.status(404).json({ error: `No cart exists with the id ${cartId}` })
                return cartId
            }

            // Se verifica si el producto existe en el array de productos
            const verifyProductId = await productServices.getProductById(productId)
            if (!verifyProductId) {
                res.status(404).json({ error: `A product with the id ${productId} was not found.` })
                return productId
            }

            // Se verifica que la cantidad sea un número positivo
            if (typeof quantity !== 'number' || quantity <= 0) {
                res.status(404).json({ error: `Quantity (${quantity}) must be a positive number.` })
                return quantity
            }

            const carritoActualizado = await cartServices.sacarProductToCart(cartId, productId, quantity, quantitySpeed)
            res.status(200).json({ carritoActualizado })
        } catch (error) {
            logger.error('Error adding a product to the cart', error)
            res.status(500).json({ error: 'Internal Server Error' })
        }
    }

    async addProductToCart(req, res) {
        const cartId = req.params.cid
        const productId = req.params.pid
        const quantity = req.body.quantity || 1
        const quantitySpeed = req.body.quantitySpeed
        try {
            // Se verifica si el carrito existe en el array de carritos
            const verifyCartId = await cartServices.getCartById(cartId)
            if (!verifyCartId) {
                res.status(404).json({ error: `No cart exists with the id ${cartId}` })
                return cartId
            }

            // Se verifica si el producto existe en el array de productos
            const verifyProductId = await productServices.getProductById(productId)
            if (!verifyProductId) {
                res.status(404).json({ error: `A product with the id ${productId} was not found.` })
                return productId
            }

            // Se verifica que la cantidad sea un número positivo
            if (typeof quantity !== 'number' || quantity <= 0) {
                res.status(404).json({ error: `Quantity (${quantity}) must be a positive number.` })
                return quantity
            }

            const cart = await cartServices.addProductToCart(cartId, productId, quantity, quantitySpeed)
            res.status(200).json({ cart })
        } catch (error) {
            logger.error('Error adding a product to the cart', error)
            res.status(500).json({ error: 'Internal Server Error' })
        }
    }

    async clearCart(req, res) {
        const cartId = req.params.cid
        try {
            // Se verifica si el carrito existe en el array de carritos
            const verifyCartId = await cartServices.getCartById(cartId)
            if (!verifyCartId) {
                res.status(404).json({ error: `No cart exists with the id ${cartId}` })
                return cartId
            }
            // Se llama a la función clearCart del cartManager para eliminar todos los productos del carrito
            await cartServices.clearCart(cartId)
            // Se envía una respuesta exitosa al cliente
            res.status(200).json({ message: 'All products have deleted from cart successfully.' })
        } catch (error) {
            logger.error('Error deleting products from cart', error)
            res.status(500).json({ error: 'Internal Server Error' })
        }
    }

    async deleteProductFromCart(req, res) {
        const cartId = req.params.cid
        const productId = req.params.pid
        try {
            // Se verifica si el carrito existe en el array de carritos
            const cart = await cartServices.getCartById(cartId)
            if (!cart) {
                return res.status(404).json({ error: `Cart with id ${cartId} not found` })
            }

            // Se verifica si el producto existe en el array de productos
            const verifyProductId = await productServices.getProductById(productId)
            if (!verifyProductId) {
                res.status(404).json({ error: `A product with the id ${productId} was not found.` })
                return productId
            }

            // Se elimina el producto del carrito
            await cartServices.deleteProductFromCart(cartId, productId)
            res.json({ message: `Product with id ${productId} was removed from cart with id ${cartId}` })
        } catch (error) {
            logger.error('Error deleting product from cart', error)
            res.status(500).json({ error: 'Internal Server Error' })
        }
    }

    async updateProductQuantityInCart(req, res) {
        const cartId = req.params.cid
        const productId = req.params.pid
        const { quantity } = req.body
        try {
            // Se verifica si el carrito existe en el array de carritos
            const cart = await cartServices.getCartById(cartId)
            if (!cart) {
                return res.status(404).json({ error: `Cart with id ${cartId} not found` })
            }

            // Se verifica si el producto existe en el array de productos
            const verifyProductId = await productServices.getProductById(productId)
            if (!verifyProductId) {
                res.status(404).json({ error: `A product with the id ${productId} was not found.` })
                return productId
            }

            // Se verifica si el producto existe en el carrito
            const productToUpdate = cart.products.find(p => p.product.equals(productId))
            if (!productToUpdate) {
                res.status(404).json({ error: `A product with the id ${productId} was not found in the cart.` })
                return null
            }

            // Se verifica que la cantidad sea un número positivo
            if (typeof quantity !== 'number' || quantity <= 0) {
                res.status(404).json({ error: `Quantity (${quantity}) must be a positive number.` })
                return quantity
            }

            // Se actualiza la cantidad del producto en el carrito
            const updatedCart = await cartServices.updateProductQuantityInCart(cartId, productId, quantity)

            // Se envia una respuesta con el carrito actualizado
            res.json(updatedCart.products)
        } catch (error) {
            logger.error('Error updating product quantity in cart', error)
            res.status(500).json({ error: 'Internal Server Error' })
        }
    }

    async updateCart(req, res) {
        const cartId = req.params.cid
        const newProducts = req.body
        try {
            // Se verifica si el carrito existe en el array de carritos
            const cart = await cartServices.getCartById(cartId)
            if (!cart) {
                return res.status(404).json({ error: `Cart with id ${cartId} not found` })
            }

            // Se actualiza el carrito con los nuevos productos
            const updatedCart = await cartServices.updateCart(cartId, newProducts)

            res.json(updatedCart)
        } catch (error) {
            logger.error('Error updating cart:', error)
            res.status(500).json({ error: 'Internal Server Error' })
        }
    }

    async completePurchase(req, res) {
        const cartId = req.params.cid
        try {
            // Se obtiene el carrito y sus productos
            const cart = await cartServices.getCartById(cartId)
            const products = cart.products

            // Se inicializa un arreglo para almacenar los productos no disponibles
            const unavailableProducts = []

            // Se inicializa un arreglo para almacenar los productos comprados
            const purchasedProducts = []

            // Se verifica el stock y actualizar los productos disponibles
            for (const item of products) {
                const productId = item.product
                const product = await productServices.getProductById(productId)
                if (product.stock >= item.quantity) {
                    // Si hay suficiente stock, restar la cantidad del producto
                    product.stock -= item.quantity
                    await product.save()
                    // Se Agrega el producto a la lista de productos comprados
                    purchasedProducts.push({ product: product, quantity: item.quantity })
                } else {
                    // Si no hay suficiente stock, agregar el ID del producto al arreglo de no disponibles
                    unavailableProducts.push(productId)
                }
            }

            const userWithCart = await UserModel.findOne({ cart: cartId })

            // Crear un ticket con los datos de la compra
            const ticket = new TicketModel({
                code: cartUtils.generateUniqueCode(),
                purchase_datetime: new Date(),
                amount: cartUtils.calculateTotal(cart.products),
                purchaser: userWithCart._id
            })
            await ticket.save()

            // Se elimina del carrito los productosue sí se compraron
            cart.products = cart.products.filter(item => unavailableProducts.some(productId => productId.equals(item.product)))

            // Se guarda el carrito actualizado en la base de datos
            await cart.save()

            // Se envía un email con los datos de la compra
            await emailServices.sendPurchaseEmail(userWithCart.email, userWithCart.username, ticket, purchasedProducts)

            // Se renderiza una vista con los datos de compra
            res.render('ticket', { title: 'Your Order' })
        } catch (error) {
            logger.error('Error processing purchase:', error)
            res.status(500).json({ error: 'Internal server error' })
        }
    }
}
export default CartController