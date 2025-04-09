import Express from "express";
import controller from "./controller";
import auth from "../../../../helper/auth";
import upload from '../../../../helper/uploadHandler';



export default Express.Router()


    .post('/signUp', controller.signup)
    .patch('/verifyOTPSignUp', controller.verifyOTPSignUp)
    .patch('/verifyOTP', controller.verifyOTP)
    .post('/login', controller.login)
    .post('/forgotPassword', controller.forgotPassword)
    .post('/resendOtp', controller.resendOtp)
    .post('/socialLogin', controller.socialLogin)
    .post('/contactUs', controller.contactUs)
    .get("/validatePinCode",controller.validatePinCode)
    .post('/resetPassword', controller.resetPassword)
    .use(auth.verifyToken)

    .post('/getContactUs', controller.getContactUs)
    .get('/viewContactsUs', controller.viewContactsUs)
    .patch('/changePassword', controller.changePassword)
    .get('/getProfile', controller.getProfile)
    .get('/viewUser', controller.viewUser)

    .use(upload.uploadFile)
    .post('/uploadFile', controller.uploadFile)
    .put('/editProfile', controller.editProfile)