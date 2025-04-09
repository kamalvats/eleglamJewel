import Mongoose, { Schema } from "mongoose";
import status from '../enums/status';
import mongoosePaginate from "mongoose-paginate";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate";
import userType from "../enums/userType";
const options = {
    collection: "notification",
    timestamps: true
};

const notificationSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'user'
        },
        title: {
            type: String
        },
        description: {
            type: String
        },
        sendDate: {
            type: Date,
        },
        notificationType: {
            type: String
        },
        isRead: {
            type: Boolean,
            default: false
        },
        read: [],
        url: { type: String },
        text: { type: String },
        deleteFor: [],
        status: { type: String, default: status.ACTIVE }
    },
    options
);

notificationSchema.plugin(mongoosePaginate);
notificationSchema.plugin(mongooseAggregatePaginate);
module.exports = Mongoose.model("notification", notificationSchema);


