import swaggerJsDoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'

const swaggerOptions = {
    definition: {
        openapi: '3.0.1',
        info: {
            title: 'iStore App Documentation',
            description: 'Website project that simulates being the official Apple page'
        }
    },
    apis: ['./src/docs/**/*.yaml']
}

const specs = swaggerJsDoc(swaggerOptions)
export { swaggerUi, specs }