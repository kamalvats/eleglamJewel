import Mongoose, { Schema, Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate";
import ticketStatus from "../enums/requestStatus";

var transactionModel = new Schema(
  {
    userId: {
      type: Mongoose.Types.ObjectId,
      ref: "user",
    },
    orderId: {
      type: String,
    },
    receipt: {
      type: String,
    },
    amount: {
      type: Number,
    },
    totalDiscount: {
      type: Number,
    },
    products: [
      {
        productId: {
          type: Mongoose.Types.ObjectId,
          ref: "product",
        },
        quantity: { type: Number },
        price: { type: Number },
        discountPrice: { type: Number },
        // status:{type:String,default:}
      },
    ],
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "CANCELLED"],
      default: ticketStatus.PENDING,
    },
    paymentStatus: { type: String, default: "PENDING" },
    paymentType: { type: String, enum: ["COD", "Pre-Paid"] },
    orderCreated: { type: Boolean, default: false },
    address: { type: Object },
    deliveryStatus: { type: String, default: "Ordered" },
    wayBill: { type: String },
    deliveredDate: {
      type: Date,
    },
    isReturned: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

transactionModel.plugin(mongooseAggregatePaginate);
transactionModel.plugin(mongoosePaginate);
module.exports = Mongoose.model("transaction", transactionModel);
