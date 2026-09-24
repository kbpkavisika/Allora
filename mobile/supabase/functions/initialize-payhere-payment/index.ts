// @ts-nocheck

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

type PaymentInitRequest = {
  amount?: number | string;
  currency?: string;
};

const parseAmount = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const parsed = Number(trimmed);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
};

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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse(401, "Unauthorized");
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

    const token = authHeader.replace("Bearer ", "").trim();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return errorResponse(401, "Unauthorized");
    }

    let body: PaymentInitRequest;
    try {
      body = (await req.json()) as PaymentInitRequest;
    } catch {
      return errorResponse(400, "Invalid request");
    }

    if (!body || typeof body !== "object") {
      return errorResponse(400, "Invalid request");
    }

    const amount = parseAmount(body.amount);
    if (amount === null) {
      return errorResponse(400, "Invalid amount");
    }

    const currency = typeof body.currency === "string" ? body.currency.trim().toUpperCase() : "";
    if (currency !== "LKR") {
      return errorResponse(400, "Currency must be LKR");
    }

    const payhereOrderId = `CART-${Date.now()}-${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;

    const { data, error } = await supabase
      .from("payments")
      .insert({
        buyer_id: user.id,
        payhere_order_id: payhereOrderId,
        payment_id: null,
        amount,
        currency,
        status: "pending",
        payment_method: "payhere",
        receipt_sent: false,
        receipt_sent_at: null,
      })
      .select("id, payhere_order_id, amount, currency")
      .single();

    if (error || !data) {
      return errorResponse(500, "Payment creation failed");
    }

    return new Response(
      JSON.stringify({
        paymentId: data.id,
        payHereOrderId: data.payhere_order_id,
        amount: Number(data.amount),
        currency: data.currency,
      }),
      {
        status: 200,
        headers: jsonHeaders,
      },
    );
  } catch {
    return errorResponse(500, "Payment creation failed");
  }
});
