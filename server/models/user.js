import Mongoose, { Schema, Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate";
import userType from "../enums/userType";
import status from "../enums/status";
import bcrypt from "bcryptjs";

var userModel = new Schema(
  {
    email: {
      type: String,
    },
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    userName: {
      type: String,
    },
    password: {
      type: String,
    },
    otp: {
      type: String,
    },
    withdrawOtp: {
      type: String,
    },
    emailotp2FA: {
      type: Number,
    },
    otpVerified: {
      type: Boolean,
      default: false,
    },
    userType: {
      type: String,
      enum: [userType.ADMIN, userType.SUBADMIN, userType.USER],
      default: userType.USER,
    },
    status: {
      type: String,
      enum: [status.ACTIVE, status.BLOCK, status.DELETE],
      default: status.ACTIVE,
    },
    address: [
      {
        // _id: { type: Schema.Types.ObjectId, auto: true },
        name:{type:String},
        address:{type:String},
        pinCode:{type:Number},
        city:{type:String},
        phone:{type:Number},
        streetOrArea:{type:String},
        landmark:{type:String},
        houseno:{type:String},
        district:{type:String},
        firstName:{type:String},
        lastName:{type:String},
        state:{type:String},
        postalCode:{type:String},
        phoneNumber:{type:Number},
      },
    ],
    cart: [
      {
        productId: {
          type: Mongoose.Types.ObjectId,
          ref: "product",
        },
        quantity: { type: Number, default: 1 },
      },
    ],
    location: [
      {
        type: {
          type: String,
          default: "Point",
        },
        coordinates: {
          type: [Number],
          default: [0, 0],
        },
      },
    ],
    otpExpireTime: {
      type: Number,
    },
    profilePic: {
      type: String,
    },
    bannerPic: {
      type: String,
    },
    wallet: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
    },
    socialId: {
      type: String,
    },
    socialType: {
      type: String,
    },
    ticketBalance: {
      type: Number,
      default: 0,
    },
    lockedBalance: {
      type: Number,
      default: 0,
    },
    lockedAmount: {
      type: Number,
      default: 0,
    },
    secretGoogle: {
      type: String,
    },
    base64: {
      type: String,
    },
    referralCode: { type: Number },

    referrerId: {
      type: Mongoose.Types.ObjectId,
      ref: "user",
    },
    google2FA: { type: Boolean, default: false },
    email2FA: { type: Boolean, default: false },
    permissions: [],
    changeUserName: { type: Boolean, default: true },
    changeFirstName: { type: Boolean, default: true },
    changeLastName: { type: Boolean, default: true },
    productSound: {
      type: Boolean,
      default: true,
    },

    productMusic: {
      type: Boolean,
      default: true,
    },
  },

  { timestamps: true }
);

userModel.index({ location: "2dsphere" });
userModel.plugin(mongooseAggregatePaginate);
userModel.plugin(mongoosePaginate);
module.exports = Mongoose.model("user", userModel);

(async () => {
  let result = await Mongoose.model("user", userModel).find({
    userType: userType.ADMIN,
  });

  if (result.length != 0 && result.userType != "ADMIN") {
    console.log("Default Admin updated.");
  } else {
    let obj = {
      userType: userType.ADMIN,
      firstName: "admin",
      lastName: "admin",
      userName: "Admin123",
      countryCode: "+91",
      mobileNumber: "123456789",
      email: "support@mailinator.com",
      dateOfBirth: "13/01/2003",
      password: bcrypt.hashSync("Admin@123"),
      address: "Delhi, India",
      wallet: "Eyp3rpdtVbnzbhFWMdHrANrijpBaLVQf7qLB67BDinXv",
      otpVerified: true,
      profilePic:
        "https://res.cloudinary.com/mobiloitte-testing1/image/upload/v1639781336/q1spiih52uq9oh2wsop4.png",
    };
    var defaultResult = await Mongoose.model("user", userModel).create(obj);
  }

  if (defaultResult) {
    console.log("DEFAULT DATA Created.", defaultResult);
  }
}).call();
