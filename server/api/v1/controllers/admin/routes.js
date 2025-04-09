import Express from "express";
import controller from "./controller";
import auth from '../../../../helper/auth'
import upload from '../../../../helper/uploadHandler';
import "../cron/cronIndex"
export default Express.Router()

  .post('/login', controller.login)
  .post('/forgotPassword', controller.forgotPassword)
  .patch('/verifyOTP', controller.verifyOTP)
  .post('/resendOtp', controller.resendOtp)
  .post('/resetPassword', controller.resetPassword)

  .use(auth.verifyToken)
  .get('/getProfile', controller.getProfile)
  .patch('/changePassword', controller.changePassword)
  .get('/userList', controller.userList)
  .get('/viewUser', controller.viewUser)
  .put('/activeBlockUser', controller.activeBlockUser)
  .put('/editUserProfile', controller.editUserProfile)
  .delete('/deleteUser', controller.deleteUser)
  .get('/dashBoard', controller.dashBoard)
  .get('/graphDW', controller.graphDW)
  .post('/addSubAdmin', controller.addSubAdmin)
  .get('/listSubAdmin', controller.listSubAdmin)
  .put('/blockUnblockSubAdmin', controller.blockUnblockSubAdmin)
  .put('/replyContactUs', controller.replyContactUs)
  .delete('/deleteSubAdmin', controller.deleteSubAdmin)
  .delete('/deletedb', controller.deletedb)
  .get('/graphForUser', controller.graphForUser)
  .get('/userRegistration', controller.userRegistration)
  .get('/dashboardV1', controller.dashboardV1)
  .post("/addUpdateWareHouse",controller.addUpdateWareHouse)
  .get("/getWareHouse",controller.getWareHouse)
  .use(upload.uploadFile)
  .put('/editProfile', controller.editProfile)
  .put('/editProfileSubAdmin', controller.editProfileSubAdmin)







