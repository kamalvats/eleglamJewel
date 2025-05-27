import transactionModel from "../../../models/transaction";
import statuse, { ACTIVE } from "../../../enums/status";
import mongoose from "mongoose";
const transactionServices = {
  createTransaction: async (insertObj) => {
    return await transactionModel.create(insertObj);
  },
  graphTransactionAggrigate: async (insertObj) => {
    return await transactionModel.aggregate(insertObj);
  },
  getTransaction: async (obj) => {
    return await transactionModel
      .findOne(obj)
      .populate({ path: "products.productId" })
      .populate({ path: "userId" });
  },
  transactionCount: async (obj) => {
    return await transactionModel.countDocuments(obj);
  },
  updateTransaction: async (query, updateObj) => {
    return await transactionModel.findOneAndUpdate(query, updateObj, {
      new: true,
    });
  },
  findTransactions: async (query) => {
    return await transactionModel.find(query).populate("products.productId");
  },

  transactionPaginateSearch: async (validatedBody) => {
    const {
      search,
      fromDate,
      toDate,
      page,
      limit,
      paymentStatus,
      paymentType,
      deliveryStatus,
      category,
      userId,
      status,
    } = validatedBody;

    // Base pipeline with better product population
    let query = [
      {
        $match: {
          $expr: {
            $cond: [
              { $eq: ["$paymentType", "Pre-Paid"] },
              { $not: { $in: ["$paymentStatus", ["FAILED", "PENDING"]] } },
              true, // Always true if not "Pre-Paid"
            ],
          },
        },
      },
      // Lookup for user data
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userData",
        },
      },
      { $unwind: { path: "$userData", preserveNullAndEmptyArrays: true } },

      // Unwind products array to properly populate each product
      { $unwind: { path: "$products", preserveNullAndEmptyArrays: true } },

      // Lookup for product details
      {
        $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          as: "products.productDetails",
        },
      },
      {
        $unwind: {
          path: "$products.productDetails",
          preserveNullAndEmptyArrays: true,
        },
      },

      // Group back to reconstruct the original document structure
      {
        $group: {
          _id: "$_id",
          root: { $first: "$$ROOT" },
          products: { $push: "$products" },
        },
      },

      // Replace root to merge the grouped data
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: ["$root", { products: "$products" }],
          },
        },
      },

      // Project the final fields
      {
        $project: {
          orderId: 1,
          receipt: 1,
          createdAt: 1,
          updatedAt: 1,
          products: {
            $map: {
              input: "$products",
              as: "product",
              in: {
                productId: "$$product.productId",
                quantity: "$$product.quantity",
                price: "$$product.price",
                productDetails: "$$product.productDetails",
              },
            },
          },
          paymentStatus: 1,
          paymentType: 1,
          amount: 1,
          status: 1,
          orderCreated: 1,
          address: 1,
          deliveryStatus: 1,
          userData: {
            _id: 1,
            email: 1,
            name: 1,
          },
        },
      },
      { $sort: { createdAt: -1 } },
    ];

    // Filter conditions
    if (userId) {
      query.push({
        $match: {
          "userData._id": mongoose.Types.ObjectId(userId),
        },
      });
    }

    if (paymentStatus) {
      query.push({
        $match: { paymentStatus },
      });
    }

    if (paymentType) {
      query.push({
        $match: { paymentType },
      });
    }

    if (deliveryStatus) {
      query.push({
        $match: { deliveryStatus },
      });
    }

    if (status) {
      query.push({
        $match: { status },
      });
    }

    // Search functionality
    if (search) {
      query.push({
        $match: {
          $or: [
            { orderId: { $regex: search, $options: "i" } },
            { receipt: { $regex: search, $options: "i" } },
            { "userData.email": { $regex: search, $options: "i" } },
            { "userData.name": { $regex: search, $options: "i" } },
            {
              "products.productDetails.name": { $regex: search, $options: "i" },
            },
          ],
        },
      });
    }

    // Date filtering
    if (fromDate || toDate) {
      const dateFilter = {};

      if (fromDate) {
        dateFilter.$gte = new Date(fromDate);
      }

      if (toDate) {
        dateFilter.$lte = new Date(new Date(toDate).setHours(23, 59, 59, 999));
      }

      query.push({
        $match: { createdAt: dateFilter },
      });
    }

    // Pagination
    const options = {
      page: Number(page) || 1,
      limit: Number(limit) || 10,
    };

    return await transactionModel.aggregatePaginate(
      transactionModel.aggregate(query),
      options
    );
  },
};

module.exports = {
  transactionServices,
};
