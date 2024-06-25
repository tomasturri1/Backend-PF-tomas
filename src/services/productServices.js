import ProductModel from "../models/products.model.js"
import UserModel from "../models/user.model.js"
import EmailServices from "./emailServices.js"
import logger from "../utils/logger.js"
const emailServices = new EmailServices()

class ProductServices {
    async addProduct({ title, description, category, price, code, stock, status, thumbnails, owner }) {
        try {
            // Se valida que todos los campos sean obligatorios
            if (!title || !description || !category || !price || !code || !stock || status == undefined || status == null) {
                logger.error("All fields are mandatory.")
                return
            }

            // Se valida que no se repita el campo "code"
            const productExists = await ProductModel.findOne({ code: code })

            if (productExists) {
                logger.error("A product with that code already exists.")
                return
            }

            const newProduct = new ProductModel({
                title,
                description,
                category,
                price,
                code,
                stock,
                status,
                thumbnails: thumbnails || [],
                owner
            })

            await newProduct.save()
            logger.info(`Product created: ${JSON.stringify(newProduct)}`)
        } catch (error) {
            logger.error("Error adding the product:", error)
            throw error
        }
    }

    async getProducts() {
        try {
            const products = await ProductModel.find()
            logger.info(`Products: ${JSON.stringify(products)}`)
            return products
        } catch (error) {
            logger.error("Error getting the products", error)
        }
    }

    async getProductById(id) {
        try {
            const foundProduct = await ProductModel.findById(id)

            if (!foundProduct) {
                logger.error(`A product with the id ${id} was not found.`)
                return null
            }

            logger.info(`Product found: ${JSON.stringify(foundProduct)}`)
            return foundProduct
        } catch (error) {
            logger.error("Error getting a product by id:", error)
        }
    }

    async updateProduct(id, updatedProduct) {
        try {
            const productToUpdate = await ProductModel.findByIdAndUpdate(id, updatedProduct)

            if (!productToUpdate) {
                logger.error(`A product with the id ${id} was not found.`)
                return null
            }

            logger.info(`Product updated: ${JSON.stringify(updatedProduct)}`)
            return productToUpdate
        } catch (error) {
            logger.error("Error updating the product", error)
        }
    }

    async deleteProduct(id) {
        try {
            const productToDelete = await ProductModel.findByIdAndDelete(id)

            if (!productToDelete) {
                logger.error(`A product with the id ${id} was not found.`)
                return null
            }

            logger.info(`Product deleted: ${JSON.stringify(productToDelete)}`)
        } catch (error) {
            logger.error("Error updating the product")
            throw error
        }
    }

    async deleteProductForAdmin(productId) {
        try {
            // Se verifica si el producto existe en el array de productos
            const productIdToVerify = await ProductModel.findById(productId)
            if (!productIdToVerify) {
                logger.error(`A product with the id ${productId} was not found`)
            }

            // Se verifica si el producto no es del admin, para mandarle un mail al usuario que creó ese producto
            if (productIdToVerify.owner !== 'admin') {
                const user = await UserModel.findOne({ email: productIdToVerify.owner })
                if (!user) {
                    logger.error(`No user found that matches the owner of this product: ${productIdToVerify.title}`)
                }
                emailServices.sendProductUserDeletionEmail(user.email, user.first_name, user.last_name, productIdToVerify.title)
            }

            // Se elimina el producto
            const productToDelete = await ProductModel.deleteOne({ _id: productId })
            logger.info(`Product deleted: ${JSON.stringify(productToDelete)}`)
        } catch (error) {
            logger.error('Error deleting the product:', error)
            throw error
        }
    }

    async getProductsLimit(limit) {
        const products = await ProductModel.find()
        if (limit) {
            return products.slice(0, limit)
        }
        return products
    }
}
export default ProductServices