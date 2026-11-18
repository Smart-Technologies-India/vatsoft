import { GroupedDailySale } from "@/action/stock/getuserdailysale";

interface PaymentButtonsProps {
  isPaid: boolean;
  isPayVatLoading: boolean;
  isWalletPaymentLoading: boolean;
  walletBalance: number;
  selectedGroup: GroupedDailySale;
  onPayByWallet: () => void;
  onPayOnline: () => void;
  onAddItem?: () => void;
}

export const PaymentButtons: React.FC<PaymentButtonsProps> = ({
  isPaid,
  isPayVatLoading,
  isWalletPaymentLoading,
  walletBalance,
  selectedGroup,
  onPayByWallet,
  onPayOnline,
  onAddItem,
}) => {
  return (
    <div className="flex w-full gap-2">
      <div className="grow"></div>

      {isPaid ? (
        <>
          <div className="text-sm text-green-600 flex items-center gap-2">
            ✅ Payment Successful!
          </div>
          {selectedGroup.records.filter((record) => !record.is_accept).length >
            0 &&
            selectedGroup.records.some(
              (record) => record.invoice_date >= new Date("2026-11-01"),
            ) && (
              <button
                onClick={onAddItem}
                className="text-sm bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white py-1.5 px-4 rounded"
              >
                Add Item
              </button>
            )}
        </>
      ) : (
        <>
          {selectedGroup && walletBalance < selectedGroup.totalVatAmount && (
            <div className="text-xs text-red-600 flex items-center">
              ⚠️ Insufficient wallet balance (₹{walletBalance.toFixed(2)})
            </div>
          )}
          <button
            onClick={onPayByWallet}
            disabled={
              isWalletPaymentLoading ||
              !selectedGroup ||
              walletBalance < selectedGroup.totalVatAmount
            }
            className="text-sm bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white py-1.5 px-4 rounded"
          >
            {isWalletPaymentLoading ? "Processing..." : "Pay Using Wallet"}
          </button>
          <button
            onClick={onPayOnline}
            disabled={isPayVatLoading}
            className="text-sm bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white py-1.5 px-4 rounded"
          >
            {isPayVatLoading ? "Processing..." : "Pay Online"}
          </button>
        </>
      )}
    </div>
  );
};
