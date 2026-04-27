export async function createQPayInvoice(order) {
  return {
    success: true,
    mode: "demo",
    invoiceId: `DEMO-${Date.now()}`,
    qrText: JSON.stringify({
      type: "demo_qpay",
      amount: order?.totalAmount || 0,
      orderId: order?.id || Date.now()
    }),
    message: "Demo QPay invoice created"
  };
}

export async function checkQPayPayment(invoiceId) {
  return {
    success: true,
    paid: false,
    invoiceId,
    message: "Demo mode: payment is not automatically verified"
  };
}

export async function handleQPayWebhook(payload) {
  return {
    success: true,
    received: true,
    payload
  };
}
