import MockingUtils from "../utils/mocking.js"
const mockingUtils = new MockingUtils()

class MockingController {
    async generateProducts(req, res) {
        // Se genera un array de productos
        const products = []

        for (let i = 0; i < 100; i++) {
            const productsMock = await mockingUtils.generateProduct()
            products.push(productsMock)
        }
        res.json(products)
    }
}
export default MockingController