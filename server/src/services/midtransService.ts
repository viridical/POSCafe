
import midtransClient from "midtrans-client";
import crypto from "crypto";

interface OrderItem {
  product_id: number | string;
  price: number | string;
  quantity: number | string;
  product_name: string;
}

interface MidtransItem {
  id: string;
  price: number;
  quantity: number;
  name: string;
}

const serverKey = process.env.MIDTRANS_SERVER_KEY;
const clientKey = process.env.MIDTRANS_CLIENT_KEY;

if (!serverKey || !clientKey) {
  throw new Error("MIDTRANS_SERVER_KEY atau MIDTRANS_CLIENT_KEY belum diatur");
}

const isProduction =
  process.env.MIDTRANS_IS_PRODUCTION === "true";

const snap = new midtransClient.Snap({
  isProduction,
  serverKey,
  clientKey
});

const formatItems = (items: OrderItem[]): MidtransItem[] => {
  return items.map((item) => ({
    id: String(item.product_id),
    price: Number(item.price),
    quantity: Number(item.quantity),
    name: String(item.product_name).substring(0, 50)
  }));
};

export const createSnapTransaction = async (
  orderNumber: string,
  amount: number,
  items: OrderItem[]
) => {
  if (!orderNumber || amount <= 0) {
    throw new Error("Nomor pesanan atau nominal transaksi tidak valid");
  }

  const parameter = {
    transaction_details: {
      order_id: orderNumber,
      gross_amount: Math.round(amount)
    },
    item_details: formatItems(items),
    credit_card: {
      secure: true
    }
  };

  return await snap.createTransaction(
    parameter as Parameters<typeof snap.createTransaction>[0]
  );
};

export const createQRIS = async (
  orderNumber: string,
  amount: number,
  items: OrderItem[]
) => {
  if (!orderNumber || amount <= 0) {
    throw new Error("Nomor pesanan atau nominal transaksi tidak valid");
  }

  const credentials = Buffer.from(`${serverKey}:`).toString("base64");

  const response = await fetch(
    `https://api${isProduction ? "" : ".sandbox"}.midtrans.com/v2/charge`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        payment_type: "qris",
        transaction_details: {
          order_id: orderNumber,
          gross_amount: Math.round(amount)
        },
        item_details: formatItems(items),
        qris: {
          acquirer: "gopay"
        }
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.status_message || "Gagal membuat transaksi QRIS"
    );
  }

  return data;
};

export const verifyNotification = (data: {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
}) => {
  const signature = crypto
    .createHash("sha512")
    .update(
      data.order_id +
      data.status_code +
      data.gross_amount +
      serverKey
    )
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(data.signature_key)
  );
};
