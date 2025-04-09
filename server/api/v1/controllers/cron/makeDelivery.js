import cron from "node-cron";
import axios from "axios";
import config from "config"; // Ensure config is imported
import { transactionServices } from "../../services/transaction";
import { userServices } from "../../services/user";
const { findTransactions, updateTransaction } = transactionServices;
const { findUser } = userServices;
import { wareHouseServices } from "../../services/warehouse";
const { findWareHouse } = wareHouseServices;
import { productServices } from "../../services/product";
const { findProduct, updateProduct } = productServices;
const DELHIVERY_API_URL = config.get("delhiveryUrl");
const DELHIVERY_AUTH = `Token ${config.get("delhiverySecret")}`;

// Function to fetch waybill number if needed
const fetchWayBill = async (name) => {
  try {
    const url = `${DELHIVERY_API_URL}?cl=${name}&count=1`;
    const response = await axios.get(url, {
      headers: { Authorization: DELHIVERY_AUTH },
    });
    return response.data.status === 200 ? response.data.wayBill : null;
  } catch (error) {
    console.error(
      "❌ Failed to fetch waybill:",
      error.response.data || error.message
    );
    return null;
  }
};

// Function to create a Delhivery order
const createDelhiveryOrder = async (shippingObject) => {
  try {
    const payload = { format: "json", data: JSON.stringify(shippingObject) };
    const response = await axios.post(
      `${DELHIVERY_API_URL}/api/cmu/create.json`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: DELHIVERY_AUTH,
        },
      }
    );
    return response.data.status === 200;
  } catch (error) {
    console.error(
      "❌ Order creation failed:",
      error.response.data || error.message
    );
    return false;
  }
};

const processTransactions = async () => {
  try {
    console.log("🚀 Delhivery Order Cron Started!");
    const transactions = await findTransactions({
      orderCreated: false,
      status: "PENDING",
    });

    if (transactions.length === 0) return;
    let wareHouse = await findWareHouse({});
    if (wareHouse) {
      for (const trx of transactions) {
        if (
          trx.paymentType === "COD" ||
          (trx.paymentType === "Pre-Paid" && trx.paymentStatus === "COMPLETED")
        ) {
          let orderTitle = trx.products.map((p) => p.productTitle).join(", ");

          let shippingObject = {
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
                cod_amount: trx.paymentType === "COD" ? trx.amount : 0,
                shipment_width: "10",
                shipment_height: "15",
                shipping_mode: "Express",
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

          let wayBill = await fetchWayBill(trx.address.name);
          if (wayBill) {
            shippingObject.wayBill = wayBill;
          }

          const orderCreated = await createDelhiveryOrder(shippingObject);
          if (orderCreated) {
            await updateTransaction(
              { _id: trx._id },
              { wayBill: wayBill, orderCreated: true }
            );
            for (let i = 0; i < trx.products.length; i++) {
              let product = await findProduct({
                _id: trx.products[i].productId,
              });
              if (product) {
                let quantity = product.stock - trx.products[i].quantity;
                await updateProduct(
                  { _id: product._id },
                  { quantity: quantity > 0 ? quantity : 0 }
                );
              }
            }
            console.log(
              `✅ Order created successfully for Transaction ID: ${trx._id}`
            );
          }
        }
      }
    }
  } catch (error) {
    console.error("❌ Error processing transactions:", error);
  }
};

// Run the cron job every 10 seconds
cron.schedule("*/10 * * * * *", processTransactions);
