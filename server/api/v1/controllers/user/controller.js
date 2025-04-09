import Joi from "joi";
import _ from "lodash";
import apiError from "../../../../helper/apiError";
import response from "../../../../../assets/response";
import bcrypt from "bcryptjs";
import responseMessage from "../../../../../assets/responseMessage";
import commonFunction from "../../../../helper/util";
import status from "../../../../enums/status";
import userType from "../../../../enums/userType";
import {
  notificationServices
} from "../../services/notification";
const {
  createNotification,
} = notificationServices;
import {
  productServices
} from "../../services/product";
import {
  transactionServices
} from "../../services/transaction";
const {
  graphTransactionAggrigate,
  transactionCount,
  findTransactions
} = transactionServices;

import {
  contactUsServices
} from "../../services/contactUs";
const {
  createContactUs,
  getAllContactUs,
  viewContactUs
} =
contactUsServices;
import {
  userServices
} from "../../services/user";
const {
  userCheck,
  checkUserExists,
  emailExist,
  createUser,
  userCount,
  findUser,
  findUserData,
  userFindList,
  updateUser,
  updateUserById,
  paginateSearch,
} = userServices;
import config from "config"
import axios from "axios";
export class userController {
  /**
   * @swagger
   * /user/signup:
   *   post:
   *     tags:
   *       - USER
   *     description: signup
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: signup
   *         description: signup
   *         in: body
   *         required: true
   *         schema:
   *           $ref: '#/definitions/signup'
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async signup(req, res, next) {
    const validationSchema = {
      email: Joi.string().required(),
    };
    try {

     
      if (req.body.email) {
        req.body.email = req.body.email.toLowerCase();
      }
      const validatedBody = await Joi.validate(req.body, validationSchema);
      const {
        email,
      } = validatedBody;

      var userInfo = await checkUserExists(email);
      if (userInfo) {
       
          
            if (userInfo.status === status.BLOCK) {
              throw apiError.conflict(
                responseMessage.BLOCK_USER_EMAIL_BY_ADMIN
              );
            }
      }

      validatedBody.otp = await commonFunction.getOTP();
      validatedBody.otpExpireTime = new Date().getTime() + 300000;
      validatedBody.userType = userType.USER;
      if (email) {
        await commonFunction.sendEmailOtp(validatedBody.email, validatedBody.otp, validatedBody.firstName);
      }

      if (userInfo) {
        var result = await updateUser({
            _id: userInfo._id,
          },
          validatedBody
        );
        return res.json(new response(result, responseMessage.USER_CREATED));
      } else {

        var result = await createUser(validatedBody);
      }

      result = _.omit(JSON.parse(JSON.stringify(result)), ["otp", "password", "base64", "secretGoogle", "emailotp2FA", "withdrawOtp", "password"])


      return res.json(new response(result, responseMessage.USER_CREATED));
    } catch (error) {
      console.log(error);
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/verifyOTPSignUp:
   *   patch:
   *     tags:
   *       - USER
   *     description: verifyOTPSignUp
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: verifyOTP
   *         description: verifyOTP
   *         in: body
   *         required: true
   *         schema:
   *           $ref: '#/definitions/verifyOTP'
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async verifyOTPSignUp(req, res, next) {
    var validationSchema = {
      email: Joi.string().required(),
      otp: Joi.string().required(),
    };
    try {
      var validatedBody = await Joi.validate(req.body, validationSchema);
      const {
        email,
        otp,
      } = validatedBody;
      var userResult = await findUserData({
        $and: [{
            status: {
              $ne: status.DELETE,
            },
          },
          {
            email: email,
          },
        ],
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }

      if (new Date().getTime() > userResult.otpExpireTime) {
        throw apiError.badRequest(responseMessage.OTP_EXPIRED);
      }
      if (userResult.otp != otp) {
        throw apiError.badRequest(responseMessage.INCORRECT_OTP);
      }
      if (userResult.otpVerified === false) {
        await commonFunction.sendEmailForWelcome(userResult.email, userResult.firstName);

      }
      var updateResult = await updateUser({
        _id: userResult._id,
      }, {
        otpVerified: true,
      });

      var token = await commonFunction.getToken({
        _id: updateResult._id,
        email: updateResult.email,
        mobileNumber: updateResult.mobileNumber,
        userType: updateResult.userType,
      });
      var obj = {
        _id: updateResult._id,
        name: updateResult.name,
        email: updateResult.email,
        countryCode: updateResult.countryCode,
        mobileNumber: updateResult.mobileNumber,
        otpVerified: true,
        token: token,
      };
      return res.json(new response(obj, responseMessage.OTP_VERIFY));
    } catch (error) {
      console.log(error);
      return next(error);
    }
  }
  /**
   * @swagger
   * /user/verifyOTP:
   *   patch:
   *     tags:
   *       - USER
   *     description: verifyOTP
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: verifyOTP
   *         description: verifyOTP
   *         in: body
   *         required: true
   *         schema:
   *           $ref: '#/definitions/verifyOTP'
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async verifyOTP(req, res, next) {
    var validationSchema = {
      email: Joi.string().required(),
      otp: Joi.string().required(),
    };
    try {
      var validatedBody = await Joi.validate(req.body, validationSchema);
      const {
        email,
        otp,
      } = validatedBody;


      var userResult = await findUserData({
        $and: [{
            status: {
              $ne: status.DELETE,
            },
          },
          {
            email: email,
          },
        ],
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }

      if (new Date().getTime() > userResult.otpExpireTime) {
        throw apiError.badRequest(responseMessage.OTP_EXPIRED);
      }
      if (userResult.otp != otp) {
        throw apiError.badRequest(responseMessage.INCORRECT_OTP);
      }
      var updateResult = await updateUser({
        _id: userResult._id,
      }, {
        otpVerified: true,
      });


      var token = await commonFunction.getToken({
        _id: updateResult._id,
        email: updateResult.email,
        mobileNumber: updateResult.mobileNumber,
        userType: updateResult.userType,
      });
      var obj = {
        _id: updateResult._id,
        name: updateResult.name,
        email: updateResult.email,
        countryCode: updateResult.countryCode,
        mobileNumber: updateResult.mobileNumber,
        otpVerified: true,
        token: token,
      };
      return res.json(new response(obj, responseMessage.OTP_VERIFY));
    } catch (error) {
      console.log(error);
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/login:
   *   post:
   *     tags:
   *       - USER
   *     description: login with email and password
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: email
   *         description: eamil
   *         in: formData
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */

