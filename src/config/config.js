import dotenv from 'dotenv'
import program from '../utils/commander.js'

const { mode } = program.opts()

dotenv.config({
    path: mode === 'production' ? './.env.production' : './.env.development',
})

const configObject = {
    node_env: process.env.NODE_ENV,
    app_port: process.env.APP_PORT,
    app_host: process.env.APP_HOST,
    mongo_url: process.env.MONGO_URL,
    email_user: process.env.EMAIL_USER,
    email_pass: process.env.EMAIL_PASS,
    secret_cookie_token: process.env.SECRET_COOKIE_TOKEN,
    admin_username: process.env.ADMIN_USERNAME,
    admin_email: process.env.ADMIN_EMAIL,
    admin_password: process.env.ADMIN_PASSWORD,
    admin_data: process.env.ADMIN_DATA,
    admin_role: process.env.ADMIN_ROLE,
    google_client_id: process.env.GOOGLE_CLIENT_ID,
    google_client_secret: process.env.GOOGLE_CLIENT_SECRET,
    google_callback_url: process.env.GOOGLE_CALLBACK_URL,
}
export default configObject