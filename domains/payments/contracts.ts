export type PaymentStatus =
  | 'Created'
  | 'Awaiting payment'
  | 'Pending'
  | 'Successful'
  | 'Failed'
  | 'Abandoned'
  | 'Reversed'
  | 'Refunded'
  | 'Partially refunded';
export interface Payment {
  id: string;
  ownerId: string;
  amountMinor: number;
  currency: string;
  status: PaymentStatus;
  purpose: 'credits' | 'material';
  materialId?: string;
  credits: number;
  createdAt: string;
  checkedAt?: string;
  providerReference?: string;
  refundedMinor: number;
  refundRequested: boolean;
}
export interface LedgerEntry {
  id: string;
  at: string;
  description: string;
  delta: number;
  balance: number;
  reference: string;
  kind: 'Top-up' | 'Purchase' | 'Refund' | 'Reversal' | 'Expiry';
}
export interface CreditAccount {
  available: number;
  ledger: LedgerEntry[];
  payments: Payment[];
  topUps: { amountMinor: number; credits: number }[];
  customAllowed: boolean;
  currency: string;
  refundRule: string;
  expiryRule: string;
}
export interface PaymentService {
  account(): Promise<CreditAccount>;
  create(input: {
    amountMinor: number;
    purpose: Payment['purpose'];
    materialId?: string;
    idempotencyKey: string;
  }): Promise<Payment>;
  checkout(id: string): Promise<{ payment: Payment; url: string | null; demo: boolean }>;
  check(id: string): Promise<Payment>;
  retry(id: string): Promise<Payment>;
  requestRefund(id: string, reason: string): Promise<Payment>;
  receipt(id: string): Promise<Payment>;
}
