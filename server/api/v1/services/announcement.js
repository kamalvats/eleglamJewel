import announcementModel from "../../../models/notification";
import status, { DELETE } from '../../../enums/status';

const announcementServices = {
    createAnnouncement:async(insertObj)=>{
        return await announcementModel(insertObj).save();
    },
    findAnnouncement:async(query)=>{
        return await announcementModel.findOne(query);
    },
    announcementCount: async () => {
      return await announcementModel.countDocuments({
        notificationType: "ANNOUNCEMENT",
        status:{$ne:status.DELETE}
      });
    },
    allAnnouncement:async(query)=>{
        return await announcementModel.find(query);
    },
    updateAnnouncement:async(query,updateObj)=>{
        return await announcementModel.findByIdAndUpdate(query,updateObj,{new:true});
    },
    paginateAnnouncement: async (validatedBody) => {
        let query = { status: { $ne: status.DELETE } ,notificationType : "ANNOUNCEMENT",};
        const { search, fromDate, toDate, page, limit } = validatedBody;
        if (search) {
          query.$or = [
            { title: { $regex: search, $options: 'i' } },
          ]
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
          sort: { createdAt: -1 }
        };
        return await announcementModel.paginate(query, options);
      }
}
module.exports = { announcementServices };