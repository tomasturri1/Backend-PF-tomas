import mongoose from "mongoose"
import mongoosePaginate from "mongoose-paginate-v2"

// Se crea el schema y el model de productos
const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    code: {
        type: String,
        required: true,
        unique: true
    },
    stock: {
        type: Number,
        required: true
    },
    status: {
        type: Boolean,
        required: true
    },
    thumbnails: {
        type: [String],
    },
    owner: {
        type: String,
        required: true,
        default: 'admin'
    }
}, {
    versionKey: false // Se excluye el campo _v globalmente
})

productSchema.plugin(mongoosePaginate)

const ProductModel = mongoose.model("products", productSchema)
export default ProductModel