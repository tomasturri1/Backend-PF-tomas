import nodemailer from 'nodemailer'
import configObject from '../config/config.js'
const { email_user, email_pass } = configObject

class EmailServices {
    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            port: 587,
            auth: {
                user: email_user,
                pass: email_pass
            }
        })
    }

    async sendPurchaseEmail(email, username, ticket, products) {
        try {
            let productList = '' // Se inicializa una cadena para almacenar la lista de productos

            // Se itera sobre los productos y se construye la lista en HTML
            products.forEach(product => {
                productList += `<li>${product.quantity} x ${product.product.title} - $${product.product.price * product.quantity}</li>`
            })

            const mailOptions = {
                from: `iStore App ${email_user}`,
                to: email,
                subject: 'Purchase Confirmation',
                html: `
                <h1>Purchase Confirmation</h1>
                <p>Thank you for your purchase, ${username}!</p>
                <p>Your Order Id is: ${ticket._id}</p>
                <h2>Products Purchased:</h2>
                <ul>
                    ${productList}
                </ul>
                <p>Total: $${ticket.amount}</p>
            `
            }

            await this.transporter.sendMail(mailOptions)
        } catch (error) {
            console.error('Error sending email:', error)
        }
    }

    async sendPasswordResetEmail(email, first_name, last_name, token) {
        try {
            const mailOptions = {
                from: `iStore App ${email_user}`,
                to: email,
                subject: 'Verify your email adress.',
                html: `
                    <h1>Verify your email adress.</h1>
                    <p>Dear ${first_name} ${last_name},</p>
                    <p>A request to reset your password or unlock your account was made for your iStore Account, ${email}. To continue with this request, enter the code below on the verification page:</p>
                    <p><strong>${token}</strong></p>
                    <p>This code will expire in 1 hour.</p>
                    <a href="http://localhost:8080/resetpassword">Reset Password</a>
                    <p>If you didn't make this change please ignore this email or if you believe an unauthorized person has accessed your account, go to http://localhost:8080/account to verify your account information is accurate and up-to-date.</p>
                    <p>iStore Support</p>
                `
            }

            await this.transporter.sendMail(mailOptions)
        } catch (error) {
            console.error('Error sending email:', error)
            throw new Error('Error sending email')
        }
    }

    async sendUserDeletionEmail(email, first_name, last_name) {
        try {
            const mailOptions = {
                from: `iStore App ${email_user}`,
                to: email,
                subject: 'Account Deletion',
                html: `
                <h1>Dear ${first_name} ${last_name},</h1>
                <p>Your account has been deleted due to non-compliance with our policies.</p>
                <p>If you have any questions or need further assistance, please feel free to contact our support team.</p>
                <p>Thank you for your understanding.</p>
                <p>Sincerely,</p>
                <p>The iStore Team.</p>
                `
            }
            await this.transporter.sendMail(mailOptions)
        } catch (error) {
            console.error('Error sending email:', error)
            throw new Error('Error sending email')
        }
    }

    async sendUserInactivityDeletionEmail(email, first_name, last_name) {
        try {
            const mailOptions = {
                from: `iStore App ${email_user}`,
                to: email,
                subject: 'Account Deletion - Inactivity',
                html: `
                <h1>Dear ${first_name} ${last_name},</h1>
                <p>Your account has been deleted due to inactivity.</p>
                <p>If you have any questions or need further assistance, please feel free to contact our support team.</p>
                <p>Thank you for your understanding.</p>
                <p>Sincerely,</p>
                <p>The iStore Team.</p>
                `
            }
            await this.transporter.sendMail(mailOptions)
        } catch (error) {
            console.error('Error sending email:', error)
            throw new Error('Error sending email')
        }
    }

    async sendProductUserDeletionEmail(email, first_name, last_name, product_name) {
        try {
            const mailOptions = {
                from: `iStore App ${email_user}`,
                to: email,
                subject: 'Product Deletion',
                html: `
                <h1>Dear ${first_name} ${last_name},</h1>
                <p>We regret to inform you that your product <strong>${product_name}</strong> has been removed from our site due to non-compliance with our policies.</p>
                <p>If you have any questions or need further assistance, please feel free to contact our support team.</p>
                <p>Thank you for your understanding.</p>
                <p>Sincerely,</p>
                <p>The iStore Team.</p>
                `
            }
            await this.transporter.sendMail(mailOptions)
        } catch (error) {
            console.error('Error sending email:', error)
            throw new Error('Error sending email')
        }
    }
}
export default EmailServices