  async login(req, res, next) {
    var validationSchema = {
      email: Joi.string().required(),
    };
    try {
      
      var results;

      var validatedBody = await Joi.validate(req.body, validationSchema);
      const {
        email,
      } = validatedBody;
      let userResult = await findUser({
        email: email,
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
     
      if (userResult.status == status.BLOCK) {
        throw apiError.badRequest(responseMessage.BLOCK_BY_ADMIN);
      }
       if (userResult.status == status.DELETE) {
        throw apiError.badRequest(responseMessage.DELETE_BY_ADMIN);
      }
      var obj = {}
        obj.otp = await commonFunction.getOTP(),
          obj.otpExpireTime = new Date().getTime() + 300000
        var result = await updateUser({
            _id: userResult._id,
          },
          obj
        )
        await commonFunction.sendEmailOtp(result.email, obj.otp, result.firstName);
        return res.json(new response("false", responseMessage.USER_CREATED));


     } catch (error) {
      console.log(error);
      return next(error);
    }
  }


  /**
   * @swagger
   * /user/forgotPassword:
   *   post:
   *     tags:
   *       - USER
   *     description: forgotPassword by USER on plateform when he forgot password
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: forgotPassword
   *         description: forgotPassword
   *         in: body
   *         required: true
   *         schema:
   *           $ref: '#/definitions/forgotPassword'
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async forgotPassword(req, res, next) {
    var validationSchema = {
      email: Joi.string().required(),
    };
    try {
      if (req.body.email) {
        req.body.email = req.body.email.toLowerCase();
      }
      var validatedBody = await Joi.validate(req.body, validationSchema);
      const {
        email
      } = validatedBody;
      var userResult = await findUser({
        $and: [{
            status: {
              $ne: status.DELETE,
            },
          },
          {
            email: email,
          },
        ],
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      } else {
        var otp = await commonFunction.getOTP();
        var newOtp = otp;
        var time = Date.now() + 180000;
        await commonFunction.sendEmailForgotPassOtp(userResult.email, otp, userResult.firstName);
        var updateResult = await updateUser({
          _id: userResult._id,
        }, {
          $set: {
            otp: newOtp,
            otpExpireTime: time,
          },
        });
        updateResult = _.omit(JSON.parse(JSON.stringify(updateResult)), ["otp", "password", "base64", "secretGoogle", "emailotp2FA", "withdrawOtp", "password"])

        return res.json(new response(updateResult, responseMessage.OTP_SEND));
      }
    } catch (error) {
      console.log(error);
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/changePassword:
   *   patch:
   *     tags:
   *       - USER
   *     description: changePassword
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: changePassword
   *         description: changePassword
   *         in: body
   *         required: true
   *         schema:
   *           $ref: '#/definitions/changePassword'
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async changePassword(req, res, next) {
    const validationSchema = {
      oldPassword: Joi.string().required(),
      newPassword: Joi.string().required(),
    };
    try {
      let validatedBody = await Joi.validate(req.body, validationSchema);
      let userResult = await findUser({
        _id: req.userId,
        status: {
          $ne: status.DELETE,
        },
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      if (!bcrypt.compareSync(validatedBody.oldPassword, userResult.password)) {
        throw apiError.badRequest(responseMessage.PWD_NOT_MATCH);
      }
      let updated = await updateUserById(userResult._id, {
        password: bcrypt.hashSync(validatedBody.newPassword),
      });
      updated = _.omit(JSON.parse(JSON.stringify(updated)), ["otp", "password", "base64", "secretGoogle", "emailotp2FA", "withdrawOtp", "password"])
      await commonFunction.sendEmailForPasswordChangeSuccess(userResult.email, userResult.firstName)
      return res.json(new response(updated, responseMessage.PWD_CHANGED));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/resetPassword:
   *   post:
   *     tags:
   *       - USER
   *     description: resetPassword
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: resetPassword
   *         description: resetPassword
   *         in: body
   *         required: true
   *         schema:
   *           $ref: '#/definitions/resetPassword'
   *     responses:
   *       200:
   *         description: Your password has been successfully changed.
   *       404:
   *         description: This user does not exist.
   *       422:
   *         description: Password not matched.
   *       500:
   *         description: Internal Server Error
   *       501:
   *         description: Something went wrong!
   */
  async resetPassword(req, res, next) {
    const validationSchema = {
      email: Joi.string().required(),
      password: Joi.string().required(),
      confirmPassword: Joi.string().required(),
    };
    try {
      const {
        password,
        confirmPassword
      } = await Joi.validate(
        req.body,
        validationSchema
      );

      var userResult = await findUser({
        email: req.body.email,
        status: {
          $ne: status.DELETE,
        },
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      } else {
        if (password == confirmPassword) {
          let update = await updateUser({
            _id: userResult._id,
          }, {
            password: bcrypt.hashSync(password),
          });
          console.log("fdf",update.password)
          update = _.omit(JSON.parse(JSON.stringify(update)), ["otp", "password", "base64", "secretGoogle", "emailotp2FA", "withdrawOtp", "password"])
          await commonFunction.sendEmailForPasswordResetSuccess(userResult.email, userResult.firstName);

          return res.json(new response(update, responseMessage.PWD_CHANGED));
        } else {
          throw apiError.notFound(responseMessage.PWD_NOT_MATCH);
        }
      }
    } catch (error) {
      console.log(error);
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/resendOtp:
   *   post:
   *     tags:
   *       - USER
   *     description: resend otp by user on plateform when he resend otp
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: resendOtp
   *         description: resendOtp
   *         in: body
   *         required: true
   *         schema:
   *           $ref: '#/definitions/resendOtp'
   *     responses:
   *       200:
   *         description: OTP send successfully.
   *       404:
   *         description: This user does not exist.
   *       500:
   *         description: Internal Server Error
   *       501:
   *         description: Something went wrong!
   */
  async resendOtp(req, res, next) {
    var validationSchema = {
      email: Joi.string().required(),
    };
    try {
      if (req.body.email) {
        req.body.email = req.body.email.toLowerCase();
      }
      var validatedBody = await Joi.validate(req.body, validationSchema);
      const {
        email
      } = validatedBody;
      var userResult = await findUser({
        $and: [{
            status: {
              $ne: status.DELETE,
            },
          },
          {
            $or: [{
                mobileNumber: email,
              },
              {
                email: email,
              },
            ],
          },
        ],
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      } else {
        var otp = await commonFunction.getOTP();
        var newOtp = otp;
        var time = Date.now() + 180000;
        await commonFunction.sendEmailOtp(userResult.email, otp, userResult.firstName);
        var updateResult = await updateUser({
          _id: userResult._id,
        }, {
          $set: {
            otp: newOtp,
            otpExpireTime: time,
          },
        });
        updateResult = _.omit(JSON.parse(JSON.stringify(updateResult)), ["otp", "password", "base64", "secretGoogle", "emailotp2FA", "withdrawOtp", "password"])

        return res.json(new response(updateResult, responseMessage.OTP_SEND));
      }
    } catch (error) {
      console.log(error);
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/uploadFile:
   *   post:
   *     tags:
   *       - UPLOAD-FILE
   *     description: uploadFile
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: uploaded_file
   *         description: uploaded_file
   *         in: formData
   *         type: file
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async uploadFile(req, res, next) {
    try {
      const {
        files
      } = req;
console.log("fffffffff",files)
      if (files.length == 0) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }
      const imageFiles = await commonFunction.getImageUrl(files);

      if (imageFiles) {
        let obj = {
          secure_url: imageFiles,
          original_filename: files[0].filename,
        };
        return res.json(new response(obj, responseMessage.UPLOAD_SUCCESS));
      }
    } catch (error) {
      console.log(error);
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/getProfile:
   *   get:
   *     tags:
   *       - USER
   *     description: get his own profile details with getProfile API
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async getProfile(req, res, next) {
    try {
      let adminResult = await findUser({
        userType: userType.ADMIN,
        status: {
          $ne: status.DELETE,
        },
      });
      if (!adminResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      let userResult = await findUser({
        _id: req.userId,
        status: {
          $ne: status.DELETE,
        },
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
     
      userResult = _.omit(JSON.parse(JSON.stringify(userResult)), ["otp", "password", "base64", "secretGoogle", "emailotp2FA", "withdrawOtp", "password"])
      let totalAmount = userResult.cart.reduce((a,c)=>a+(c.productId.price*c.quantity),0)
      let totalDiscount =  userResult.cart.reduce((a,c)=>a+(c.productId.discountPrice*c.quantity),0)
      userResult.totalAmount =totalAmount
      userResult.totalDiscount =totalDiscount
      return res.json(new response(userResult, responseMessage.USER_DETAILS));
    } catch (error) {
      return next(error);
    }
  }



  /**
   * @swagger
   * /user/editProfile:
   *   put:
   *     tags:
   *       - USER
   *     description: editProfile
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: profilePic
   *         description: profilePic
   *         in: formData
   *         required: false
   *       - name: bannerPic
   *         description: bannerPic
   *         in: formData
   *         required: false
   *       - name: email
   *         description: email
   *         in: formData
   *         required: false
   *       - name: wallet
   *         description: wallet
   *         in: formData
   *         required: false
   *       - name: firstName
   *         description: firstName
   *         in: formData
   *         required: false
   *       - name: lastName
   *         description: lastName
   *         in: formData
   *         required: false
   *       - name: userName
   *         description: userName
   *         in: formData
   *         required: false
   *       - name: bio
   *         description: bio
   *         in: formData
   *         required: false
   *       - name: location
   *         description: location
   *         in: formData
   *         required: false
   *       - name: cart
   *         description: location
   *         in: formData
   *         required: false
   *       - name: address
   *         description: address
   *         in: formData
   *         required: false
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async editProfile(req, res, next) {
    const validationSchema = {
      email: Joi.string().optional(),
      firstName: Joi.string().optional(),
      wallet: Joi.string().allow("").optional(),
      lastName: Joi.string().optional(),
      userName: Joi.string().optional(),
      bio: Joi.string().allow("").optional(),
      profilePic: Joi.string().allow("").optional(),
      bannerPic: Joi.string().allow("").optional(),
      location:Joi.array().optional(),
      address:Joi.array().optional(),
      cart:Joi.array().optional(),
    };
    try {
      if (req.body.email) {
        req.body.email = req.body.email.toLowerCase();
      }
      const validatedBody = await Joi.validate(req.body, validationSchema);

      let userResult = await findUser({
        _id: req.userId,
        status: {
          $ne: status.DELETE,
        },
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      let userExist = await emailExist(validatedBody.email, userResult._id);
      if (userExist) {
        throw apiError.conflict(responseMessage.EMAIL_EXIST);
      }

      if (validatedBody.profilePic && validatedBody.profilePic != "") {
        validatedBody.profilePic = await commonFunction.getSecureUrl(
          validatedBody.profilePic
        );
      }

      var result = await updateUser({
          _id: userResult._id,
        },
        validatedBody
      );
      result = _.omit(JSON.parse(JSON.stringify(result)), ["otp", "password", "base64", "secretGoogle", "emailotp2FA", "withdrawOtp", "password"])

      return res.json(new response(result, responseMessage.USER_UPDATED));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/socialLogin:
   *   post:
   *     tags:
   *       - SOCIAL LOGIN
   *     description: socialLogin
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: socialId
   *         description: socialId
   *         in: query
   *         required: true
   *       - name: socialType
   *         description: socialType
   *         in: query
   *         required: true
   *       - name: firstName
   *         description: firstName
   *         in: query
   *         required: true
   *       - name: lastName
   *         description: lastName
   *         in: query
   *         required: false
   *       - name: profilePic
   *         description: profilePic
   *         in: query
   *         type: file
   *         required: false
   *       - name: email
   *         description: email
   *         in: query
   *         required: true
   *     responses:
   *       200:
   *         description: Login successfully.
   *       402:
   *         description: Incorrect login credential provided.
   *       404:
   *         description: User not found.
   */
  async socialLogin(req, res, next) {
    const validationSchema = {
      socialId: Joi.string().required(),
      socialType: Joi.string().required(),
      firstName: Joi.string().required(),
      email: Joi.string().optional(),
      lastName: Joi.string().optional(),
      profilePic: Joi.string().optional(),
    };
    try {
      if (req.body.email) {
        req.body.email = (req.body.email).toLowerCase();
      }
      const validatedBody = await Joi.validate(req.query, validationSchema);
      const {
        socialId,
        socialType,
        firstName,
        email,
        lastName,
        profilePic
      } = validatedBody;
      const {
        files
      } = req;
      if (files) {
        if (files.length != 0) {
          profilePic = await commonFunction.getImageUrl(files);
        }
      }
     
      let approved = await findBlockedUserName({
        "email.email": email
      })

      if (!approved) {
        throw apiError.notFound(responseMessage.ADMIN_EMAIL_NOT_APPROVED);
      }
      var userInfo = await findUser({
        email: email,
        status: {
          $ne: status.DELETE
        }
       
      });

    
      if (!userInfo) {
        let unique = async (userName) => {
          let user = await findUser({
            userName: userName
          });
          let blockedUsernames = await findBlockedUserName({
            "userName.userName":userName
          }); 
        
          if (user || blockedUsernames) {
            userName = userName + "1";
        
            return await unique(userName);
          } else {
        
            return userName;
          }
        };

        let code = Math.floor(1000 + Math.random() * 900) + "" + (await userCount());
        let userName = validatedBody.firstName.slice(0, 3) + validatedBody.email.slice(0, 3) +code
        userName = await unique(userName.toLowerCase())
        var data = {
          socialId: socialId,
          socialType: socialType,
          firstName: firstName,
          lastName: lastName,
          email: email,
          isSocial: true,
          otpVerified: true,
          profilePic: profilePic,
          referralCode: code,
          userName:userName
        };
        let result = await createUser(data)
        let token = await commonFunction.getToken({
          _id: result._id,
          email: result.email,
          userType: result.userType
        });
        result = _.omit(JSON.parse(JSON.stringify(result)), ["otp", "password", "base64", "secretGoogle", "emailotp2FA", "withdrawOtp", "password"])

        return res.json(new response({
          result,
          token
        }, responseMessage.LOGIN));
      } else {
        if (userInfo.status == status.BLOCK) {
          throw apiError.badRequest(responseMessage.BLOCK_BY_ADMIN);
        }
       
        let token = await commonFunction.getToken({
          _id: userInfo._id,
          email: userInfo.email,
          userType: userInfo.userType
        });

        userInfo = _.omit(JSON.parse(JSON.stringify(userInfo)), ["otp", "password", "base64", "secretGoogle", "emailotp2FA", "withdrawOtp", "password"])

        return res.json(new response({
          userInfo,
          token
        }, responseMessage.LOGIN));
      }
    } catch (error) {

      return next(error);
    }
  }

  //*******************CONTACT US */


  /**
   * @swagger
   * /user/contactUs:
   *   post:
   *     tags:
   *       - CONTACT US
   *     description: contactUs
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: firstName
   *         description: firstName
   *         in: formData
   *         required: true
   *       - name: email
   *         description: email
   *         in: formData
   *         required: true
   *       - name: lastName
   *         description: lastName
   *         in: formData
   *         required: false
   *       - name: message
   *         description: message
   *         in: formData
   *         required: true
   *     responses:
   *       200:
   *         description: Contact-Us data Saved successfully
   */

  async contactUs(req, res, next) {
    let validationSchema = {
      firstName: Joi.string().required(),
      email: Joi.string().required(),
      lastName: Joi.string().optional(),
      message: Joi.string().required(),
    }
    try {
      const validatedBody = await Joi.validate(req.body, validationSchema);

      var adminResult = await findUser({
        userType: userType.ADMIN,
        status: status.ACTIVE
      })
      if (!adminResult) {
        throw apiError.notFound("Admin not found");
      }
      var userResult = await findUser({
        email: validatedBody.email,
      })
      if (!userResult) {
        throw apiError.notFound("User not found");
      }

      var result = await createContactUs(validatedBody);
      await commonFunction.sendMailContactus(adminResult.email, adminResult.firstName, validatedBody.firstName, validatedBody.email, validatedBody.message)
      await commonFunction.sendMailContactusUser(validatedBody.email, validatedBody.firstName, validatedBody.message)
      let obj = {
        userId: userResult._id,
        title: "Query Sent",
        description: ` Query: ${ validatedBody.message}.`,
        notificationType: "Query"
      }
      await createNotification(obj)
      return res.json(new response(result, responseMessage.CONTACT_US));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/getContactUs:
   *   post:
   *     tags:
   *       - CONTACT US
   *     description: getContactUs
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: page
   *         description: page
   *         in: query
   *         required: false
   *       - name: search
   *         description: search
   *         in: query
   *         required: false
   *       - name: fromDate
   *         description: fromDate
   *         in: query
   *         required: false
   *       - name: toDate
   *         description: toDate
   *         in: query
   *         required: false
   *       - name: page
   *         description: page
   *         in: query
   *         required: false
   *       - name: status
   *         description: status
   *         in: query
   *         required: false
   *       - name: reply
   *         description: reply(true/false)boolean
   *         in: query
   *         required: false
   *     responses:
   *       200:
   *         description: Data found successfully.
   */

  async getContactUs(req, res, next) {
    const validationSchema = {
      page: Joi.string().optional(),
      limit: Joi.string().optional(),
      search: Joi.string().optional(),
      fromDate: Joi.string().optional(),
      toDate: Joi.string().optional(),
      status: Joi.string().optional(),
      reply: Joi.string().optional(),
    };
    try {
      let validatedBody = await Joi.validate(req.query, validationSchema);
      let userResult = await findUser({
        _id: req.userId,
        userType: userType.ADMIN,
        status: {
          $ne: status.DELETE,
        },
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      let adminRes = await getAllContactUs(validatedBody)
      return res.json(new response(adminRes, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/viewContactsUs:
   *   get:
   *     tags:
   *       - CONTACT US
   *     description: getContactUs
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: id
   *         description: id
   *         in: query
   *         required: true
   *     responses:
   *       200:
   *         description: Data found successfully.
   */

  async viewContactsUs(req, res, next) {
    try {
      let userResult = await findUser({
        _id: req.userId,
        userType: userType.ADMIN,
        status: {
          $ne: status.DELETE,
        },
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      let adminRes = await viewContactUs({
        _id: req.query.id
      })
      return res.json(new response(adminRes, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  }


  /**
   * @swagger
   * /user/viewUser:
   *   get:
   *     tags:
   *       - USER MANAGEMENT
   *     description: get particular user data
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: userId
   *         description: userId
   *         in: query
   *         required: true
   *     responses:
   *       200:
   *         description: User found successfully.
   *       404:
   *         description: User not found.
   *       500:
   *         description: Internal Server Error
   *       501:
   *         description: Something went wrong!
   */
  async viewUser(req, res, next) {
    const validationSchema = {
      userId: Joi.string().required(),
    };
    try {
      let validatedBody = await Joi.validate(req.query, validationSchema);
      let userResult = await findUser({
        _id: req.userId,
        userType: {
          $ne: userType.ADMIN
        },
        status: status.ACTIVE,
      });
      if (!userResult) {
        throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
      }
      let userInfo = await findUser({
        _id: validatedBody.userId,
        userType: {
          $ne: userType.ADMIN
        },
        status: {
          $ne: status.DELETE
        },
      });
      if (!userInfo) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      userResult = _.omit(JSON.parse(JSON.stringify(userInfo)), ["otp", "password", "base64", "secretGoogle", "emailotp2FA", "withdrawOtp", "password"])

      return res.json(new response(userInfo, responseMessage.USER_DETAILS));
    } catch (error) {
      return next(error);
    }
  }

    /**
   * @swagger
   * /user/validatePinCode:
   *   get:
   *     tags:
   *       - USER MANAGEMENT
   *     description: validatePinCode
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: pinCode
   *         description: pinCode
   *         in: query
   *         required: true
   *     responses:
   *       200:
   *         description: User found successfully.
   *       404:
   *         description: User not found.
   *       500:
   *         description: Internal Server Error
   *       501:
   *         description: Something went wrong!
   */
    async validatePinCode(req, res, next) {
      const validationSchema = {
        pinCode: Joi.string().required(),
      };
      try {
        let validatedBody = await Joi.validate(req.query, validationSchema);
        const responses = await axios.get(
          `${config.get("delhiveryUrl")}/c/api/pin-codes/json/?filter_codes=${validatedBody.pinCode}`,
          {
            headers: {
              "Authorization": `Token ${config.get("delhiverySecret")}`,
            },
          }
        );
      if (responses.data.delivery_codes && responses.data.delivery_codes.length > 0) {

        return res.json(new response(responses.data, responseMessage.DATA_FOUND));
      }  else{
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }
      } catch (error) {
        return next(error);
      }
    }
}
export default new userController();