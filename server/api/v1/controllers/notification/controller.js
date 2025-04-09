import Joi from "joi";
import _ from "lodash";
import config from "config";
import apiError from "../../../../helper/apiError";
import response from "../../../../../assets/response";
import responseMessage from "../../../../../assets/responseMessage";
import commonFunction from "../../../../helper/util";
import status from "../../../../enums/status";
import auth from "../../../../helper/auth";

import userType from "../../../../enums/userType";
import { userServices } from "../../services/user";
import { notificationServices } from "../../services/notification";
import { announcementServices } from "../../services/announcement";
const { findUser } = userServices;
const {
  createNotification,
  findNotification,
  updateNotification,
  multiUpdateNotification,
  notificationList, paginateNotification
} = notificationServices;
const {
  createAnnouncement,
  findAnnouncement,
  allAnnouncement,
  paginateAnnouncement,
  updateAnnouncement,
} = announcementServices;
var responses;

export class notificationController {


  /**
   * @swagger
   * /notification/viewNotification/{_id}:
   *   get:
   *     tags:
   *       - NOTIFICATION MANAGEMENT
   *     description: viewNotification
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: _id
   *         description: _id
   *         in: path
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async viewNotification(req, res, next) {
    const validationSchema = {
      _id: Joi.string().required(),
    };
    try {
      const { _id } = await Joi.validate(req.params, validationSchema);
      let userResult = await findUser({ _id: req.userId });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      var notificationResult = await findNotification({
        $or: [
          { userId: userResult._id },
          { userId: { $exists: false } }
        ],
        _id: _id,
        sendDate: { $lte: new Date() },
        status: { $ne: status.DELETE },
      });
      if (!notificationResult) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }
      return res.json(
        new response(notificationResult, responseMessage.DETAILS_FETCHED)
      );
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /notification/deleteNotification:
   *   delete:
   *     tags:
   *       - NOTIFICATION MANAGEMENT
   *     description: deleteNotification
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: _id
   *         description: _id
   *         in: query
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async deleteNotification(req, res, next) {
    const validationSchema = {
      _id: Joi.string().required(),
    };
    try {
      const { _id } = await Joi.validate(req.query, validationSchema);
      let userResult = await findUser({ _id: req.userId });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      var notificationResult = await findNotification({
        _id: _id,
        $or: [
          { userId: userResult._id },
          { userId: { $exists: false } },

        ],
        status: status.ACTIVE
      });
      if (!notificationResult) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }
      var result = await updateNotification(
        { _id: notificationResult._id },
        {
          $push: { deleteFor: userResult._id },
        },
      );
      return res.json(new response(result, responseMessage.DELETE_SUCCESS));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /notification/listNotification:
   *   get:
   *     tags:
   *       - NOTIFICATION MANAGEMENT
   *     description: listNotification
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
   *         required: true
   *       - name: limit
   *         description: limit
   *         in: query
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async listNotification(req, res, next) {
    try {
      let userResult = await findUser({ _id: req.userId });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
    let obj ={
      _id:userResult._id,
      page:req.query.page,
      limit:req.query.limit,
      createdAt:userResult.createdAt
    }
      let dataResults = await paginateNotification(obj);
      if (dataResults.docs.length == 0) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }
      return res.json(new response(dataResults, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  }

  /**
 * @swagger
 * /notification/readStatus:
 *   get:
 *     tags:
 *       - NOTIFICATION MANAGEMENT
 *     description: readStatus
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
  async readStatus(req, res, next) {
    try {
      let userResult = await findUser({ _id: req.userId });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      let obj = {
        _id: userResult._id,
        read: true,
        createdAt:userResult.createdAt
      }
      let dataResults = await paginateNotification(obj);

      let status = dataResults.docs.length > 0;



      if (status) {
        return res.json(new response(status, responseMessage.DATA_FOUND));
      } else {
        return res.status(200).json({ status: false, message: responseMessage.DATA_NOT_FOUND });
      }
    } catch (error) {
      return next(error);
    }
  }



  /**
   * @swagger
   * /notification/readNotification:
   *   put:
   *     tags:
   *       - NOTIFICATION MANAGEMENT
   *     description: readNotification
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
  async readNotification(req, res, next) {
    try {
      let userResult = await findUser({ _id: req.userId });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      var result = await multiUpdateNotification(
        {
          $or: [
            { userId: userResult._id },
            { userId: { $exists: false } }
          ]
        },
        {
          $push: { read: userResult._id },
        },);
      return res.json(new response(result, responseMessage.DETAILS_FETCHED));
    } catch (error) {
      return next(error);
    }
  }
  /**
   * @swagger
   * /notification/clearNotification:
   *   delete:
   *     tags:
   *       - NOTIFICATION MANAGEMENT
   *     description: clearNotification
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
  async clearNotification(req, res, next) {
    try {
      let userResult = await findUser({
        _id: req.userId,
        userType: { $in: [userType.USER, userType.ADMIN, userType.SUBADMIN] },
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      let result = await multiUpdateNotification({
        $or: [
          { userId: userResult._id },
          { userId: { $exists: false } }
        ]
      },
        {
          $push: { deleteFor: userResult._id },
        },);

      return res.json(
        new response(result, responseMessage.NOTIFICATION_CLEAR)
      );

    } catch (error) {
      return next(error);
    }
  }

  //**********************ANNOUNCEMENT */
  /**
   * @swagger
   * /notification/addAnnouncement:
   *   post:
   *     tags:
   *       - ADMIN_ANNOUNCEMENT_MANAGEMET
   *     description: addAnnouncement
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: title
   *         description: title
   *         in: formData
   *         required: true
   *       - name: message
   *         description: message
   *         in: formData
   *         required: false
   *       - name: sendDate
   *         description: sendDate
   *         in: formData
   *         required: false
   *       - name: url
   *         description: url
   *         in: formData
   *         required: false
   *       - name: text
   *         description: text
   *         in: formData
   *         required: false
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async addAnnouncement(req, res, next) {
    let validationSchema = {
      title: Joi.string().optional(),
      message: Joi.string().allow("").optional(),
      sendDate: Joi.string().allow("").optional(),
      url: Joi.string().allow("").optional(),
      text: Joi.string().allow("").optional(),
    };
    try {
      let validatedBody = await Joi.validate(req.body, validationSchema);
      let userResult = await findUser({
        _id: req.userId,
        userType: { $ne: userType.USER },
        status: status.ACTIVE
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }



      let obj = {
        title: validatedBody.title,
        description: validatedBody.message,
        sendDate: validatedBody.sendDate,
        notificationType: "ANNOUNCEMENT",
        url: validatedBody.url,
        text: validatedBody.text
      };
      let notificationRes = await createNotification(obj);
      return res.json(
        new response(notificationRes, responseMessage.DATA_SAVED)
      );
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /notification/listAnnouncement:
   *   get:
   *     tags:
   *       - ADMIN_ANNOUNCEMENT_MANAGEMET
   *     description: list notifications
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: admin token
   *         in: header
   *         required: true
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
   *         type: integer
   *         required: false
   *       - name: limit
   *         description: limit
   *         in: query
   *         type: integer
   *         required: false
   *     responses:
   *       200:
   *         description: Data found successfully.
   *       404:
   *         description: User not found || Data not found.
   *       501:
   *         description: Something went wrong!
   */
  async listAnnouncement(req, res, next) {
    const validationSchema = {
      search: Joi.string().optional(),
      fromDate: Joi.string().optional(),
      toDate: Joi.string().optional(),
      page: Joi.number().optional(),
      limit: Joi.number().optional(),
    };
    try {
      const validatedBody = await Joi.validate(req.query, validationSchema);

      let adminRes = await findUser({
        _id: req.userId,
        userType: { $ne: userType.USER },
        status: status.ACTIVE
      });
      if (!adminRes) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }

      const data = await paginateAnnouncement(validatedBody);

      if (data.docs.length == 0) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }
      return res.json(new response(data, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /notification/viewAnnouncement:
   *   get:
   *     tags:
   *       - ADMIN_ANNOUNCEMENT_MANAGEMET
   *     description: viewAnnouncement
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: annouId
   *         description: annouId
   *         in: query
   *         required: true
   *     responses:
   *       200:
   *         description: Data found successfully.
   *       404:
   *         description: User not found || Data not found.
   *       501:
   *         description: Something went wrong!
   */
  async viewAnnouncement(req, res, next) {
    try {
      let validatedBody = req.query;
      let adminRes = await findUser({
        _id: req.userId,
        userType: { $ne: userType.USER },
        status: status.ACTIVE
      });
      if (!adminRes) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      let sendData = await findAnnouncement({
        status: status.ACTIVE,
        _id: validatedBody.annouId,
      });

      if (!sendData) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }
      return res.json(new response(sendData, responseMessage.DATA_FOUND));


    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /notification/deleteAnnouncement:
   *   delete:
   *     tags:
   *       - ADMIN_ANNOUNCEMENT_MANAGEMET
   *     description: deleteAnnouncement
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: annouId
   *         description: annouId
   *         in: formData
   *         required: true
   *     responses:
   *       200:
   *         description: Data found successfully.
   *       404:
   *         description: User not found || Data not found.
   *       501:
   *         description: Something went wrong!
   */
  async deleteAnnouncement(req, res, next) {
    try {
      let validatedBody = req.body;
      let adminRes = await findUser({
        _id: req.userId,
        userType: { $ne: userType.USER },
        status: status.ACTIVE
      });
      if (!adminRes) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      } else {
        let sendData = await findAnnouncement({
          status: status.ACTIVE,
          _id: validatedBody.annouId,
        });
        if (!sendData) {
          throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
        } else {
          let result = await updateAnnouncement(
            { _id: sendData._id },
            { status: status.DELETE }
          );
          return res.json(new response(result, responseMessage.DELETE_SUCCESS));
        }
      }
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /notification/updateAnnouncement:
   *   put:
   *     tags:
   *       - ADMIN_ANNOUNCEMENT_MANAGEMET
   *     description: updateAnnouncement
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: annouId
   *         description: annouId
   *         in: formData
   *         required: true
   *       - name: title
   *         description: title
   *         in: formData
   *         required: true
   *       - name: message
   *         description: message
   *         in: formData
   *         required: true
   *       - name: sendDate
   *         description: sendDate
   *         in: formData
   *         required: true
   *       - name: url
   *         description: url
   *         in: formData
   *         required: true
   *       - name: text
   *         description: text
   *         in: formData
   *         required: true
   *     responses:
   *       200:
   *         description: Data found successfully.
   *       404:
   *         description: User not found || Data not found.
   *       501:
   *         description: Something went wrong!
   */
  async updateAnnouncement(req, res, next) {
    let validationSchema = {
      annouId: Joi.string().required(),
      title: Joi.string().allow("").optional(),
      message: Joi.string().allow("").optional(),
      sendDate: Joi.string().allow("").optional(),
      url: Joi.string().allow("").optional(),
      text: Joi.string().allow("").optional(),
    };
    try {
      let validatedBody = await Joi.validate(req.body, validationSchema);
      let adminRes = await findUser({
        _id: req.userId,
        userType: { $ne: userType.USER },
        status: status.ACTIVE
      });
      if (!adminRes) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      } else {
        let sendData = await findAnnouncement({
          status: status.ACTIVE,
          _id: validatedBody.annouId,
        });
        if (!sendData) {
          throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
        }
        let obj = {
          title: validatedBody.title,
          description: validatedBody.message,
          sendDate: validatedBody.sendDate,
          url: validatedBody.url,
          text: validatedBody.text
        };
        let result = await updateAnnouncement({ _id: sendData._id }, obj);
        return res.json(new response(result, responseMessage.UPDATE_SUCCESS));
      }
    } catch (error) {
      return next(error);
    }
  }
}

export default new notificationController();
