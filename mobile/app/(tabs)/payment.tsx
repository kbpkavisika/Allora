import { PaymentScreen } from '@/components/payment/PaymentScreen';

const DEVELOPMENT_PAYMENT_REQUEST = {
	amount: 2500,
	currency: 'LKR',
	orderId: 'TEST-ORDER-001',
	description: 'Development payment',
} as const;

export default function PaymentTabScreen() {
	return <PaymentScreen request={DEVELOPMENT_PAYMENT_REQUEST} />;
}