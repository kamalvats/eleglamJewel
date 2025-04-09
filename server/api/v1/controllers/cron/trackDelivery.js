import cron from "node-cron";
import axios from "axios";
import config from "config";
import { transactionServices } from "../../services/transaction";

const { findTransactions, updateTransaction } = transactionServices;

const DELHIVERY_API_URL = config.get("delhiveryUrl");
const DELHIVERY_AUTH = `Token ${config.get("delhiverySecret")}`;
const TRACKING_API_URL = `${DELHIVERY_API_URL}/api/v1/packages/json/`;

/**
 * Fetches the tracking status of a shipment using its waybill number.
 * @param {string} wayBill - The waybill number to track.
 * @returns {string|null} - The latest status of the shipment or null if failed.
 */
const trackShipment = async (wayBill) => {
  try {
    const response = await axios.get(`${TRACKING_API_URL}?waybill=${wayBill}`, {
      headers: {
        Authorization: DELHIVERY_AUTH,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    const trackingData = response.data;

    if (
      trackingData &&
      trackingData.ShipmentData &&
      trackingData.ShipmentData.length > 0
    ) {
      const shipment = trackingData.ShipmentData[0];
      return shipment.Status.Status || null;
    }
    return null;
  } catch (error) {
    console.error(
      `❌ Tracking failed for waybill ${wayBill}:`,
      error.response.data || error.message
    );
    return null;
  }
};

/**
 * Processes transactions and updates their order status based on Delhivery tracking.
 */
const processTransactions = async () => {
  try {
    console.log("🚀 Delhivery Order Tracking Cron Started!");
    const transactions = await findTransactions({
      orderCreated: true,
      status: "PENDING",
    });

    if (transactions.length === 0) return;

    for (const trx of transactions) {
      if (!trx.wayBill) {
        console.warn(
          `⚠️ Skipping Transaction ID: ${trx._id} - Missing waybill`
        );
        continue;
      }

      const orderStatus = await trackShipment(trx.wayBill);

      if (orderStatus) {
        await updateTransaction(
          { _id: trx._id },
          { deliveryStatus: orderStatus }
        );
        if (orderStatus == "Delivered") {
          await updateTransaction(
            { _id: trx._id },
            { status: "COMPLETED", paymentStatus: "COMPLETED" }
          );
        } else if (orderStatus == "RTO") {
          await updateTransaction({ _id: trx._id }, { status: "CANCELLED" });
        }
        console.log(
          `✅ Updated Transaction ID: ${trx._id} - New Status: ${orderStatus}`
        );
      } else {
        console.warn(`⚠️ No status update for Transaction ID: ${trx._id}`);
      }
    }
  } catch (error) {
    console.error("❌ Error processing transactions:", error);
  }
};

// Run the cron job every 10 seconds
cron.schedule("*/1 * * * *", processTransactions);
