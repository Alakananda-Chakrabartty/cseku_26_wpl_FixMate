import React from 'react';
import { X, Receipt, Printer, CheckCircle2, ShieldCheck } from 'lucide-react';
import { DigitalReceipt } from '../types.ts';

interface DigitalReceiptModalProps {
  receipt: DigitalReceipt;
  onClose: () => void;
}

export const DigitalReceiptModal: React.FC<DigitalReceiptModalProps> = ({ receipt, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Official Digital Receipt</h2>
              <p className="text-[11px] text-slate-500">FixMate Hyper-Local Platform Transaction</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Content */}
        <div className="p-6 space-y-5 text-xs text-slate-700">
          {/* Status Badge & Receipt ID */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
            <div className="inline-flex items-center gap-1.5 text-emerald-800 font-extrabold text-sm mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Payment Confirmed & Verified
            </div>
            <div className="text-[11px] text-emerald-700 font-mono">
              Receipt ID: #{receipt.receipt_id || receipt.booking_reference}
            </div>
            <div className="text-[10px] text-emerald-600 mt-1">
              Paid via {receipt.payment_method} on {receipt.paid_at ? new Date(receipt.paid_at).toLocaleString() : new Date().toLocaleString()}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">
                Customer Name
              </span>
              <span className="font-bold text-slate-800">{receipt.customer_name || 'Valued Customer'}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">
                Service Provider
              </span>
              <span className="font-bold text-slate-800">{receipt.provider_name}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">
                Service Category
              </span>
              <span className="font-medium text-slate-700">{receipt.service_name}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">
                Booking Date & Time
              </span>
              <span className="font-medium text-slate-700">
                {receipt.booking_date} @ {receipt.time_slot}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">
                Doorstep Service Location
              </span>
              <span className="text-slate-600">{receipt.service_address}</span>
            </div>
          </div>

          {/* Itemized Financial Breakdown */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="bg-slate-100/80 px-4 py-2 font-bold text-slate-800 text-xs border-b border-slate-200">
              Itemized Financial Ledger
            </div>
            <div className="p-4 space-y-2.5">
              <div className="flex justify-between font-semibold text-slate-800">
                <span>Gross Job Service Amount:</span>
                <span>৳{parseFloat(String(receipt.gross_amount)).toFixed(2)} BDT</span>
              </div>

              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Platform Commission ({receipt.commission_percentage}%):</span>
                <span className="text-slate-600">
                  -৳{parseFloat(String(receipt.platform_commission)).toFixed(2)} BDT
                </span>
              </div>

              <div className="flex justify-between text-slate-500 text-[11px] pb-2 border-b border-slate-100">
                <span>Provider Net Payout Earning:</span>
                <span className="text-emerald-700 font-semibold">
                  ৳{parseFloat(String(receipt.net_provider_payout)).toFixed(2)} BDT
                </span>
              </div>

              <div className="flex justify-between font-extrabold text-sm text-slate-900 pt-1">
                <span>Net Amount Paid:</span>
                <span className="text-blue-600">
                  ৳{parseFloat(String(receipt.gross_amount)).toFixed(2)} BDT
                </span>
              </div>
            </div>
          </div>

          {/* Escrow note */}
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Transaction ID: <span className="font-mono text-slate-700">{receipt.transaction_id}</span>
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition cursor-pointer"
          >
            Done
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition cursor-pointer flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
};
