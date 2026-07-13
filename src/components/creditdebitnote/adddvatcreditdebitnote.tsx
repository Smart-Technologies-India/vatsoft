"use client";

import CreateDvatCreditDebitNote from "@/action/creditdebitnote/createdvatcreditdebitnote";
import AllCommodityMaster from "@/action/commoditymaster/allcommoditymaster";
import { MultiSelect } from "@/components/forms/inputfields/multiselect";
import { TaxtInput } from "@/components/forms/inputfields/textinput";
import { DateSelect } from "@/components/forms/inputfields/dateselect";
import { commodity_master, dvat04 } from "@prisma/client";
import { Button, Drawer } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { toast } from "react-toastify";
import GetUserDvat04 from "@/action/dvat/getuserdvat";
import GetAllDvat04 from "@/action/dvat/getalldvat";

type CreditDebitNoteFormValues = {
  invoice_number: string;
  invoice_date: string;
  commodity_master_id?: string;
  seller_tin_number_id?: string;
  quantity: string;
  amount_unit: string;
  tax_percent: string;
  amount: string;
  vatamount: string;
  invoice_amount: string;
  is_purchase: string;
  is_credit: string;
  is_goods_returned: string;
  creditnote_no: string;
  creditnote_date: string;
};

type AddDvatCreditDebitNoteProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
  mode?: "credit" | "debit" | "goods-return";
};

const formatCurrency = (value: number) => {
  return Number.isFinite(value) ? value.toFixed(2) : "0.00";
};

