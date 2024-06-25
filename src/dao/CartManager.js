import fs from 'fs/promises'

class CartManager {
    constructor(path) {
        this.carts = []
        this.path = path
        this.lastId = 0
        // Se cargan los carritos almacenados en el archivo
        this.loadCarts()
    }

    async loadCarts() {
        try {
            const data = await fs.readFile(this.path, "utf-8")
            this.carts = JSON.parse(data)
            if (this.carts.length > 0) {
                this.lastId = Math.max(...this.carts.map(cart => cart.id))
            }
        } catch (error) {
            console.error("Error loading carts from the file", error)
            // Si el archivo no existe, se crea.
            await this.saveCarts()
        }
    }

    async saveCarts() {
        try {
            await fs.writeFile(this.path, JSON.stringify(this.carts, null, 4))
        } catch (error) {
            console.error("Error saving the file", error)
        }
    }

    async createCart() {
        try {
            const newCart = {
                id: ++this.lastId,
                products: []
            }
            this.carts.push(newCart)
            // Se guarda el array en el archivo
            await this.saveCarts()
            return newCart
        } catch (error) {
            console.error("Error creating a cart", error)
        }
    }

    async getCartById(cartId) {
        try {
            const cart = this.carts.find(cart => cart.id === cartId)
            if (!cart) {
                console.error(`No cart exists with the id ${cartId}`)
            }
            return cart
        } catch (error) {
            console.error("Error retrieving the cart by id", error)
            throw error
        }
    }

    async addProductToCart(cartId, productId, productManager, quantity = 1) {
        try {
            // Se verifica si el carrito existe en el array de carritos
            const cart = await this.getCartById(cartId)
            if (!cart) {
                console.error(`No cart exists with the id ${cartId}`)
                return cartId
            }

            // Se verifica si el producto existe en el array de productos
            const product = await productManager.getProductById(productId)
            if (!product) {
                console.error(`A product with the id ${productId} was not found.`)
                return productId
            }

            // Se verifica si el producto ya existe en el carrito.
            const productsExist = cart.products.find(p => p.product === productId)
            if (productsExist) {
                productsExist.quantity += quantity
            } else {
                cart.products.push({ product: productId, quantity })
            }

            await this.saveCarts()
            return cart
        } catch (error) {
            console.error("Error adding a product to the cart", error)
        }
    }
}
export default CartManager