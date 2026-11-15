/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { Drawer, Modal, Radio, RadioChangeEvent } from "antd";
import { toast } from "react-toastify";
import dayjs from "dayjs";

import { TaxtInput } from "@/components/forms/inputfields/textinput";
import { MultiSelect } from "@/components/forms/inputfields/multiselect";
import { onFormError } from "@/utils/methods";

import {
  DailyPurchaseMasterForm,
  DailyPurchaseMasterSchema,
} from "@/schema/daily_purchase";
import { commodity_master, dvat04, tin_number_master } from "@prisma/client";

import GetCommodityMaster from "@/action/commoditymaster/getcommoditymaster";
import GetUserCommodity from "@/action/stock/usercommodity";
import CreateDailyPurchaseAfterAccept from "@/action/stock/createdailypurchaseafteraccept";
import { PayByWalletLiquor } from "@/action/challan/paybywalletliquor";

import { GroupedDailyPurchase } from "@/action/stock/getuserdailypurchase";

type DailyPurchaseFormPostPayment = DailyPurchaseMasterForm;

interface PostPaymentAddItemPurchaseDrawerProps {
  isOpen: boolean;
  selectedGroup: GroupedDailyPurchase | null;
  walletBalance: number;
  dvatData: dvat04 | null | undefined;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

export const PostPaymentAddItemPurchaseDrawer: React.FC<
  PostPaymentAddItemPurchaseDrawerProps
> = ({
  isOpen,
  selectedGroup,
  walletBalance,
  dvatData,
  onClose,
  onSuccess,
}) => {
  if (!selectedGroup || !dvatData) return null;

  return (
    <Drawer
      title="Add Item After Payment"
      placement="left"
      onClose={onClose}
      open={isOpen}
      width={600}
    >
      <PostPaymentAddItemPurchaseForm
        selectedGroup={selectedGroup}
        walletBalance={walletBalance}
        dvatData={dvatData}
        onClose={onClose}
        onSuccess={onSuccess}
        isOpen={isOpen}
      />
    </Drawer>
  );
};

const PostPaymentAddItemPurchaseForm: React.FC<
  PostPaymentAddItemPurchaseDrawerProps
> = ({
  isOpen,
  selectedGroup,
  walletBalance,
  dvatData,
  onClose,
  onSuccess,
}) => {
  const methods = useForm<DailyPurchaseFormPostPayment>({
    resolver: valibotResolver(DailyPurchaseMasterSchema),
    defaultValues: {
      recipient_vat_no: selectedGroup?.seller_tin_number.tin_number ?? "",
      invoice_number: selectedGroup?.invoice_number ?? "",
      invoice_date: dayjs(selectedGroup?.invoice_date).format("YYYY-MM-DD"),
      amount_unit: "",
      description_of_goods: undefined,
      quantity: "",
    },
  });

  return (
    <FormProvider {...methods}>
      <PostPaymentAddItemPurchaseFormContent
        selectedGroup={selectedGroup}
        walletBalance={walletBalance}
        dvatData={dvatData}
        onClose={onClose}
        onSuccess={onSuccess}
        isOpen={isOpen}
      />
    </FormProvider>
  );
};

const PostPaymentAddItemPurchaseFormContent: React.FC<
  PostPaymentAddItemPurchaseDrawerProps
> = ({ selectedGroup, walletBalance, dvatData, onClose, onSuccess }) => {
  const {
    handleSubmit,
    watch,
    formState: { isSubmitting },
    reset,
    getValues,
    setValue,
  } = useFormContext<DailyPurchaseFormPostPayment>();

  const formatAmount = (value: number | string | null | undefined): string => {
    if (value === null || value === undefined) return "0.00";
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    return isNaN(numValue)
      ? "0.00"
      : numValue.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
  };

  const [commodityMaster, setCommodityMaster] = useState<
    Array<commodity_master & { quantity: number }>
  >([]);
  const [commoditymaster, setCommoditymaster] =
    useState<commodity_master | null>(null);
  const [vatamount, setVatAmount] = useState<string>("0");
  const [taxableValue, setTaxableValue] = useState<string>("0");
  const [quantityCount, setQuantityCount] = useState<string>("pcs");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [pendingSubmitData, setPendingSubmitData] =
    useState<DailyPurchaseFormPostPayment | null>(null);
  const [isWalletPaymentProcessing, setIsWalletPaymentProcessing] =
    useState(false);

  useEffect(() => {
    const init = async () => {
      if (!dvatData?.id) return;

      const commodity_response = await GetUserCommodity({
        dvatid: dvatData.id,
      });

      if (commodity_response.status && commodity_response.data) {
        setCommodityMaster(commodity_response.data);
      }

      if (dvatData.commodity === "OIDC") {
        setQuantityCount("crate");
      } else if (dvatData.commodity === "RESTAURANT") {
        setQuantityCount("ml");
      } else {
        setQuantityCount("pcs");
      }
    };

    init();
  }, [dvatData?.id]);

  const description_of_goods = watch("description_of_goods");
  const quantity = watch("quantity");
  const amount_unit = watch("amount_unit");

  useEffect(() => {
    if (description_of_goods == null || description_of_goods == undefined)
      return;

    const init = async () => {
      const commmaster = await GetCommodityMaster({
        id: parseInt(description_of_goods),
      });

      if (commmaster.status && commmaster.data) {
        setCommoditymaster(commmaster.data);
      }
    };

    init();
  }, [description_of_goods]);

  useEffect(() => {
    if (commoditymaster == null || quantity == null || amount_unit == null)
      return;

    const quantityNumeric = Number(quantity);
    const amountUnitNumeric = Number(amount_unit);
    const totalInvoiceNumeric = quantityNumeric * amountUnitNumeric;

    const taxRate = Number(
      (selectedGroup as any)?.records[0]?.tax_percent ?? 0,
    );

    const temp_amount = totalInvoiceNumeric / (1 + taxRate / 100);
    setTaxableValue(isNaN(temp_amount) ? "0" : temp_amount.toFixed(2));

    const calculatedVatAmount = totalInvoiceNumeric - temp_amount;
    setVatAmount(
      isNaN(calculatedVatAmount) ? "0" : calculatedVatAmount.toFixed(2),
    );
  }, [quantity, amount_unit, commoditymaster]);

  const handlePaymentConfirm = async () => {
    if (!pendingSubmitData) return;

    setIsWalletPaymentProcessing(true);

    try {
      console.log(selectedGroup);
      // Charge wallet with isAddItem flag set to true
      const paymentResponse = await PayByWalletLiquor({
        totalAmount: vatamount.toString(),
        invoiceNo: (selectedGroup as any)?.invoice_number ?? "",
        invoiceDate: new Date((selectedGroup as any)?.invoice_date),
        sellerId: (selectedGroup as any)?.seller_tin_id ?? 0,
        isAddItem: true,
      });

      if (!paymentResponse.status) {
        toast.error(
          paymentResponse.message || "Payment failed. Please try again.",
        );
        setIsWalletPaymentProcessing(false);
        return;
      }

      // Create the daily purchase record
      await submitForm(pendingSubmitData);

      setIsPaymentModalOpen(false);
      setPendingSubmitData(null);
    } catch (error: any) {
      toast.error(error.message || "Payment processing failed");
    } finally {
      setIsWalletPaymentProcessing(false);
    }
  };

  const submitForm = async (data: DailyPurchaseFormPostPayment) => {
    if (!dvatData || !commoditymaster || !selectedGroup) return;

    const quantityamount =
      dvatData?.commodity == "OIDC" ||
      dvatData?.commodity == "MANUFACTURER" ||
      dvatData?.commodity == "WHOLESALER"
        ? quantityCount == "crate"
          ? parseInt(data.quantity) * commoditymaster.crate_size
          : parseInt(data.quantity)
        : parseInt(data.quantity);

    const amount_unit_final: string =
      dvatData?.commodity == "OIDC" ||
      dvatData?.commodity == "MANUFACTURER" ||
      dvatData?.commodity == "WHOLESALER"
        ? quantityCount == "crate"
          ? (parseFloat(data.amount_unit) / commoditymaster.crate_size).toFixed(
              2,
            )
          : data.amount_unit
        : data.amount_unit;

    const date = new Date(selectedGroup.invoice_date);

    const response = await CreateDailyPurchaseAfterAccept({
      dvatid: dvatData.id,
      seller_tin_id: selectedGroup.seller_tin_id,
      commodityid: commoditymaster.id,
      invoice_number: selectedGroup.invoice_number,
      invoice_date: date,
      quantity: quantityamount,
      amount_unit: amount_unit_final,
      amount: taxableValue,
      vatamount: vatamount,
      tax_percent:
        (selectedGroup as any)?.records[0]?.tax_percent?.toString() ?? "0",
    });

    if (response.status) {
      toast.success("Item added successfully after payment!");
      reset();
      setCommoditymaster(null);
      setVatAmount("0");
      setTaxableValue("0");
      onClose();
      await onSuccess();
      window.location.reload();
    } else {
      toast.error(response.message || "Failed to add item");
    }
  };

  const onSubmit = async (data: DailyPurchaseFormPostPayment) => {
    // Check wallet balance
    if (walletBalance < parseFloat(vatamount)) {
      return toast.error(
        `Insufficient wallet balance. Available: ₹${walletBalance.toFixed(2)}, Required: ₹${parseFloat(vatamount).toFixed(2)}`,
      );
    }

    setPendingSubmitData(data);
    setIsPaymentModalOpen(true);
  };

  return (
    <>
      <form
        onSubmit={handleSubmit(onSubmit, onFormError)}
        className="space-y-4 pb-20"
      >
        {/* Read-only Invoice Info */}
        <div className="space-y-2 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-xs font-semibold text-blue-600 uppercase">
            Invoice Information
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-xs text-gray-600">Seller TIN</p>
              <p className="font-semibold">
                {selectedGroup?.seller_tin_number.tin_number}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Invoice Number</p>
              <p className="font-semibold">{selectedGroup?.invoice_number}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Invoice Date</p>
              <p className="font-semibold">
                {dayjs(selectedGroup?.invoice_date).format("DD/MM/YYYY")}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Tax Rate</p>
              <p className="font-semibold">
                {selectedGroup?.records[0]?.tax_percent ?? 0}%
              </p>
            </div>
          </div>
        </div>

        {/* Item Selection */}
        <div>
          <MultiSelect<DailyPurchaseFormPostPayment>
            placeholder="Select item to add"
            name="description_of_goods"
            required={true}
            title="Select Item"
            options={commodityMaster.map((val) => ({
              value: val.id.toString(),
              label:
                val.product_name +
                ` [${val.quantity} ${
                  dvatData?.commodity == "RESTAURANT"
                    ? "mL"
                    : val.product_type == "FUEL"
                      ? "Litre"
                      : "PCS"
                }]`,
            }))}
          />
        </div>

        {/* Quantity */}
        <div>
          <TaxtInput<DailyPurchaseFormPostPayment>
            title="Quantity"
            required={true}
            name="quantity"
            placeholder="Enter quantity"
            onlynumber={true}
          />
        </div>

        {/* Quantity Type Toggle (for OIDC/MANUFACTURER/WHOLESALER) */}
        {(dvatData?.commodity === "OIDC" ||
          dvatData?.commodity === "MANUFACTURER" ||
          dvatData?.commodity === "WHOLESALER") &&
          commoditymaster && (
            <div className="flex gap-2 items-center">
              <div className="p-1 rounded grow text-center bg-gray-100 text-sm">
                {commoditymaster.crate_size} Pcs/Crate
              </div>
              <Radio.Group
                size="small"
                onChange={(e: RadioChangeEvent) =>
                  setQuantityCount(e.target.value)
                }
                value={quantityCount}
                optionType="button"
              >
                <Radio.Button className="w-20 text-center" value="crate">
                  Crate
                </Radio.Button>
                <Radio.Button className="w-20 text-center" value="pcs">
                  Pcs
                </Radio.Button>
              </Radio.Group>
            </div>
          )}

        {/* Amount Unit */}
        <div>
          <TaxtInput<DailyPurchaseFormPostPayment>
            placeholder="Enter amount per unit (Purchase price including VAT)"
            name="amount_unit"
            required={true}
            title="Amount per Unit (Incl. VAT)"
            numdes={true}
          />
        </div>

        {/* Summary */}
        <div className="space-y-2 p-3 bg-gray-100 rounded">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total Invoice Value:</span>
            <span className="font-semibold">
              {formatAmount(
                (Number(quantity) || 0) * (Number(amount_unit) || 0),
              )}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Taxable Value:</span>
            <span className="font-semibold">{formatAmount(taxableValue)}</span>
          </div>
          <div className="flex justify-between text-sm border-t pt-2 font-semibold">
            <span>VAT Amount:</span>
            <span className="text-green-600">{formatAmount(vatamount)}</span>
          </div>
        </div>

        {/* Wallet Balance Warning */}
        <div className="space-y-2 p-3 bg-amber-50 border border-amber-200 rounded">
          <p className="text-xs text-amber-700 font-semibold">
            💳 Wallet Balance: ₹
            {walletBalance.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          {walletBalance < parseFloat(vatamount) && (
            <p className="text-xs text-red-600 font-semibold">
              ⚠️ Insufficient balance. Required: ₹
              {parseFloat(vatamount).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 rounded bg-gray-300 text-gray-800 font-medium cursor-pointer hover:bg-gray-400 flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={
              isSubmitting ||
              walletBalance < parseFloat(vatamount) ||
              !commoditymaster
            }
            className="py-2 px-4 rounded bg-green-600 text-white font-medium cursor-pointer hover:bg-green-700 disabled:opacity-50 flex-1"
          >
            {isSubmitting ? "Processing..." : "Pay & Add Item"}
          </button>
        </div>
      </form>

      {/* Payment Confirmation Modal */}
      <Modal
        title="Confirm Wallet Payment"
        open={isPaymentModalOpen}
        onOk={handlePaymentConfirm}
        onCancel={() => {
          if (!isWalletPaymentProcessing) {
            setIsPaymentModalOpen(false);
            setPendingSubmitData(null);
          }
        }}
        okText="Confirm & Pay"
        cancelText="Cancel"
        okButtonProps={{
          danger: true,
          loading: isWalletPaymentProcessing,
        }}
        cancelButtonProps={{
          disabled: isWalletPaymentProcessing,
        }}
        width={500}
      >
        <div className="space-y-4 py-3">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-xs text-blue-600 font-semibold mb-2">
              💳 CURRENT WALLET BALANCE
            </p>
            <p className="text-2xl font-bold text-blue-900">
              ₹
              {walletBalance.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>

          <div className="p-3 bg-green-50 border border-green-200 rounded">
            <p className="text-xs text-green-600 font-semibold mb-2">
              💰 PAYMENT AMOUNT (VAT FOR NEW ITEM)
            </p>
            <p className="text-2xl font-bold text-green-900">
              ₹
              {parseFloat(vatamount).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded">
            <p className="text-xs text-amber-700 font-semibold mb-2">
              📋 AFTER PAYMENT
            </p>
            <p className="text-sm text-amber-900">
              New Balance: ₹
              {(walletBalance - parseFloat(vatamount)).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
};
