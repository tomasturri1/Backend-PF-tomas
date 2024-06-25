import winston from "winston"
import configObject from "../config/config.js" // Variables de entorno
const { node_env } = configObject

// Ejemplo configurando nuestros propios niveles
const levels = {
    level: {
        fatal: 0,
        error: 1,
        warning: 2,
        info: 3,
        http: 4,
        debug: 5
    },
    colors: {
        fatal: "red",
        error: "yellow",
        warning: "magenta",
        info: "green",
        http: "blue",
        debug: "white"
    }
}

// Logger para desarrollo
const loggerDevelopment = winston.createLogger({
    levels: levels.level,
    transports: [
        new winston.transports.Console({
            level: "debug",
            format: winston.format.combine(
                winston.format.colorize({ colors: levels.colors }),
                winston.format.simple()
            )
        })
    ]
})

// Logger para producción
const loggerProduction = winston.createLogger({
    levels: levels.level,
    transports: [
        new winston.transports.File({
            filename: "./errors.log",
            level: "info",
            format: winston.format.simple()
        })
    ]
})

// Se determina qué logger utilizamos según el entorno
const logger = node_env === 'production' ? loggerProduction : loggerDevelopment
export default logger // Se exporta el logger para utilizarlo en un middleware