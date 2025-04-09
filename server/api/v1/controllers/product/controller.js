import Joi from "joi";
import _ from "lodash";
import apiError from "../../../../helper/apiError";
import response from "../../../../../assets/response";
import responseMessage from "../../../../../assets/responseMessage";
import { productServices } from "../../services/product";
const {
  createProduct,
  productCheck,
  findProduct,
  updateProduct,
  paginateProduct,
  updateProductById,
  findProductAll,
  searchProducts,
} = productServices;
import { userServices } from "../../services/user";
const { findUser } = userServices;
import { categoryServices } from "../../services/category";
const { findCategory } = categoryServices;
import commonFunction from "../../../../helper/util";
import status from "../../../../enums/status";
import userType, { ADMIN } from "../../../../enums/userType";
import config from "config";
const Razorpay = require("razorpay");
const razorpay = new Razorpay({
  key_id: config.get("razorPayKeyId"),
  key_secret: config.get("razorPaySecret"),
});
import { transactionServices } from "../../services/transaction";
const {
  createTransaction,
  updateTransaction,
  findTransactions,
  transactionPaginateSearch,
  getTransaction,
} = transactionServices;
import crypto from "crypto";
export class ProductController {
  /**
   * @swagger
   * /product/addProduct:
   *   post:
   *     tags:
   *       - Product
   *     description: addProduct
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: productTitle
   *         description: productTitle
   *         in: formData
   *         required: true
   *       - name: productDescription
   *         description: productDescription
   *         in: formData
   *         required: true
   *       - name: images
   *         description: images
   *         in: formData
   *         type: array
   *         required: true
   *       - name: category
   *         description: category
   *         in: formData
   *         required: true
   *       - name: productDetails
   *         description: productDetails
   *         in: formData
   *         required: false
   *       - name: otherDescription
   *         description: otherDescription
   *         in: formData
   *         required: false
   *       - name: styleTip
   *         description: styleTip
   *         in: formData
   *         required: false
   *       - name: quantity
   *         description: quantity
   *         in: formData
   *         required: false
   *     responses:
   *       200:
   *         description: Returns success message
   */

