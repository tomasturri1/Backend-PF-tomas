// Variables de entorno
import configObject from '../config/config.js'
const { node_env } = configObject

class LoggerController {
    testingLogger(req, res) {
        req.logger.error("Error message")
        req.logger.warning("Warning message")
        req.logger.info("Info message")
        req.logger.debug("Debug message")
        console.log(`The environment is ${node_env}`)
        res.send("Logs test")
    }
}
export default LoggerController