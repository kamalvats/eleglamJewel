
import productModel from "../../../models/product";
import statuss from '../../../enums/status';

const productServices = {

  createProduct: async (insertObj) => {
    return await productModel.create(insertObj);
  },

  findProduct: async (query) => {
    return await productModel.findOne(query);
  },
  findProductAll: async (query) => {
    return await productModel.find(query);
  },
  searchProducts: async (validatedBody) => {
    let query ={ productTitle: { $regex: validatedBody.search, $options: 'i' } ,
    status:statuss.ACTIVE}
    let options = {
      page: Number(validatedBody.page) || 1,
      limit: Number(validatedBody.limit) || 10,
    };
    return await productModel.paginate(query,options);
  },
  productCount: async (query) => {
    return await productModel.countDocuments(query);
  },
  updateProduct: async (query, updateObj) => {
    return await productModel.findOneAndUpdate(query, updateObj, { new: true });
  },

  productCheck: async (userId) => {
    let query = { $and: [{ status: { $ne: statuss.DELETE }, productTitle : userId }] };
    return await productModel.findOne(query);
  },

  updateProductById: async (query, updateObj) => {
    return await productModel.findByIdAndUpdate(query, updateObj, { new: true });
  },

  paginateProduct: async (validatedBody) => {
    let query = { status: { $ne: statuss.DELETE } };
    const { search, fromDate, toDate, page, limit,status ,category,latest,quantity} = validatedBody;
    if (search) {
      query.$or = [
        { productTitle: { $regex: validatedBody.search, $options: 'i' } },
      
    ]
     
  }
    if(status){
      query.status=status
    } 
    if(latest){
      query.latest=latest
    }
    if(category){
      query.category=category
    }
    if(quantity){
      query.quantity={$lte:quantity}
    }
    if (fromDate && !toDate) {
      query.createdAt = { $gte: fromDate };
    }
    if (!fromDate && toDate) {
      query.createdAt = { $lte: toDate };
    }
    if (fromDate && toDate) {
      query.$and = [
        { createdAt: { $gte: fromDate } },
        { createdAt: { $lte: toDate } },
      ]
    }
    let options = {
      page: Number(page) || 1,
      limit: Number(limit) || 10,
    };
    return await productModel.paginate(query, options);
  }

}

module.exports = { productServices };