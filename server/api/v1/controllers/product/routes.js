import Express from "express";
import controller from "./controller";
import auth from "../../../../helper/auth";
import upload from "../../../../helper/uploadHandler";

export default Express.Router()
  .post("/razorpayWebhook", controller.razorpayWebhook)
  .post("/verifyPayment", controller.verifyPayment)
  .get("/userProductList", controller.userProductList)
  .get("/searchProduct", controller.searchProduct)
  .get("/userProductListAll", controller.userProductListAll)
  .get("/userViewProduct", controller.userViewProduct)
  .use(auth.verifyToken)
  .delete("/deleteProduct", controller.deleteProduct)
  .get("/viewProduct", controller.viewProduct)
  .get("/orderList", controller.orderList)
  .get("/viewOrder", controller.viewOrder)
  .put("/activeDeactiveProduct", controller.activeDeactiveProduct)
  .get("/listProduct", controller.listProduct)
  .get("/listProductAll", controller.listProductAll)
  .post("/createPaymentOrder", controller.createPaymentOrder)
  .post("/cancelOrder", controller.cancelOrder)
  .post("/returnOrder",controller.returnOrder)
  .use(upload.uploadFile)
  .put("/editProduct", controller.editProduct)
  .post("/addProduct", controller.addProduct);
