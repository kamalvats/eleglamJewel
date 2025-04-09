
import wareHouseModel from "../../../models/warehouse";


const wareHouseServices = {

    createWareHouse: async (insertObj) => {
        return await wareHouseModel.create(insertObj);
    },

    findWareHouse: async (query) => {
        return await wareHouseModel.findOne(query);
    },

    updateWareHouse: async (query, updateObj) => {
        return await wareHouseModel.findOneAndUpdate(query, updateObj, { new: true });
    },

    wareHouseList: async () => {
        return await wareHouseModel.find({}).sort({ createdAt: -1 });
    },

}

module.exports = { wareHouseServices };