const AddDvatCreditDebitNote = ({
  open,
  onClose,
  onCreated,
  mode = "credit",
}: AddDvatCreditDebitNoteProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dvatData, setDvatData] = useState<dvat04>();
  const [allDvatData, setAllDvatData] = useState<dvat04[]>([]);
  const [commodities, setCommodities] = useState<commodity_master[]>([]);
  const [noteMode, setNoteMode] = useState<"credit" | "debit" | "goods-return">(
    mode,
  );

  const methods = useForm<CreditDebitNoteFormValues>({
    defaultValues: {
      invoice_number: "",
      invoice_date: "",
      commodity_master_id: undefined,
      seller_tin_number_id: undefined,
      quantity: "1",
      amount_unit: "Litres",
      tax_percent: "0",
      amount: "0",
      vatamount: "0",
      invoice_amount: "0",
      is_purchase: "false",
      is_credit: mode === "credit" ? "true" : "false",
      is_goods_returned: mode === "goods-return" ? "true" : "false",
      creditnote_no: "",
      creditnote_date: "",
    },
  });

  const { handleSubmit, reset, setValue, watch } = methods;

  const amount = parseFloat(watch("amount") || "0");
  const vatamount = parseFloat(watch("vatamount") || "0");
  const invoiceAmount = amount + vatamount;

  const selectedCommodityId = watch("commodity_master_id");
  const quantity = parseFloat(watch("quantity") || "0");

  // Set tax_percent from commodity
  useEffect(() => {
    if (selectedCommodityId) {
      const commodity = commodities.find(
        (c) => c.id.toString() === selectedCommodityId,
      );
      if (commodity && commodity.taxable_at) {
        setValue("tax_percent", commodity.taxable_at);
      }
    }
  }, [selectedCommodityId, commodities, setValue]);

  // Calculate amount_unit from invoice_amount / quantity
  useEffect(() => {
    if (invoiceAmount > 0 && quantity > 0) {
      const calculatedUnit = invoiceAmount / quantity;
      setValue("amount_unit", calculatedUnit.toFixed(2));
    }
  }, [invoiceAmount, quantity, setValue]);

  useEffect(() => {
    setValue("invoice_amount", invoiceAmount.toString());
  }, [amount, vatamount, setValue, invoiceAmount]);

  const resetForm = useCallback(() => {
    reset({
      invoice_number: "",
      invoice_date: "",
      commodity_master_id: undefined,
      seller_tin_number_id: undefined,
      quantity: "1",
      amount_unit: "Litres",
      tax_percent: "0",
      amount: "0",
      vatamount: "0",
      invoice_amount: "0",
      is_purchase: "false",
      is_credit: noteMode === "credit" ? "true" : "false",
      is_goods_returned: noteMode === "goods-return" ? "true" : "false",
      creditnote_no: "",
      creditnote_date: "",
    });
  }, [reset, noteMode]);

  useEffect(() => {
    setNoteMode(mode);
  }, [mode]);

  const handleClose = () => {
    onClose();
    resetForm();
  };

  useEffect(() => {
    const init = async () => {
      const dvatResponse = await GetUserDvat04();
      if (dvatResponse.status && dvatResponse.data) {
        setDvatData(dvatResponse.data);

        const commodityResponse = await AllCommodityMaster({});
        if (commodityResponse.status && commodityResponse.data) {
          if (dvatResponse.data.commodity == "FUEL") {
            setCommodities(
              commodityResponse.data.filter((c) => c.product_type == "FUEL"),
            );
          } else if (dvatResponse.data.commodity == "LIQUOR") {
            setCommodities(
              commodityResponse.data.filter(
                (c) => c.product_type == "RESTAURANT",
              ),
            );
          }
        }
      }
      const allDvatResponse = await GetAllDvat04({});
      if (allDvatResponse.status && allDvatResponse.data) {
        setAllDvatData(allDvatResponse.data);
      }
    };
    init();
  }, []);

  const commodityOptions = useMemo(() => {
    return commodities.map((commodity) => ({
      value: commodity.id.toString(),
      label: `${commodity.product_name}`,
    }));
  }, [commodities]);

  const dvatOptions = useMemo(() => {
    return allDvatData.map((dvat) => ({
      value: dvat.id.toString(),
      label: `${dvat.tinNumber} - ${dvat.tradename}`,
    }));
  }, [allDvatData]);

  const handleCreateNote = async (data: CreditDebitNoteFormValues) => {
    if (!data.commodity_master_id) {
      toast.error("Please select a commodity.");
      return;
    }

    if (!data.seller_tin_number_id) {
      toast.error("Please select a seller TIN number.");
      return;
    }

    if (!data.invoice_number?.trim()) {
      toast.error("Invoice number is required.");
      return;
    }

    if (!data.creditnote_no?.trim()) {
      toast.error("Credit/Debit note number is required.");
      return;
    }

    const parsedInvoiceDate = new Date(data.invoice_date);
    const parsedCreditNoteDate = new Date(data.creditnote_date);

    if (Number.isNaN(parsedInvoiceDate.getTime())) {
      toast.error("Invoice date is invalid.");
      return;
    }

    if (Number.isNaN(parsedCreditNoteDate.getTime())) {
      toast.error("Credit/Debit note date is invalid.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await CreateDvatCreditDebitNote({
        invoice_number: data.invoice_number,
        invoice_date: parsedInvoiceDate,
        commodity_master_id: Number.parseInt(data.commodity_master_id, 10),
        seller_tin_number_id: Number.parseInt(data.seller_tin_number_id, 10),
        quantity: Number.parseInt(data.quantity || "0", 10),
        amount_unit: data.amount_unit,
        tax_percent: data.tax_percent,
        amount: data.amount,
        vatamount: data.vatamount,
        invoice_amount: data.invoice_amount,
        is_purchase: data.is_purchase === "true",
        is_credit: data.is_credit === "true",
        is_goods_returned: data.is_goods_returned === "true",
        creditnote_no: data.creditnote_no,
        creditnote_date: parsedCreditNoteDate,
      });

      if (response.status) {
        toast.success(
          response.message || "Credit/Debit note created successfully.",
        );
        handleClose();
        onCreated?.();
      } else {
        toast.error(response.message || "Failed to create credit/debit note.");
      }
    } catch (error) {
      toast.error("An error occurred while creating credit/debit note.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const titleMap = {
    credit: "Add Credit Note",
    debit: "Add Debit Note",
    "goods-return": "Add Goods Return",
  };

  return (
    <Drawer
      title={titleMap[noteMode] || "Add Credit/Debit Note"}
      placement="right"
      open={open}
      onClose={handleClose}
      size={700}
    >
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(handleCreateNote)} className="space-y-3">
          <div className="space-y-1">
            <TaxtInput<CreditDebitNoteFormValues>
              name="invoice_number"
              title="Original Invoice Number"
              placeholder="Enter invoice number"
              required={true}
            />
          </div>

          <div className="space-y-1">
            <DateSelect<CreditDebitNoteFormValues>
              name="invoice_date"
              title="Invoice Date"
              placeholder="Select date"
              required={true}
              format="DD/MM/YYYY"
            />
          </div>

          <div className="space-y-1">
            <MultiSelect<CreditDebitNoteFormValues>
              name="commodity_master_id"
              title="Product/Commodity"
              placeholder="Select product"
              required={true}
              options={commodityOptions}
            />
          </div>

          {/* Hidden field for seller_tin_number_id */}
          <MultiSelect<CreditDebitNoteFormValues>
            name="seller_tin_number_id"
            title="Seller TIN Number"
            placeholder="Select seller"
            required={true}
            options={dvatOptions}
          />

          <div className="space-y-1">
            <TaxtInput<CreditDebitNoteFormValues>
              name="quantity"
              title="Quantity"
              placeholder="Enter quantity"
              required={true}
              numdes={true}
            />
          </div>

          {/* Hidden field - amount_unit is calculated from invoice_amount/quantity */}
          <div className="hidden">
            <TaxtInput<CreditDebitNoteFormValues>
              name="amount_unit"
              title="Amount Unit"
              placeholder="e.g., Litres"
              required={true}
            />
          </div>

          {/* Hidden field - tax_percent is auto-populated from commodity */}
          <div className="hidden">
            <TaxtInput<CreditDebitNoteFormValues>
              name="tax_percent"
              title="Tax Percentage (%)"
              placeholder="Enter tax percent"
              required={true}
              numdes={true}
            />
          </div>

          <div className="space-y-1">
            <TaxtInput<CreditDebitNoteFormValues>
              name="amount"
              title="Taxable Amount"
              placeholder="Enter amount"
              required={true}
              numdes={true}
            />
          </div>

          <div className="space-y-1">
            <TaxtInput<CreditDebitNoteFormValues>
              name="vatamount"
              title="VAT Amount"
              placeholder="Enter VAT amount"
              required={true}
              numdes={true}
            />
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-2">
            <p className="text-xs text-gray-700">
              <strong>Total Invoice Amount: </strong>
              {formatCurrency(invoiceAmount)}
            </p>
          </div>

          <div className="space-y-1">
            <TaxtInput<CreditDebitNoteFormValues>
              name="creditnote_no"
              title="Credit/Debit Note Number"
              placeholder="Enter credit/debit note number"
              required={true}
            />
          </div>

          <div className="space-y-1">
            <DateSelect<CreditDebitNoteFormValues>
              name="creditnote_date"
              title="Credit/Debit Note Date"
              placeholder="Select date"
              required={true}
              format="DD/MM/YYYY"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={isSubmitting}>
              Create Note
            </Button>
          </div>
        </form>
      </FormProvider>
    </Drawer>
  );
};

export default AddDvatCreditDebitNote;
