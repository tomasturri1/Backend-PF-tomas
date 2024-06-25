import ProductModel from '../models/products.model.js'
import ProductServices from '../services/productServices.js'
import CartServices from '../services/cartServices.js'
import logger from '../utils/logger.js'

const productServices = new ProductServices()
const cartServices = new CartServices()

class ViewsController {
    async renderHome(req, res) {
        if (res.locals.isUserAdmin) {
            return res.redirect('/realtimeproducts')
        }
        try {
            res.render('home', { title: 'Home' })
        } catch (error) {
            logger.error('Error getting the home page:', error)
            res.status(500).json({ error: 'Internal Server Error' })
        }
    }

    async renderAdminPage(req, res) {
        try {
            // Si el usuario no está loggeado se le redirigirá a la pagina de 'Home'
            if (!req.user) {
                return res.redirect('/')
            }
            // Si el usuario es el Administrador tendrá acceso a la pagina 'Real Time Products'
            if (res.locals.isUserAdmin) {
                res.render('realTimeProducts', { title: 'Admin Hub' })
            } else {
                return res.redirect('/')
            }
        } catch (error) {
            logger.error('Error getting the admin page:', error)
            res.status(500).json({ error: 'Internal Server Error' })
        }
    }

    async renderPremiumPannel(req, res) {
        // Si el usuario no está loggeado o es el administrador, se le redirigirá a la pagina de 'Home'
        if (!req.user || res.locals.isUserAdmin) {
            return res.redirect('/')
        }
        res.render('premium', { title: 'Premium Hub' })
    }

    async renderStore(req, res) {
        if (res.locals.isUserAdmin) {
            return res.redirect('/')
        }

        try {
            const page = req.query.page || 1
            const limit = 9
            const productsList = await ProductModel.paginate({ status: true }, { limit, page })

            const productsFinalResult = productsList.docs.map(product => {
                const { id, ...rest } = product.toObject()
                return rest
            })

            res.render('products', {
                title: 'iStore',
                products: productsFinalResult,
                hasPrevPage: productsList.hasPrevPage,
                hasNextPage: productsList.hasNextPage,
                prevPage: productsList.prevPage,
                nextPage: productsList.nextPage,
                currentPage: productsList.page,
                totalPages: productsList.totalPages
            })
        } catch (error) {
            logger.log('Error getting the store page:', error)
            res.status(500).json({ message: 'Internal Server Error' })
        }
    }

    async renderProductDetail(req, res) {
        if (res.locals.isUserAdmin) {
            return res.redirect('/')
        }
        try {
            const productId = req.params.productId
            const product = await productServices.getProductById(productId) // se obtiene el producto por su ID
            const isOwnerAdmin = product.owner === 'admin'
            res.render('productDetail', { title: 'Product Detail', product, isOwnerAdmin })
        } catch (error) {
            logger.error('Error getting the product detail page:', error)
            res.status(500).json({ error: 'Internal Server Error' })
        }
    }

    async renderChat(req, res) {
        try {
            // Si el usuario no está loggeado se le redirigirá a la pagina de 'Login'
            if (!req.user) {
                return res.redirect('/login')
            }
            res.render('chat', { title: 'Community Chat' })
        } catch (error) {
            logger.error('Error getting the community chat page:', error)
            res.status(500).json({ error: 'Internal Server Error' })
        }
    }

    async renderAccount(req, res) {
        // Si el usuario no está loggeado, se deberá loggear
        if (!req.user) {
            return res.redirect('/login')
        }
        res.render('account', { title: 'Your Account' })
    }

    async renderCartGuest(req, res) {
        // Se verifica si el usuario está loggeado
        if (!req.user) {
            // Si el usuario no está autenticado, renderizar la vista del carrito para invitados
            return res.render('guestCart', { title: 'Guest Cart' })
        }
        if (req.user && req.user.role === 'admin') {
            return res.redirect('/')
        } else {
            return res.redirect(`/carts/${req.user.cart}`)
        }
    }

    async renderUserCart(req, res) {
        const cartId = req.params.cid
        try {
            if (!req.user) {
                return res.redirect('/cart/guest')
            }
            if (res.locals.isUserAdmin) {
                return res.redirect('/')
            } else {
                // Se verifica si el carrito existe en el array de carritos
                const cart = await cartServices.getCartById(cartId)
                if (!cart) {
                    console.error(`No cart exist with the ID ${cartId}`)
                    return cart
                }

                let totalPurchase = 0

                const productsInCart = cart.products.map(item => {
                    const product = item.product.toObject()
                    const quantity = item.quantity
                    const totalPrice = product.price * quantity

                    totalPurchase += totalPrice

                    return {
                        product: { ...product, totalPrice },
                        quantity,
                        cartId
                    }
                })

                // Se renderiza la vista de carrito con los productos asociados
                return res.render('cart', { cartId, products: productsInCart, totalPurchase, title: 'Cart' })
            }
        } catch (error) {
            logger.error('Error retrieving cart:', error)
            res.status(500).json({ error: 'Internal Server Error' })
        }
    }

    async renderCheckout(req, res) {
        try {
            if (!req.user) { // Si no hay sesión, se va a redirigir al 'Home'
                return res.redirect('/')
            }
            if (res.locals.isUserAdmin) { // Si el usuario es admin, no podrá acceder
                return res.redirect('/')
            } else {
                const cartId = req.user.cart

                // Se verifica si el carrito existe en el array de carritos
                const cart = await cartServices.getCartById(cartId)
                if (!cart) {
                    console.error(`No cart exist with the ID ${cartId}`)
                    return cart
                }

                let totalPurchase = 0

                const productsInCart = cart.products.map(item => {
                    const product = item.product.toObject()
                    const quantity = item.quantity
                    const totalPrice = product.price * quantity

                    totalPurchase += totalPrice

                    return {
                        product: { ...product, totalPrice },
                        quantity,
                        cartId
                    }
                })

                res.render('checkout', { title: 'Checkout', products: productsInCart, totalPurchase })
            }
        } catch (error) {
            logger.error('Error retrieving checkout:', error)
            res.status(500).json({ error: 'Internal Server Error' })
        }
    }

    async renderRequestPasswordReset(req, res) {
        res.render('requestPasswordReset', { title: 'Recover your account' })
    }

    async renderResetPassword(req, res) {
        res.render('resetPassword', { title: 'Reset your password' })
    }

    async renderLogin(req, res) {
        // Si el usuario ya está loggeado se le redirigirá a la pagina de 'Home'
        if (req.user) {
            return res.redirect('/')
        }
        res.render('login', { title: 'Login' })
    }

    async renderRegister(req, res) {
        // Si el usuario ya está loggeado se le redirigirá a la pagina 'Home'
        if (req.user) {
            return res.redirect('/')
        }
        res.render('register', { title: 'Register' })
    }
}
export default ViewsController