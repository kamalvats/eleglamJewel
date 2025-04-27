import Mongoose, {
    Schema
} from "mongoose";
import mongoosePaginate from "mongoose-paginate";
import status from '../enums/status';
var mongooseAggregatePaginate = require("mongoose-aggregate-paginate");
const schema = Mongoose.Schema;
var productSchema = new schema({

    productTitle: {
        type: String
    },
    productDescription: {
        type: String,
    },
    images: {
        type: Array,
    },
    category: {
        type: String,
    },
    productDetails: {
        type: String,
    },
    otherDescription: {
        type: String,
    },
    styleTip: {
        type: String,
    },
    status: {
        type: String,
        default: status.ACTIVE
    },
    price:{
        type:Number,
        default:10
    },
    discountPrice:{
        type:Number,
        default:5
    },
    freeDelivery:{
        type:Boolean,
        default:true
    },
    quantity:{
        type:Number,
        default:1
    },
    stockAvailable:{
        type:Boolean,
        default:true
    },
    // discount:{
    //     type:Boolean,
    //     default:true
    // }
}, {
    timestamps: true
});

productSchema.plugin(mongoosePaginate);
productSchema.plugin(mongooseAggregatePaginate);
module.exports = Mongoose.model("product", productSchema);