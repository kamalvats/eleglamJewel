import { CronJob } from "cron";
import axios from "axios";
import config from "config";
import qs from "qs";
import { transactionServices } from "../../services/transaction";
import { wareHouseServices } from "../../services/warehouse";

const { findTransactions, updateTransaction } = transactionServices;
const { findWareHouse } = wareHouseServices;

const DELHIVERY_API_URL = config.get("delhiveryUrl");
const DELHIVERY_AUTH = `Token ${config.get("delhiverySecret")}`;

/**
 * Fetches a waybill number from Delhivery for a given client name.
 * @param {string} clientName - The registered client name.
 * @returns {string|null} - Waybill number or null if failed.
 */
const fetchWayBill = async (clientName) => {
  try {
    const url = `${DELHIVERY_API_URL}/waybill/api/bulk/json/?cl=${clientName}&token=${config.get("delhiverySecret")}&count=1`;
    const response = await axios.get(url, {
      headers: { Authorization: DELHIVERY_AUTH },
    });
    return response.data || null;
  } catch (error) {
    console.error("❌ Failed to fetch waybill:", error);
    return null;
  }
};

/**
 * Creates an order in Delhivery system.
 * @param {Object} shippingObject - The shipping payload.
 * @returns {boolean} - True if order created, else false.
 */
const createDelhiveryOrder = async (shippingObject) => {
  try {
    const payload = qs.stringify({
      format: "json",
      data: JSON.stringify(shippingObject),
    });

    const response = await axios.post(
      `${DELHIVERY_API_URL}/api/cmu/create.json`,
      payload,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          Authorization: DELHIVERY_AUTH,
        },
      }
    );

    console.log("🚚 Delhivery Order Response:", response.data);
    return response.data.success === true;
  } catch (error) {
    console.error("❌ Order creation failed:", error.response.data || error.message);
    return false;
  }
};

const delhiveryOrderCron = new CronJob("*/1 * * * *", async () => {
  try {
    console.log("🚀 Delhivery Order Creation Cron Started");

    const transactions = await findTransactions({
      orderCreated: false,
      status: "PENDING",
      $or: [{ paymentType: "COD" }, { paymentType: "Pre-Paid", paymentStatus: "COMPLETED" }],
    });

    if (!transactions.length) return;

    const wareHouse = await findWareHouse({});
    if (!wareHouse) {
      console.warn("⚠️ No warehouse found");
      return;
    }

    for (const trx of transactions) {
      const isCod = trx.paymentType === "COD";
      const isPrePaid = trx.paymentType === "Pre-Paid" && trx.paymentStatus === "COMPLETED";

      if (!(isCod || isPrePaid)) continue;

      const orderTitle = trx.products.map(p => p.productTitle).join(", ");

      const wayBill = await fetchWayBill(trx.address.name);
      if (!wayBill) {
        console.warn(`⚠️ Skipping Transaction ${trx._id} - No Waybill`);
        continue;
      }

      const shippingObject = {
        shipments: [
          {
            name: trx.address.name,
            add: trx.address.address,
            pin: trx.address.pinCode,
            city: trx.address.city,
            country: "India",
            phone: trx.address.phone,
            order: orderTitle,
            payment_mode: trx.paymentType,
            cod_amount: isCod ? trx.amount : 0,
            shipment_width: "10",
            shipment_height: "15",
            shipping_mode: "Express",
            waybill: wayBill,
          },
        ],
        pickup_location: {
          name: wareHouse.name,
          add: wareHouse.address,
          city: wareHouse.city,
          pin_code: wareHouse.pin,
          country: wareHouse.country,
          phone: wareHouse.phone,
        },
      };

      const orderCreated = await createDelhiveryOrder(shippingObject);
      if (orderCreated) {
        await updateTransaction(
          { _id: trx._id },
          { wayBill, orderCreated: true }
        );
        console.log(`✅ Order created for Transaction ID: ${trx._id}`);
      }
    }
  } catch (error) {
    console.error("❌ Error processing orders:", error);
  }
});

delhiveryOrderCron.start();