  async addProduct(req, res, next) {
    let validationSchema = {
      productTitle: Joi.string().optional(),
      productDescription: Joi.string().optional(),
      category: Joi.string().optional(),
      images: Joi.array().optional(),
      productDetails: Joi.string().optional(),
      otherDescription: Joi.string().optional(),
      styleTip: Joi.string().optional(),
      price: Joi.number().optional(),
      discountPrice: Joi.number().optional(),
      freeDelivery: Joi.boolean().optional(),
      discount: Joi.boolean().optional(),
      quantity: Joi.number().optional(),
    };
    try {
      const validatedBody = await Joi.validate(req.body, validationSchema);
      let userResult = await findUser({
        _id: req.userId,
        userType: { $ne: userType.USER },
        status: status.ACTIVE,
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      if (validatedBody.categoryId) {
        let category = await findCategory({
          categoryTitle: validatedBody.category,
        });
        if (!category) {
          throw apiError.notFound(responseMessage.CATEGORY_NOT_FOUND);
        }
      }
      var product = await productCheck(validatedBody.productTitle);
      if (product) {
        throw apiError.notFound(responseMessage.PRODUCT_ALREADY_EXIST);
      }
      var result = await createProduct(validatedBody);
      return res.json(new response(result, responseMessage.PRODUCT_CREATED));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /product/listproduct:
   *   get:
   *     tags:
   *       - product
   *     description: listproduct
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: status
   *         description: status (ACTIVE/BLOCK)
   *         in: query
   *         required: false
   *       - name: category
   *         description: category
   *         in: query
   *         required: false
   *       - name: fromDate
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
   *       - name: limit
   *         description: limit
   *         in: query
   *         required: false
   *       - name: quantity
   *         description: quantity
   *         in: query
   *         required: false
   *       - name: latest
   *         description: latest(boolean)
   *         in: query
   *         required: false
   *     responses:
   *       200:
   *         description: Returns success message
   */

  async listProduct(req, res, next) {
    const validationSchema = {
      search: Joi.string().optional(),
      fromDate: Joi.string().optional(),
      toDate: Joi.string().optional(),
      page: Joi.number().optional(),
      limit: Joi.number().optional(),
      status: Joi.string().optional(),
      category: Joi.string().optional(),
      latest: Joi.string().optional(),
      quantity: Joi.number().optional(),
    };
    try {
      const validatedBody = await Joi.validate(req.query, validationSchema);
      let userResult = await findUser({
        _id: req.userId,
        userType: { $ne: userType.USER },
        status: status.ACTIVE,
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      //  validatedBody.status =status.ACTIVE
      let dataResults = await paginateProduct(validatedBody);
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
   * /product/listProductAll:
   *   get:
   *     tags:
   *       - product
   *     description: listProductAll
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

  async listProductAll(req, res, next) {
    try {
      let userResult = await findUser({
        _id: req.userId,
        userType: { $ne: userType.USER },
        status: status.ACTIVE,
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }

      let dataResults = await findProductAll({ status: status.ACTIVE });
      if (dataResults.length == 0) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }
      return res.json(new response(dataResults, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /product/userProductList:
   *   get:
   *     tags:
   *       - USERproduct
   *     description: userProductList
   *     produces:
   *       - application/json
   *     parameters:
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
   *       - name: categoryId
   *         description: categoryId
   *         in: query
   *         required: false
   *       - name: latest
   *         description: latest
   *         in: query
   *         required: false
   *     responses:
   *       200:
   *         description: Returns success message
   */

  async userProductList(req, res, next) {
    const validationSchema = {
      search: Joi.string().optional(),
      fromDate: Joi.string().optional(),
      toDate: Joi.string().optional(),
      page: Joi.number().optional(),
      limit: Joi.number().optional(),
      categoryId: Joi.string().optional(),
      latest: Joi.string().optional(),
    };
    try {
      const validatedBody = await Joi.validate(req.query, validationSchema);

      if (validatedBody.categoryId) {
        let category = await findCategory({ _id: validatedBody.categoryId });

        validatedBody.category = category.categoryTitle;
      }

      validatedBody.status = "ACTIVE";
      let dataResults = await paginateProduct(validatedBody);
      if (dataResults.docs.length == 0) {
        throw apiError.notFound(responseMessage.PRODUCT_NOT_FOUND);
      }
      return res.json(new response(dataResults, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /product/searchProduct:
   *   get:
   *     tags:
   *       - USERproduct
   *     description: userProductList
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: search
   *         description: search
   *         in: query
   *         required: false
   *       - name: page
   *         description: page
   *         in: query
   *         required: false
   *       - name: limit
   *         description: limit
   *         in: query
   *         required: false
   *     responses:
   *       200:
   *         description: Returns success message
   */

  async searchProduct(req, res, next) {
    const validationSchema = {
      search: Joi.string().optional(),
      page: Joi.string().optional(),
      limit: Joi.string().optional(),
    };
    try {
      const validatedBody = await Joi.validate(req.query, validationSchema);
      if (!validatedBody.search) {
        throw apiError.notFound(responseMessage.PRODUCT_NOT_FOUND);
      }
      let dataResults = await searchProducts(validatedBody);
      if (dataResults.docs.length == 0) {
        throw apiError.notFound(responseMessage.PRODUCT_NOT_FOUND);
      }
      return res.json(new response(dataResults, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  }
  /**
   * @swagger
   * /product/userProductListAll:
   *   get:
   *     tags:
   *       - product
   *     description: userProductListAll
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         description: Returns success message
   */

  async userProductListAll(req, res, next) {
    try {
      let dataResults = await findProductAll({ status: status.ACTIVE });
      if (dataResults.length == 0) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }
      return res.json(new response(dataResults, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  }
  /**
   * @swagger
   * /product/deleteproduct:
   *   delete:
   *     tags:
   *       - product
   *     description: deleteproduct
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: _id
   *         description: _id
   *         in: formData
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */

  async deleteProduct(req, res, next) {
    const validationSchema = {
      _id: Joi.string().required(),
    };
    try {
      const validatedBody = await Joi.validate(req.body, validationSchema);
      let userResult = await findUser({
        _id: req.userId,
        userType: { $ne: userType.USER },
        status: status.ACTIVE,
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      var productInfo = await findProduct({
        _id: validatedBody._id,
        status: { $ne: status.DELETE },
      });
      if (!productInfo) {
        throw apiError.notFound(responseMessage.PRODUCT_NOT_FOUND);
      }
      let deleteRes = await updateProduct(
        { _id: productInfo._id },
        { status: status.DELETE }
      );
      return res.json(new response(deleteRes, responseMessage.DELETE_SUCCESS));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /product/editproduct:
   *   put:
   *     tags:
   *       - product
   *     description: editproduct
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: _id
   *         description: _id
   *         in: formData
   *         required: true
   *       - name: productTitle
   *         description: productTitle
   *         in: formData
   *         required: true
   *       - name: productDescription
   *         description: productDescription
   *         in: formData
   *         required: true
   *       - name: images
   *         description: images
   *         in: formData
   *         type: array
   *         required: true
   *       - name: category
   *         description: category
   *         in: formData
   *         required: true
   *       - name: productDetails
   *         description: productDetails
   *         in: formData
   *         required: false
   *       - name: otherDescription
   *         description: otherDescription
   *         in: formData
   *         required: false
   *       - name: styleTip
   *         description: styleTip
   *         in: formData
   *         required: false
   *       - name: price
   *         description: price
   *         in: formData
   *         required: false
   *       - name: discountPrice
   *         description: discountPrice
   *         in: formData
   *         required: false
   *       - name: freeDelivery
   *         description: freeDelivery
   *         in: formData
   *         required: false
   *       - name: discount
   *         description: discount
   *         in: formData
   *         required: false
   *       - name: price
   *         description: price
   *         in: formData
   *         required: false
   *       - name: discountPrice
   *         description: discountPrice
   *         in: formData
   *         required: false
   *       - name: freeDelivery
   *         description: freeDelivery
   *         in: formData
   *         required: false
   *       - name: quantity
   *         description: quantity
   *         in: formData
   *         required: false
   *     responses:
   *       200:
   *         description: Returns success message
   */

  async editProduct(req, res, next) {
    const validationSchema = {
      _id: Joi.string().required(),
      productTitle: Joi.string().optional(),
      productDescription: Joi.string().optional(),
      category: Joi.string().optional(),
      images: Joi.array().optional(),
      productDetails: Joi.string().optional(),
      otherDescription: Joi.string().optional(),
      styleTip: Joi.string().optional(),
      price: Joi.number().optional(),
      discountPrice: Joi.number().optional(),
      freeDelivery: Joi.boolean().optional(),
      discount: Joi.boolean().optional(),
      quantity: Joi.number().optional(),
    };
    try {
      const validatedBody = await Joi.validate(req.body, validationSchema);

      let userResult = await findUser({
        _id: req.userId,
        userType: { $ne: userType.USER },
        status: status.ACTIVE,
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      let products = await findProduct({
        _id: validatedBody._id,
        status: { $ne: status.DELETE },
      });
      if (!products) {
        throw apiError.notFound(responseMessage.PRODUCT_NOT_FOUND);
      }
      if (validatedBody.category) {
        let category = await findCategory({
          categoryTitle: validatedBody.category,
        });
        if (!category) {
          throw apiError.notFound(responseMessage.CATEGORY_NOT_FOUND);
        }
      }

      if (validatedBody.productTitle != products.productTitle) {
        var product = await productCheck(validatedBody.productTitle);
        if (product) {
          throw apiError.notFound(responseMessage.PRODUCT_ALREADY_EXIST);
        }
      }
      var result = await updateProductById(
        { _id: products._id },
        validatedBody
      );
      return res.json(new response(result, responseMessage.PRODUCT_UPDATED));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /product/viewproduct:
   *   get:
   *     tags:
   *       - ADMIN_PRODUCT_MANAGEMENT
   *     description: viewproduct
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

  async viewProduct(req, res, next) {
    const validationSchema = {
      _id: Joi.string().required(),
    };
    try {
      const validatedBody = await Joi.validate(req.query, validationSchema);
      let userResult = await findUser({
        _id: req.userId,
        userType: { $ne: userType.USER },
        status: status.ACTIVE,
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      var productInfo = await findProduct({
        _id: validatedBody._id,
        status: { $ne: status.DELETE },
      });
      if (!productInfo) {
        throw apiError.notFound(responseMessage.PRODUCT_NOT_FOUND);
      }
      return res.json(new response(productInfo, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  }
  /**
   * @swagger
   * /product/userViewProduct:
   *   get:
   *     tags:
   *       - USERproduct
   *     description: viewproduct
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: _id
   *         description: _id
   *         in: query
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */

  async userViewProduct(req, res, next) {
    const validationSchema = {
      _id: Joi.string().required(),
    };
    try {
      const validatedBody = await Joi.validate(req.query, validationSchema);

      var productInfo = await findProduct({
        _id: validatedBody._id,
        status: status.ACTIVE,
      });
      if (!productInfo) {
        throw apiError.notFound(responseMessage.PRODUCT_NOT_FOUND);
      }
      return res.json(new response(productInfo, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  }
  /**
   * @swagger
   * /product/activeDeactiveProduct:
   *   put:
   *     tags:
   *       - product
   *     description: activeDeactiveproduct
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: _id
   *         description: _id
   *         in: formData
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */

  async activeDeactiveProduct(req, res, next) {
    const validationSchema = {
      _id: Joi.string().required(),
    };
    try {
      const validatedBody = await Joi.validate(req.body, validationSchema);
      let userResult = await findUser({
        _id: req.userId,
        userType: { $ne: userType.USER },
        status: status.ACTIVE,
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.PRODUCT_NOT_FOUND);
      }
      var productInfo = await findProduct({
        _id: validatedBody._id,
      });
      if (!productInfo) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }

      let changedStatus =
        productInfo.status == status.ACTIVE ? status.BLOCK : status.ACTIVE;
      var resData = await updateProduct(
        { _id: productInfo._id },
        { status: changedStatus }
      );
      if (changedStatus == status.BLOCK) {
        return res.json(new response(resData, responseMessage.PRODUCT_BLOCK));
      } else {
        return res.json(new response(resData, responseMessage.PRODUCT_ACTIVE));
      }
    } catch (error) {
      console.log("========>>>>>>");
      return next(error);
    }
  }

  /**
   * @swagger
   * /product/createPaymentOrder:
   *   post:
   *     tags:
   *       - product
   *     description: createPaymentOrder
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: amount
   *         description: amount
   *         in: formData
   *         required: true
   *       - name: products
   *         description: products
   *         in: formData
   *         required: true
   *       - name: paymentType
   *         description: paymentType
   *         in: formData
   *         required: true
   *       - name: address
   *         description: address
   *         in: formData
   *         required: true
   *       - name: totalDiscount
   *         description: totalDiscount
   *         in: formData
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */

  async createPaymentOrder(req, res, next) {
    const validationSchema = {
      amount: Joi.number().required(),
      products: Joi.array().required(),
      paymentType: Joi.string().required(),
      address: Joi.object().required(),
      totalDiscount: Joi.number().required(),
    };
    try {
      const validatedBody = await Joi.validate(req.body, validationSchema);
      let userResult = await findUser({
        _id: req.userId,
        status: status.ACTIVE,
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      if (validatedBody.paymentType == "COD") {
        let ord = await generateTrxId();
        let orderTrx = await createTransaction({
          userId: userResult._id,
          orderId: ord,
          // receipt:order.receipt,
          amount: validatedBody.amount,
          products: validatedBody.products,
          paymentType: "COD",
          address: validatedBody.address,
          totalDiscount: validatedBody.totalDiscount,
        });
        // console.log("ffffffffffffffffffff",order)
        return res.json(new response(orderTrx, "Order successfully created"));
      } else {
        const options = {
          amount: req.body.amount * 100, // Convert to paise
          currency: "INR",
          receipt: `receipt_${Date.now()}`,
        };
        const order = await razorpay.orders.create(options);
        if (order && order.status == "created") {
          await createTransaction({
            userId: userResult._id,
            orderId: order.id,
            receipt: order.receipt,
            amount: validatedBody.amount,
            products: validatedBody.products,
            paymentType: "Pre-Paid",
            address: validatedBody.address,
            totalDiscount: validatedBody.totalDiscount,
          });
          console.log("ffffffffffffffffffff", order);
          return res.json(new response(order, "Payment in process."));
        } else {
          throw apiError.notFound(
            "Error in order creation. Please retry after sometime."
          );
        }
      }
    } catch (error) {
      console.log("========>>>>>>");
      return next(error);
    }
  }

  /**
   * @swagger
   * /product/verifyPayment:
   *   post:
   *     tags:
   *       - product
   *     description: verifyPayment
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: razorpay_order_id
   *         description: razorpay_order_id
   *         in: formData
   *         required: true
   *       - name: razorpay_payment_id
   *         description: razorpay_payment_id
   *         in: formData
   *         required: true
   *       - name: razorpay_signature
   *         description: razorpay_signature
   *         in: formData
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */

  async verifyPayment(req, res, next) {
    const validationSchema = {
      razorpay_payment_id: Joi.string().required(),
      razorpay_signature: Joi.string().required(),
      razorpay_order_id: Joi.string().required(),
    };
    try {
      const validatedBody = await Joi.validate(req.body, validationSchema);
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
        validatedBody;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        throw apiError.notFound("Missing required fields.");
      }

      const body = razorpay_order_id + "|" + razorpay_payment_id;

      const expectedSignature = crypto
        .createHmac("sha256", config.get("razorPaySecret"))
        .update(body)
        .digest("hex");
      if (expectedSignature != razorpay_signature) {
        throw apiError.notFound("Invalid Signature.");
      }
      return res.json(new response({}, "Payment verified successfully"));
    } catch (error) {
      console.log("========>>>>>>");
      return next(error);
    }
  }

  async razorpayWebhook(req, res, next) {
    try {
      const secret = config.get("razorPaySecret");
      const signature = req.headers["x-razorpay-signature"];
      const body = JSON.stringify(req.body);
      console.log("lk;fl;skdflkslfksl;fklskfldskfl", body);
      const transaction = await findTransactions({ orderId: body.order_id });
      if (transaction) {
        const expectedSignature = crypto
          .createHmac("sha256", secret)
          .update(body)
          .digest("hex");
        if (expectedSignature !== signature) {
          const event = req.body;
          console.log("000000000000000000000000000", event);
          console.log("Received webhook event:", event.event);
          if (event.event === "payment.captured") {
            const payment = event.payload.payment.entity;
            await updateTransaction(transaction._id, {
              paymentStatus: "COMPLETED",
              receipt: payment.receipt,
            });
            console.log({
              success: true,
              message: "Transaction completed successfully.",
            });
          }

          if (event.event === "payment.failed") {
            const payment = event.payload.payment.entity;
            await updateTransaction(transaction._id, {
              paymentStatus: "FAILED",
            });
            console.log({
              success: true,
              message: "Transaction marked as failed.",
            });
          }
        } else {
          console.log({ error: "Invalid webhook signature" });
        }
      }
    } catch (error) {
      console.error("Webhook error:", error);
    }
  }

  /**
   * @swagger
   * /product/orderList:
   *   get:
   *     tags:
   *       - product
   *     description: orderList
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: status
   *         description: status (ACTIVE/BLOCK)
   *         in: query
   *         required: false
   *       - name: category
   *         description: category
   *         in: query
   *         required: false
   *       - name: fromDate
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
   *       - name: limit
   *         description: limit
   *         in: query
   *         required: false
   *       - name: paymentStatus
   *         description: paymentStatus
   *         in: query
   *         required: false
   *       - name: paymentType
   *         description: paymentType
   *         in: query
   *         required: false
   *       - name: deliveryStatus
   *         description: deliveryStatus
   *         in: query
   *         required: false
   *     responses:
   *       200:
   *         description: Returns success message
   */

  async orderList(req, res, next) {
    const validationSchema = {
      search: Joi.string().optional(),
      fromDate: Joi.string().optional(),
      toDate: Joi.string().optional(),
      page: Joi.number().optional(),
      limit: Joi.number().optional(),
      status: Joi.string().optional(),
      paymentStatus: Joi.string().optional(),
      paymentType: Joi.string().optional(),
      deliveryStatus: Joi.string().optional(),
      category: Joi.string().optional(),
    };
    try {
      const validatedBody = await Joi.validate(req.query, validationSchema);
      let userResult = await findUser({
        _id: req.userId,
        status: status.ACTIVE,
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      if (userResult.userType == "USER") {
        validatedBody.userId = userResult._id;
      }
      //  validatedBody.status =status.ACTIVE
      let dataResults = await transactionPaginateSearch(validatedBody);
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
   * /product/viewOrder:
   *   get:
   *     tags:
   *       - ADMIN_PRODUCT_MANAGEMENT
   *     description: viewproduct
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

  async viewOrder(req, res, next) {
    const validationSchema = {
      _id: Joi.string().required(),
    };
    try {
      const validatedBody = await Joi.validate(req.query, validationSchema);
      let userResult = await findUser({
        _id: req.userId,
        status: status.ACTIVE,
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      var productInfo = await getTransaction({
        _id: validatedBody._id,
        status: { $ne: status.DELETE },
      });
      if (!productInfo) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }
      return res.json(new response(productInfo, responseMessage.DATA_FOUND));
    } catch (error) {
      return next(error);
    }
  }
  /**
   * @swagger
   * /product/cancelOrder:
   *   post:
   *     tags:
   *       - PRODUCT
   *     description: cancelOrder
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: _id
   *         description: _id
   *         in: formData
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async cancelOrder(req, res, next) {
    const validationSchema = {
      _id: Joi.string().required(),
    };

    try {
      const validatedBody = await Joi.validate(req.body, validationSchema);

      let userResult = await findUser({
        _id: req.userId,
        status: status.ACTIVE,
      });

      if (!userResult) {
        throw apiError.unauthorized(responseMessage.UNAUTHORIZED);
      }

      let query = {
        _id: validatedBody._id,
        status: status.PENDING,
      };
      if (userResult.userType == userType.USER) {
        query.userId = userResult._id;
      }
      let trx = await findTransactions(query);
      if (!trx) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }
      if (trx.orderCreated == true) {
        const response = await axios.post(
          `${url}/edit`, // API endpoint for cancellation
          { waybill: trx.waybill, cancellation: "true" }, // Request body
          {
            headers: {
              Authorization: `Token ${config.get("delhiverySecret")}`,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          }
        );

        if (!response || response.status !== 200) {
          throw new Error("Failed to cancel order");
        }
      }
      let result = await updateTransaction(
        { _id: validatedBody._id },
        { status: "CANCELLED" }
      );
      return res.json(new response(result, "Order cancelled successfully"));  
    } catch (error) {
      return next(error);
    }
  }
}
export default new ProductController();
function generateTrxId(prefix = "Ord") {
  const timestamp = Date.now().toString(36); // Convert timestamp to base36
  const randomStr = Math.random().toString(36).substring(2, 10); // Random alphanumeric
  return `${prefix}-${timestamp}-${randomStr}`.toUpperCase();
}
