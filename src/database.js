import mongoose from 'mongoose'
import configObject from './config/config.js'
import logger from './utils/logger.js'
const { mongo_url } = configObject

class DataBase {
    static #instance

    constructor() {
        mongoose.connect(mongo_url)
    }

    static getInstance() {
        if (this.#instance) {
            logger.info('Database connection already exists.')
            return this.#instance
        }
        this.#instance = new DataBase()
        logger.info('Connection to database successful.')
        return this.#instance
    }
}

const dbInstance = DataBase.getInstance()
export default dbInstance