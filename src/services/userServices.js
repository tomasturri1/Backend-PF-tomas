import UserModel from '../models/user.model.js'
import CartModel from '../models/carts.model.js'
import EmailServices from './emailServices.js'
import logger from '../utils/logger.js'
const emailServices = new EmailServices()

class UserServices {
    async getAllUsers() {
        try {
            const users = await UserModel.find({}, 'username email role documents')
            logger.info(`Users: ${JSON.stringify(users)}`)
            return users
        } catch (error) {
            logger.error("Error getting the users", error)
        }
    }

    async changeUserRole(userId) {
        try {
            const user = await UserModel.findOne({ id: userId })
            if (!user) {
                logger.error(`No user exist ith the id ${userId}`)
            }

            // Se verifica si el usuario ha cargado los documentos requeridos
            const requiredDocuments = ['Proof of account status.pdf']
            const userDocuments = user.documents.map(doc => doc.name)
            const hasRequiredDocuments = requiredDocuments.every(doc => userDocuments.includes(doc))

            if (!hasRequiredDocuments) {
                logger.error('The user must upload the following documents: Proof of account status.pdf')
            }

            const newRole = user.role === 'user' ? 'premium' : 'user'

            const updatedUser = await UserModel.findByIdAndUpdate(userId, { role: newRole }, { new: true })
            logger.info('User role has changed successfully:', updatedUser)
        } catch (error) {
            logger.error('Error changing user role:', error)
            res.status(500).json({ message: 'Internal server error' })
        }
    }

    async deleteUser(userId) {
        try {
            const user = await UserModel.findById(userId)
            if (!user) {
                return logger.error(`No user exist with the id ${userId}`)
            }

            await emailServices.sendUserDeletionEmail(user.email, user.first_name, user.last_name)
            await CartModel.findByIdAndDelete(user.cart)
            await UserModel.findByIdAndDelete(userId)
            logger.info('User deleted successfully', user)
        } catch (error) {
            logger.error('Error deleting user:', error)
        }
    }

    async deleteInactiveUsers() {
        try {
            // const thresholdDate = new Date(Date.now() - 5 * 60 * 1000) // Últimos 5 minutos (para testear)
            const thresholdDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // Últimos 2 días
            const inactiveUsers = await UserModel.find({ last_connection: { $lt: thresholdDate } })

            // Se verifica si no hay usuarios inactivos para eliminar
            if (inactiveUsers.length === 0) {
                return logger.error('No inactive users found')
            }

            for (const user of inactiveUsers) {
                await emailServices.sendUserInactivityDeletionEmail(user.email, user.first_name, user.last_name)
                await CartModel.findByIdAndDelete(user.cart)
                await UserModel.findByIdAndDelete(user._id)
            }

            logger.info(`${inactiveUsers.length} inactive users deleted`)
        } catch (error) {
            logger.error('Error deleting inactive users:', error)
        }
    }
}
export default UserServices