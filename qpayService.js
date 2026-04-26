// QPay integration boundary.
// Real QPay Live payments must be implemented in a backend or serverless function.
// Never place merchant credentials, client secrets, access tokens, or webhook secrets
// in frontend React code. The frontend should call your backend, and the backend
// should call QPay with credentials from environment variables.

export async function createQPayInvoice(order, paymentMode = "demo") {
  if (paymentMode !== "live") {
    return {
      mode: "demo",
      invoiceId: `demo-${order.id}`,
      qrPayload: JSON.stringify({
        provider: "QPay Demo",
        orderId: order.id,
        amount: order.totalAmount,
        currency: "MNT",
      }),
      paymentUrl: `${window.location.origin}/ticket/${order.id}`,
    };
  }

  throw new Error(
    "QPay Live requires a backend/serverless endpoint with merchant credentials in environment variables."
  );
}

export async function checkQPayPayment(invoiceId, paymentMode = "demo") {
  if (paymentMode !== "live") {
    return { invoiceId, paid: false, mode: "demo" };
  }

  throw new Error(
    "QPay Live payment checks must be performed by a backend/serverless endpoint."
  );
}

export async function handleQPayWebhook(payload) {
  // Webhooks cannot be handled safely in frontend code.
  // Implement this in your backend/serverless function and validate QPay signatures there.
  return {
    received: Boolean(payload),
    handled: false,
    reason: "Frontend placeholder only. Use backend/serverless webhook handler.",
  };
}
