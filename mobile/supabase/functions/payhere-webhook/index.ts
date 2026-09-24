// @ts-nocheck

import { createHash } from "node:crypto";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const jsonHeaders = {
  "Content-Type": "application/json",
};

const getSupabaseSecretKey = (): string | null => {
  const rawSecretKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (!rawSecretKeys) {
    return null;
  }

  try {
    const secretKeys = JSON.parse(rawSecretKeys) as Record<string, string>;
    return secretKeys["default"] ?? null;
  } catch {
    return null;
  }
};

const STATUS_MAP: Record<number, "pending" | "paid" | "cancelled" | "failed"> = {
  2: "paid",
  0: "pending",
  "-1": "cancelled",
  "-2": "failed",
  "-3": "failed",
} as Record<number, "pending" | "paid" | "cancelled" | "failed">;

const parseNumberValue = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const parsed = Number(trimmed.replace(/,/g, ""));
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
};

const md5Hex = (value: string): string => createHash("md5").update(value, "utf8").digest("hex");

const errorResponse = (status: number, message: string) =>
  new Response(JSON.stringify({ error: message }), {
    status,
    headers: jsonHeaders,
  });

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return errorResponse(405, "Method not allowed");
    }

    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("application/x-www-form-urlencoded")) {
      return errorResponse(400, "Unsupported content type");
    }

    const formText = await req.text();
    if (!formText) {
      return errorResponse(400, "Missing PayHere payload");
    }

    const fields = new URLSearchParams(formText);
    const merchantId = fields.get("merchant_id")?.trim() ?? "";
    const orderId = fields.get("order_id")?.trim() ?? "";
    const paymentId = fields.get("payment_id")?.trim() ?? "";
    const payhereAmount = fields.get("payhere_amount")?.trim() ?? "";
    const payhereCurrency = fields.get("payhere_currency")?.trim().toUpperCase() ?? "";
    const statusCodeRaw = fields.get("status_code")?.trim() ?? "";
    const md5Signature = fields.get("md5sig")?.trim() ?? "";

    const expectedMerchantId = Deno.env.get("PAYHERE_MERCHANT_ID");
    const merchantSecret = Deno.env.get("PAYHERE_MERCHANT_SECRET");

    if (!expectedMerchantId || !merchantSecret) {
      return errorResponse(500, "Payment gateway configuration missing");
    }

    if (!merchantId || !orderId) {
      return errorResponse(400, "Invalid callback");
    }

    if (merchantId !== expectedMerchantId) {
      return errorResponse(400, "Invalid merchant");
    }

    const normalizedCurrency = payhereCurrency.toUpperCase();
    if (normalizedCurrency !== "LKR") {
      return errorResponse(400, "Unsupported currency");
    }

    const statusCode = Number(statusCodeRaw);
    if (!Number.isInteger(statusCode) || !(statusCode in STATUS_MAP)) {
      return errorResponse(400, "Invalid status");
    }

    const statusName = STATUS_MAP[statusCode];

    if (statusName !== "pending" && !paymentId) {
      return errorResponse(400, "Invalid callback");
    }

    const secretHash = md5Hex(merchantSecret).toUpperCase();
    const generatedSignature = md5Hex(
      `${merchantId}${orderId}${payhereAmount}${payhereCurrency}${statusCodeRaw}${secretHash}`,
    ).toUpperCase();

    if (generatedSignature !== md5Signature.toUpperCase()) {
      return errorResponse(400, "Invalid signature");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseSecret = getSupabaseSecretKey();

    if (!supabaseUrl || !supabaseSecret) {
      return errorResponse(500, "Payment service unavailable");
    }

    const supabase = createClient(supabaseUrl, supabaseSecret, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("id, amount, currency, status, payhere_order_id, payment_id")
      .eq("payhere_order_id", orderId)
      .maybeSingle();

    if (paymentError || !payment) {
      return errorResponse(400, "Payment not found");
    }

    const callbackAmount = parseNumberValue(payhereAmount);
    const storedAmount = parseNumberValue(payment.amount);

    if (callbackAmount === null || storedAmount === null) {
      return errorResponse(400, "Invalid amount");
    }

    if (Math.abs(callbackAmount - storedAmount) > 0.01) {
      return errorResponse(400, "Amount mismatch");
    }

    if (payment.payment_id && payment.payment_id !== paymentId) {
      return errorResponse(400, "Payment mismatch");
    }

    const isDuplicate = Boolean(payment.payment_id && payment.payment_id === paymentId);
    if (isDuplicate) {
      return new Response("OK", { status: 200, headers: { "Content-Type": "text/plain" } });
    }

    const updateFields: {
      payment_id: string | null;
      status: "pending" | "paid" | "cancelled" | "failed";
    } = {
      payment_id: paymentId || null,
      status: statusName,
    };

    const { error: updateError } = await supabase
      .from("payments")
      .update(updateFields)
      .eq("id", payment.id);

    if (updateError) {
      return errorResponse(500, "Payment update failed");
    }

    return new Response("OK", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  } catch {
    return errorResponse(500, "Payment update failed");
  }
});
