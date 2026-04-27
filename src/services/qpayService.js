export async function createQPayInvoice(order = {}) {
  const invoiceId = `DEMO-${Date.now()}`;
  const amount = Number(order?.totalAmount || order?.amount || 0);

  return {
    success: true,
    mode: "demo",
    invoiceId,
    qrText: JSON.stringify({
      type: "demo_qpay",
      amount,
      orderId: order?.id || invoiceId,
    }),
    paymentUrl: "https://qpay.mn",
    message: "Demo QPay invoice created",
  };
}

export async function checkQPayPayment(invoiceId) {
  return {
    success: true,
    paid: false,
    invoiceId,
    message: "Demo mode: payment is not automatically verified",
  };
}

export async function handleQPayWebhook(payload) {
  return {
    success: true,
    received: true,
    payload,
  };
}
