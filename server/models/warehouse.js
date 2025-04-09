const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
var schema = mongoose.Schema;
var wareHouse = new schema(
  {
    name: {
      type: String,
    },
    email: {
      type: String,
    },
    phone: {
      type: String,
    },
    address: {
      type: String,
    },
    city: {
      type: String,
    },
    state: {
      type: String,
    },
    country: {
      type: String,
    },
    pin: {
      type: String,
    },
    return_address: {
      type: String,
    },
    return_pin: {
      type: String,
    },
    return_city: {
      type: String,
    },
    return_state: {
      type: String,
    },
    return_country: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

wareHouse.plugin(mongoosePaginate);
module.exports = mongoose.model("wareHouse", wareHouse);
