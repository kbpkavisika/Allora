import PayHere from '@payhere/payhere-mobilesdk-reactnative';

import type { CartLine } from '@/lib/cart';
import type { Address } from '@/lib/profile';

export type PaymentOutcomeStatus = 'completed' | 'failed' | 'cancelled';

export interface PayHereCheckoutInput {
  orderId: string;
  amountLkr: number;
  lines: CartLine[];
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  address: Address;
}

export interface PaymentOutcome {
  status: PaymentOutcomeStatus;
  orderId: string;
  paymentId?: string;
  error?: string;
}

function buildItemsDescription(lines: CartLine[]) {
  return lines.map(({ product, quantity }) => `${product.name} x ${quantity}`).join(', ');
}

export async function startPayHereCheckout({
  orderId,
  amountLkr,
  lines,
  customer,
  address,
}: PayHereCheckoutInput): Promise<PaymentOutcome> {
  const merchantId = process.env.EXPO_PUBLIC_PAYHERE_MERCHANT_ID;
  const notifyUrl = process.env.EXPO_PUBLIC_PAYHERE_NOTIFY_URL;

  if (!merchantId || !notifyUrl) {
    return {
      status: 'failed',
      orderId,
      error: 'PayHere is not configured. Please try again later.',
    };
  }

  return new Promise((resolve) => {
    try {
      const paymentObject = {
        sandbox: true,
        merchant_id: merchantId,
        notify_url: notifyUrl,
        order_id: orderId,
        items: buildItemsDescription(lines),
        amount: amountLkr.toFixed(2),
        currency: 'LKR',
        first_name: customer.firstName,
        last_name: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        address: address.line1,
        city: address.city,
        country: address.country,
        delivery_address: [address.line1, address.line2].filter(Boolean).join(', '),
        delivery_city: address.city,
        delivery_country: address.country,
      };

      console.log('[PayHere] starting', {
        sandbox: paymentObject.sandbox,
        orderId: paymentObject.order_id,
        amount: paymentObject.amount,
        currency: paymentObject.currency,
        merchantIdPresent: Boolean(merchantId),
        notifyUrlPresent: Boolean(notifyUrl),
        emailPresent: Boolean(paymentObject.email),
        phonePresent: Boolean(paymentObject.phone),
        firstNamePresent: Boolean(paymentObject.first_name),
        lastNamePresent: Boolean(paymentObject.last_name),
        addressPresent: Boolean(paymentObject.address),
        cityPresent: Boolean(paymentObject.city),
        country: paymentObject.country,
      });

      PayHere.startPayment(
        paymentObject,
        (paymentId: string) => {
          console.log('[PayHere] completed', { paymentIdPresent: Boolean(paymentId) });
          resolve({ status: 'completed', orderId, paymentId });
        },
        (error: unknown) => {
          console.error('[PayHere] error', error);
          resolve({
            status: 'failed',
            orderId,
            error: typeof error === 'string' ? error : 'PayHere payment failed.',
          });
        },
        () => {
          console.log('[PayHere] dismissed');
          resolve({ status: 'cancelled', orderId });
        }
      );
    } catch {
      resolve({ status: 'failed', orderId, error: 'Could not start PayHere payment.' });
    }
  });
}
