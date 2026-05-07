"use client";

import { Dispatch, SetStateAction } from "react";
import { toast } from "react-toastify";
import { formateDate, onFormError } from "@/utils/methods";
import { GroupedDailyPurchase } from "@/action/stock/getuserdailypurchase";
import CreatePurchaseDebitNote from "@/action/return/createpurchasedebitnote";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { PurchaseDebitNoteForm, PurchaseDebitNoteSchema } from "@/schema/purchasedebitnote";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { TaxtInput } from "../inputfields/textinput";
import { DateSelect } from "../inputfields/dateselect";

type PurchaseDebitNoteDrawerProps = {
  group: GroupedDailyPurchase;
  dvat04Id: number;
  userid: number;
  setOpen: Dispatch<SetStateAction<boolean>>;
  init: () => Promise<void>;
};

export const PurchaseDebitNoteDrawer = (props: PurchaseDebitNoteDrawerProps) => {
  const methods = useForm<PurchaseDebitNoteForm>({
    resolver: valibotResolver(PurchaseDebitNoteSchema),
    defaultValues: {
      debit_invoice_number: "",
      debit_invoice_date: "",
      taxable_amount: "",
      vat_amount: "",
      total_invoice_value: "",
    },
  });

  return (
    <FormProvider {...methods}>
      <PurchaseDebitNoteDrawerForm {...props} />
    </FormProvider>
  );
};

const PurchaseDebitNoteDrawerForm = (props: PurchaseDebitNoteDrawerProps) => {
  const { group, dvat04Id, userid, setOpen, init } = props;

  const firstRecord = group.records[0];
  const totalQuantity = group.records.reduce((acc, r) => acc + r.quantity, 0);

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = useFormContext<PurchaseDebitNoteForm>();

  const onSubmit = async (data: PurchaseDebitNoteForm) => {
    try {
      const response = await CreatePurchaseDebitNote({
        dvat04Id,
        debit_invoice_number: data.debit_invoice_number.trim(),
        debit_invoice_date: new Date(data.debit_invoice_date),
        seller_tin_numberId: group.seller_tin_id,
        seller_tin_number_str: group.seller_tin_number.tin_number,
        taxable_amount: data.taxable_amount,
        vat_amount: data.vat_amount,
        total_invoice_value: data.total_invoice_value,
        original_invoice_number: group.invoice_number,
        original_invoice_date: new Date(group.invoice_date),
        quantity: totalQuantity,
        commodity_masterId: firstRecord.commodity_masterId,
        createdById: userid,
        urn_number: group.urn_number,
      });

      if (response.status) {
        toast.success(response.message);
        await init();
        setOpen(false);
      } else {
        toast.error(response.message);
      }
    } catch {
      toast.error("Failed to submit purchase debit note.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onFormError)} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Original Invoice No.</label>
          <p className="text-sm text-gray-900 border border-gray-200 rounded px-3 py-2 bg-gray-50">{group.invoice_number}</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Original Invoice Date</label>
          <p className="text-sm text-gray-900 border border-gray-200 rounded px-3 py-2 bg-gray-50">{formateDate(group.invoice_date)}</p>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">TIN Number</label>
        <p className="text-sm text-gray-900 border border-gray-200 rounded px-3 py-2 bg-gray-50">{group.seller_tin_number.tin_number}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <TaxtInput<PurchaseDebitNoteForm>
            title="Debit Invoice No."
            required={true}
            name="debit_invoice_number"
            placeholder="Enter debit invoice no."
          />
        </div>
        <div>
          <DateSelect<PurchaseDebitNoteForm>
            title="Debit Invoice Date"
            required={true}
            name="debit_invoice_date"
            placeholder="Select date"
            format="DD/MM/YYYY"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <TaxtInput<PurchaseDebitNoteForm>
            title="Taxable Amount"
            required={true}
            name="taxable_amount"
            placeholder="0.00"
            numdes={true}
          />
        </div>
        <div>
          <TaxtInput<PurchaseDebitNoteForm>
            title="VAT Amount"
            required={true}
            name="vat_amount"
            placeholder="0.00"
            numdes={true}
          />
        </div>
        <div>
          <TaxtInput<PurchaseDebitNoteForm>
            title="Total Invoice Value"
            required={true}
            name="total_invoice_value"
            placeholder="0.00"
            numdes={true}
          />
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-2 border-t">
        <button type="button" onClick={() => setOpen(false)} className="py-1.5 px-4 text-sm rounded border border-gray-300 text-gray-600 hover:bg-gray-50">Cancel</button>
        <button type="submit" disabled={isSubmitting} className="py-1.5 px-4 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">{isSubmitting ? "Submitting..." : "Submit Debit Note"}</button>
      </div>
    </form>
  );
};
