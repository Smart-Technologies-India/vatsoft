import { Modal } from "antd";
import { GroupedDailySale } from "@/action/stock/getuserdailysale";
import { formateDate } from "@/utils/methods";

interface WalletPaymentModalProps {
  isOpen: boolean;
  isLoading: boolean;
  walletBalance: number;
  selectedGroup: GroupedDailySale | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const WalletPaymentModal: React.FC<WalletPaymentModalProps> = ({
  isOpen,
  isLoading,
  walletBalance,
  selectedGroup,
  onConfirm,
  onCancel,
}) => {
  if (!selectedGroup) return null;

  return (
    <Modal
      title="Confirm Wallet Payment"
      open={isOpen}
      onOk={onConfirm}
      onCancel={onCancel}
      okText="Confirm Payment"
      cancelText="Cancel"
      okButtonProps={{
        danger: true,
        loading: isLoading,
      }}
      cancelButtonProps={{
        disabled: isLoading,
      }}
      width={500}
    >
      <div className="space-y-4 py-3">
        {/* Wallet Balance Info */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-xs text-blue-600 font-semibold mb-2">
            💳 WALLET BALANCE
          </p>
          <p className="text-2xl font-bold text-blue-900">
            ₹
            {walletBalance.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>

        {/* Payable Amount Info */}
        <div className="p-3 bg-green-50 border border-green-200 rounded">
          <p className="text-xs text-green-600 font-semibold mb-2">
            💰 PAYABLE AMOUNT (VAT)
          </p>
          <p className="text-2xl font-bold text-green-900">
            ₹
            {selectedGroup.totalVatAmount.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>

        {/* Invoice Details */}
        <div className="p-3 bg-gray-50 border border-gray-200 rounded">
          <p className="text-xs text-gray-600 font-semibold mb-3">
            📋 INVOICE DETAILS
          </p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-500">Invoice Number</p>
              <p className="font-semibold text-gray-900">
                {selectedGroup.invoice_number}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Invoice Date</p>
              <p className="font-semibold text-gray-900">
                {formateDate(selectedGroup.invoice_date)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Purchaser</p>
              <p className="font-semibold text-gray-900">
                {selectedGroup.seller_tin_number.name_of_dealer}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Tax Rate</p>
              <p className="font-semibold text-gray-900">
                {selectedGroup.records[0]?.tax_percent || "N/A"}%
              </p>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded">
          <p className="text-xs text-amber-700 font-semibold">
            ⚠️ After confirming, ₹
            {selectedGroup.totalVatAmount.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            will be deducted from your wallet.
          </p>
          <p className="text-xs text-amber-700 mt-2">
            New wallet balance will be: ₹
            {(walletBalance - selectedGroup.totalVatAmount).toLocaleString(
              "en-IN",
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              },
            )}
          </p>
        </div>
      </div>
    </Modal>
  );
};
