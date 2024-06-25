import supertest from 'supertest'
import * as chai from 'chai'
import UserModel from '../src/models/user.model.js'
import ProductModel from '../src/models/products.model.js'
import CartModel from '../src/models/carts.model.js'
import dbInstance from '../src/database.js'
const requester = supertest('http://localhost:8080')
const { expect } = chai

describe('iStore App testing', () => {
    describe('products testing', () => {
        let product // Se instancia una variable global para el testing

        // Se instancia la BDO antes de empezar con el testing
        before(async () => {
            const db = await dbInstance
            return db
        })

        // Se limpian de la BDO los productos de testing
        after(async () => {
            try {
                await ProductModel.findByIdAndDelete(product._id)
            } catch (err) {
                throw new Error(err)
            }
        })

        // Testing para obtener todos los productos
        it('GET /api/products - should get all products', async () => {
            const res = await requester.get('/api/products')
            expect(res.status).to.equal(200)
            expect(res.body).to.have.property('status', 'success')
            expect(res.body.payload).to.be.an('array')
        })

        // Testing para obtener un producto por ID
        it('GET /api/products/:pid - should get a product by ID', async () => {
            const productId = '665610b103bbffe081d90c72' // Ajusta este ID según tu base de datos
            const res = await requester.get(`/api/products/${productId}`)
            expect(res.status).to.equal(200)
            expect(res.body).to.have.property('message', 'Product found:', res)
            expect(res.body.product).to.be.an('object')
        })

        // Testing para obtener un producto por ID (producto no encontrado)
        it('GET /api/products/:pid - should return 404 for non-existent product ID', async () => {
            const nonExistentProductId = 'nonExistentProductId'
            const res = await requester.get(`/api/products/${nonExistentProductId}`)
            expect(res.status).to.equal(404)
            expect(res.body).to.have.property('message', `A product with the id ${nonExistentProductId} was not found`)
        })

        // Testing para añadir un producto
        it('POST /api/products - should add a new product', async () => {
            const newProduct = {
                title: 'New Product',
                description: 'This is a new product',
                category: 'Electronics',
                price: 99.99,
                code: 'NP123',
                stock: 50,
                status: true
            }

            const res = await requester.post('/api/products').send(newProduct)
            expect(res.status).to.equal(200)
            expect(res.body).to.have.property('message', 'Product added successfully:', res)
            expect(res.body).to.be.an('object')

            product = await ProductModel.findOne({ code: newProduct.code })
        })

        // Testing para añadir un producto (faltan campos obligatorios)
        it('POST /api/products - should return 400 for missing required fields', async () => {
            const newProduct = {
                // Falta el campo 'title'
                description: 'This is a new product',
                category: 'Electronics',
                price: 99.99,
                code: 'NP123',
                stock: 50,
                status: true
            }

            const res = await requester.post('/api/products').send(newProduct)
            expect(res.status).to.equal(400)
            expect(res.body).to.have.property('message', 'All fields are mandatory.')
        })

        // Testing para añadir un producto (producto ya existe)
        it('POST /api/products - should return 400 for duplicate product code', async () => {
            const existingProduct = {
                title: 'Existing Product',
                description: 'This is an existing product',
                category: 'Electronics',
                price: 99.99,
                code: 'NP123', // Código ya existente
                stock: 50,
                status: true
            }

            const res = await requester.post('/api/products').send(existingProduct)
            expect(res.status).to.equal(400)
            expect(res.body).to.have.property('message', 'A product with that code already exists.')
        })
    })
    describe('carts testing', () => {
        let cart // Se instancia una variable global para el testing

        // Se instancia la BDO antes de empezar con el testing
        before(async () => {
            const db = await dbInstance
            return db
        })

        // Se limpian de la BDO los usuarios de testing y sus carritos
        after(async () => {
            try {
                await CartModel.deleteOne({ _id: cart._id })
            } catch (err) {
                throw new Error(err)
            }
        })

        // Testing para crear un nuevo carrito
        it('POST /api/carts - should create a new cart', async () => {
            const res = await requester.post('/api/carts')
            expect(res.status).to.equal(200)
            expect(res.body).to.have.property('newCart')
            expect(res.body.newCart).to.be.an('object')
            cart = res.body.newCart
        })

        // Testing para obtener un carrito por ID
        it('GET /api/carts/:cid - should get a cart by ID', async () => {
            const cartId = '666ca649a0f27b91323427ef' // Ajusta este ID según tu base de datos
            const res = await requester.get(`/api/carts/${cartId}`)
            expect(res.status).to.equal(200)
            expect(res.body).to.be.an('array')
        })

        // Testing para obtener un carrito por ID (carrito no encontrado)
        it('GET /api/carts/:cid - should return 404 for non-existent cart ID', async () => {
            const nonExistentCartId = 'nonExistentCartId'
            const res = await requester.get(`/api/carts/${nonExistentCartId}`)
            expect(res.status).to.equal(404)
            expect(res.body).to.have.property('error', `No cart exists with the id ${nonExistentCartId}`)
        })

        // Testing para agregar un producto a un carrito
        it('POST /api/carts/:cid/product/:pid - should add a product to a cart', async () => {
            const cartId = '666ca649a0f27b91323427ef' // Ajusta este ID según tu base de datos
            const productId = '665610b103bbffe081d90c72' // Ajusta este ID según tu base de datos
            const res = await requester.post(`/api/carts/${cartId}/product/${productId}`).send({ quantity: 2 })
            expect(res.status).to.equal(200)
        })

        // Testing para agregar un producto a un carrito (carrito no encontrado)
        it('POST /api/carts/:cid/product/:pid - should return 404 for non-existent cart ID', async () => {
            const nonExistentCartId = 'nonExistentCartId'
            const productId = '665610b103bbffe081d90c72'
            const res = await requester.post(`/api/carts/${nonExistentCartId}/product/${productId}`).send({ quantity: 2 })
            expect(res.status).to.equal(404)
            expect(res.body).to.have.property('error', `No cart exists with the id ${nonExistentCartId}`)
        })

        // Testing para agregar un producto a un carrito (producto no encontrado)
        it('POST /api/carts/:cid/product/:pid - should return 404 for non-existent product ID', async () => {
            const cartId = '666ca649a0f27b91323427ef'
            const nonExistentProductId = 'nonExistentProductId'
            const res = await requester.post(`/api/carts/${cartId}/product/${nonExistentProductId}`).send({ quantity: 2 })
            expect(res.status).to.equal(404)
            expect(res.body).to.have.property('error', `A product with the id ${nonExistentProductId} was not found.`)
        })

        // Testing para vaciar un carrito
        it('DELETE /api/carts/:cid - should clear a cart', async () => {
            const cartId = '666ca649a0f27b91323427ef' // Ajusta este ID según tu base de datos
            const res = await requester.delete(`/api/carts/${cartId}`)
            expect(res.status).to.equal(200)
            expect(res.body).to.have.property('message', 'All products have deleted from cart successfully.')
        })

        // Testing para vaciar un carrito (carrito no encontrado)
        it('DELETE /api/carts/:cid - should return 404 for non-existent cart ID', async () => {
            const nonExistentCartId = 'nonExistentCartId'
            const res = await requester.delete(`/api/carts/${nonExistentCartId}`)
            expect(res.status).to.equal(404)
            expect(res.body).to.have.property('error', `No cart exists with the id ${nonExistentCartId}`)
        })

        // Testing para eliminar un producto de un carrito
        it('DELETE /api/carts/:cid/product/:pid - should delete a product from a cart', async () => {
            const cartId = '666ca649a0f27b91323427ef' // Ajustar este ID según la base de datos
            const productId = '665610b103bbffe081d90c72' // Ajustar este ID según la base de datos
            const res = await requester.delete(`/api/carts/${cartId}/product/${productId}`)
            expect(res.status).to.equal(200)
            expect(res.body).to.have.property('message', `Product with id ${productId} was removed from cart with id ${cartId}`)
        })

        // Testing para eliminar un producto de un carrito (carrito no encontrado)
        it('DELETE /api/carts/:cid/product/:pid - should return 404 for non-existent cart ID', async () => {
            const nonExistentCartId = 'nonExistentCartId'
            const productId = '665610b103bbffe081d90c72' // Ajustar este ID según la base de datos
            const res = await requester.delete(`/api/carts/${nonExistentCartId}/product/${productId}`)
            expect(res.status).to.equal(404)
            expect(res.body).to.have.property('error', `Cart with id ${nonExistentCartId} not found`)
        })

        // Testing para eliminar un producto de un carrito (producto no encontrado)
        it('DELETE /api/carts/:cid/product/:pid - should return 404 for non-existent product ID', async () => {
            const cartId = '666ca649a0f27b91323427ef' // Ajustar este ID según la base de datos
            const nonExistentProductId = 'nonExistentProductId'
            const res = await requester.delete(`/api/carts/${cartId}/product/${nonExistentProductId}`)
            expect(res.status).to.equal(404)
            expect(res.body).to.have.property('error', `A product with the id ${nonExistentProductId} was not found.`)
        })
    })
    describe('users testing', () => {
        // Se crean variables globales en el testing
        let user
        let cookie

        // Se instancia la BDO antes de empezar con el testing
        before(async () => {
            const db = await dbInstance
            return db
        })

        // Se limpian de la BDO los usuarios de testing
        after(async () => {
            try {
                await CartModel.findByIdAndDelete(user.cart)
                await UserModel.findByIdAndDelete(user._id)
            } catch (err) {
                throw new Error(err)
            }
        })

        // Testing para crear un usuario
        it('POST /api/users/register - should register a new user', async () => {
            const newUser = {
                username: 'testuser',
                first_name: 'Test',
                last_name: 'User',
                email: 'testuser@example.com',
                password: 'password123',
                age: 22,
                role: 'user'
            }

            const res = await requester.post('/api/users/register').send(newUser)
            expect(res.status).to.equal(200)
            user = await UserModel.findOne({ username: newUser.username })
        })

        // Testing para iniciar sesión con un usuario
        it('POST /api/users/login - should log in a user', async () => {
            const loginUser = {
                email: 'testuser@example.com',
                password: 'password123'
            }

            const res = await requester.post('/api/users/login').send(loginUser)
            // Se obtiene la cookie de la sesion y se guarda en una variable
            const cookieResultado = res.headers['set-cookie']['0']

            // Se Verifica que la cookie recuperada exista
            expect(cookieResultado).to.be.ok

            // Se separa clave y valor y se almacena en la variable global
            cookie = {
                name: cookieResultado.split('=')[0],
                value: cookieResultado.split('=')[1].split(';')[0]
            }
            // Se verifica que el nombre de la cookie que se obtuvo sea igual a la de la app
            expect(cookie.name).to.be.ok.and.equal('cookieAppStore')
            expect(cookie.value).to.be.ok
            expect(res.status).to.equal(302) // Código de estado para redirección
            expect(res.headers.location).to.equal('/products') // Verifica la redirección
        })
    })
})