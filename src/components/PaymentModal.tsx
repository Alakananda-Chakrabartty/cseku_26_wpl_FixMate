import React, { useState } from 'react';
import {
  X,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Lock,
  AlertCircle,
  Smartphone,
  Receipt,
} from 'lucide-react';
import { Booking, DigitalReceipt } from '../types.ts';
import { api } from '../services/api.ts';

interface PaymentModalProps {
  booking: Booking;
  commissionPercentage?: number;
  onClose: () => void;
  onPaymentSuccess: (receipt: DigitalReceipt) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  booking,
  commissionPercentage = 12.5,
  onClose,
  onPaymentSuccess,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'SSLCommerz' | 'bKash' | 'Nagad'>('bKash');
  const [accountNumber, setAccountNumber] = useState<string>('01819223344');
  const [pinOrOtp, setPinOrOtp] = useState<string>('12345');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const grossAmount = booking.agreed_price;
  const platformFee = Math.round((grossAmount * (commissionPercentage / 100)) * 100) / 100;
  const providerNet = Math.round((grossAmount - platformFee) * 100) / 100;

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setErrorMessage('');

    try {
      const res = await api.checkoutPayment({
        booking_id: booking.id,
        payment_method: paymentMethod,
        account_number: accountNumber,
        notes: `Online checkout for ${booking.booking_reference}`,
      });

      onPaymentSuccess(res.receipt);
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment authorization failed.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900">Secure Online Checkout</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Booking Ref: #{booking.booking_reference}</p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handlePay} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Select Payment Gateway
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                id="select-bkash-btn"
                onClick={() => setPaymentMethod('bKash')}
                className={`p-3 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                  paymentMethod === 'bKash'
                    ? 'border-pink-600 bg-pink-50 text-pink-700 font-bold ring-2 ring-pink-500/20'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Smartphone className="w-4 h-4 text-pink-600" />
                <span className="text-xs">bKash</span>
              </button>

              <button
                type="button"
                id="select-nagad-btn"
                onClick={() => setPaymentMethod('Nagad')}
                className={`p-3 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                  paymentMethod === 'Nagad'
                    ? 'border-orange-600 bg-orange-50 text-orange-700 font-bold ring-2 ring-orange-500/20'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Smartphone className="w-4 h-4 text-orange-600" />
                <span className="text-xs">Nagad</span>
              </button>

              <button
                type="button"
                id="select-ssl-btn"
                onClick={() => setPaymentMethod('SSLCommerz')}
                className={`p-3 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                  paymentMethod === 'SSLCommerz'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold ring-2 ring-blue-500/20'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span className="text-xs">SSLCommerz</span>
              </button>
            </div>
          </div>

          {/* Account / Card Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              {paymentMethod === 'SSLCommerz' ? 'Card / Account Number' : `${paymentMethod} Wallet Mobile Number`}
            </label>
            <input
              id="payment-account-input"
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder={paymentMethod === 'SSLCommerz' ? '4111 2222 3333 4444' : '018XX XXXXXX'}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* PIN / OTP Simulation */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              {paymentMethod === 'SSLCommerz' ? 'CVV / 3D-Secure Code' : `${paymentMethod} Security PIN / OTP`}
            </label>
            <input
              id="payment-pin-input"
              type="password"
              maxLength={6}
              value={pinOrOtp}
              onChange={(e) => setPinOrOtp(e.target.value)}
              placeholder="•••••"
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Transparent Commission Split Breakdown Box */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <div className="font-bold text-slate-900 pb-1.5 border-b border-slate-200 flex items-center justify-between">
              <span>Financial Ledger Breakdown</span>
              <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                FixMate Automated Split
              </span>
            </div>

            <div className="flex justify-between text-slate-600">
              <span>Gross Service Fee:</span>
              <span className="font-bold text-slate-800">৳{grossAmount.toFixed(2)} BDT</span>
            </div>

            <div className="flex justify-between text-slate-500 text-[11px]">
              <span>Platform Commission ({commissionPercentage}%):</span>
              <span>-৳{platformFee.toFixed(2)} BDT</span>
            </div>

            <div className="flex justify-between text-slate-500 text-[11px] pb-1 border-b border-slate-200">
              <span>Provider Net Payout (Escrowed):</span>
              <span className="text-emerald-700 font-semibold">৳{providerNet.toFixed(2)} BDT</span>
            </div>

            <div className="flex justify-between font-extrabold text-sm text-slate-900 pt-1">
              <span>Total Payable Now:</span>
              <span className="text-blue-600">৳{grossAmount.toFixed(2)} BDT</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Escrow Guarantee: Funds held securely until service completion is verified.</span>
          </div>

          {/* Pay Button */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="confirm-pay-now-btn"
              type="submit"
              disabled={isProcessing}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isProcessing ? 'Processing...' : `Pay ৳${grossAmount.toFixed(2)}`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
