type PaystackInitializePayload = {
  email: string;
  amount: number;
  reference: string;
  metadata?: Record<string, unknown>;
};

export async function initializePaystackTransaction({
  email,
  amount,
  reference,
  metadata,
}: PaystackInitializePayload) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured.");
  }

  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      amount: Math.round(amount * 100),
      reference,
      channels: ["card", "bank", "ussd", "qr", "mobile_money"],
      metadata,
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.status) {
    throw new Error(data.message ?? "Paystack initialization failed.");
  }

  return data.data;
}

export async function verifyPaystackTransaction(reference: string) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured.");
  }

  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok || !data.status) {
    throw new Error(data.message ?? "Paystack verification failed.");
  }

  return data.data;
}
