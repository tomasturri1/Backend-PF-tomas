import mongoose from "mongoose"

// Se crea el schema y el model de usuarios
const userSchema = new mongoose.Schema({
    googleId : {
        type: String,
    },
    username: {
        type: String,
        required: true
    },
    first_name: {
        type: String,
        required: true
    },
    last_name: {
        type: String,
        required: false
    },
    email: {
        type: String,
        required: true,
        index: true,
        unique: true
    },
    password: {
        type: String,
        required: false
    },
    age: {
        type: Number,
        required: false
    },
    role: {
        type: String,
        enum: ['user', 'premium'],
        default: 'user',
        required: true
    },
    cart: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'carts'
    },
    documents: [{
        name: String,
        reference: String,
        status: {
            type: String,
            default: 'Pending'
        }
    }],
    resetToken: {
        token: String,
        expiresAt: Date
    },
    last_connection: {
        type: Date,
        default: Date.now
    }
}, {
    versionKey: false // Se excluye el campo _v globalmente
})

const UserModel = mongoose.model("user", userSchema)
export default UserModel