import Express from "express";
import controller from "./controller";
import auth from "../../../../helper/auth";
import upload from '../../../../helper/uploadHandler';


export default Express.Router()

    .use(auth.verifyToken)
    
    .get('/viewNotification/:_id', controller.viewNotification)
    .delete('/deleteNotification', controller.deleteNotification)
    .put('/readNotification', controller.readNotification)
    .get('/listNotification', controller.listNotification)
    .get('/readStatus', controller.readStatus)
    .delete('/clearNotification', controller.clearNotification)

    //*************ANNOUNCEMENT */
    
    .get('/viewAnnouncement', controller.viewAnnouncement)
    .delete('/deleteAnnouncement', controller.deleteAnnouncement) 
    .get('/listAnnouncement', controller.listAnnouncement)

    .use(upload.uploadFile)
    .post('/addAnnouncement', controller.addAnnouncement)
    .put('/updateAnnouncement', controller.updateAnnouncement)




