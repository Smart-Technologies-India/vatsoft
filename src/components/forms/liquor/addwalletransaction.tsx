"use client";

import { FormProvider, useForm, useFormContext } from "react-hook-form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TaxtInput } from "../inputfields/textinput";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { ToWords } from "to-words";
import { encryptURLData, onFormError } from "@/utils/methods";
import AddLiquorWalletTransaction from "@/action/liquor/addwallettransaction";
import { dvat04 } from "@prisma/client";
import GetUserDvat04 from "@/action/dvat/getuserdvat";
import * as v from "valibot";
import { Button } from "antd";

const AddLiquorWalletTransactionSchema = v.object({
  amount: v.pipe(
    v.string(),
    v.minLength(1, "Amount is required"),
    v.regex(/^\d+(\.\d{1,2})?$/, "Amount must be a valid number"),
  ),
  remark: v.optional(v.string()),
});

type AddLiquorWalletTransactionForm = v.InferInput<
  typeof AddLiquorWalletTransactionSchema
>;

type AddLiquorWalletTransactionProviderProps = {
  userid: number;
};

export const AddLiquorWalletTransactionProvider = (
  props: AddLiquorWalletTransactionProviderProps,
) => {
  const methods = useForm<AddLiquorWalletTransactionForm>({
    resolver: valibotResolver(AddLiquorWalletTransactionSchema),
    defaultValues: {
      amount: "",
      remark: "",
    },
  });

  return (
    <FormProvider {...methods}>
      <AddLiquorWalletTransactionPage userid={props.userid} />
    </FormProvider>
  );
};

const AddLiquorWalletTransactionPage = (
  props: AddLiquorWalletTransactionProviderProps,
) => {
  const router = useRouter();
  const toWords = new ToWords({
    localeCode: "en-IN",
  });

  const [dvatdata, setDvatData] = useState<dvat04 | null>(null);

  const {
    reset,
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = useFormContext<AddLiquorWalletTransactionForm>();

  useEffect(() => {
    const loadData = async () => {
      const dvatResponse = await GetUserDvat04();
      if (!dvatResponse.status || !dvatResponse.data) {
        toast.error(dvatResponse.message);
        return;
      }

      setDvatData(dvatResponse.data);
    };

    loadData();

    reset({
      amount: "",
      remark: "",
    });
  }, [reset]);

  const onSubmit = async (data: AddLiquorWalletTransactionForm) => {
    if (dvatdata == null) {
      return toast.error("DVAT profile not found.");
    }

    const amountNum = parseFloat(data.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return toast.error("Amount must be greater than 0.");
    }

    const transaction_response = await AddLiquorWalletTransaction({
      amount: amountNum,
      remark: data.remark,
    });

    if (transaction_response.status && transaction_response.data) {
      toast.success(transaction_response.message);
      reset({ amount: "", remark: "" });
      router.push(
        `/dashboard/payments/saved-challan/${encryptURLData(transaction_response.data.challanId.toString())}`,
      );
    } else {
      toast.error(transaction_response.message);
    }
  };

  const getTotalAmount = (): number => {
    const amount = parseFloat(watch("amount"));
    return isNaN(amount) ? 0 : amount;
  };

  return (
    <>
      <div className="py-1 text-sm font-medium border-y-2 border-gray-300 mt-4">
        Details Of Taxpayer
      </div>
      <div className="p-1 bg-gray-50 grid grid-cols-4 gap-6 justify-between px-4">
        <div>
          <p className="text-sm">User TIN Number</p>
          <p className="text-sm font-medium">{dvatdata?.tinNumber}</p>
        </div>
        <div>
          <p className="text-sm">Name</p>
          <p className="text-sm font-medium">{dvatdata?.tradename}</p>
        </div>
        <div>
          <p className="text-sm">Email</p>
          <p className="text-sm font-medium">{dvatdata?.email}</p>
        </div>
        <div>
          <p className="text-sm">Mobile</p>
          <p className="text-sm font-medium">{dvatdata?.contact_one}</p>
        </div>
        <div>
          <p className="text-sm">Address</p>
          <p className="text-sm font-medium">{dvatdata?.address}</p>
        </div>
        <div>
          <p className="text-sm">Current Liquor Wallet Amount</p>
          <p className="text-sm font-medium text-blue-600">
            ₹ {parseFloat(dvatdata?.wallet || "0").toFixed(2)}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit, onFormError)}>
        <div className="p-2 bg-gray-50 mt-2 flex gap-4 items-end">
          <div className="w-72">
            <p className="text-sm font-normal">Transaction Type</p>
            <p className="text-sm font-medium text-green-600">CREDIT</p>
          </div>
          <div>
            <p className="text-sm font-normal">Date</p>
            <p className="text-sm font-medium">
              {new Date().toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <Table className="border mt-2">
            <TableHeader>
              <TableRow className="bg-gray-100">
                <TableHead className="whitespace-nowrap text-center px-2 border">
                  Payment Description
                </TableHead>
                <TableHead className="whitespace-nowrap text-center px-2 w-60 border">
                  Amount (₹)
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="text-left p-2 border">
                  Liquor Wallet Credit / Top-up Amount
                </TableCell>
                <TableCell className="text-center p-2 border">
                  <TaxtInput<AddLiquorWalletTransactionForm>
                    name="amount"
                    required={true}
                    numdes={true}
                    placeholder="0.00"
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <div className="w-60 mt-2 bg-green-50 border border-green-200 rounded p-3">
            <p className="text-xs text-green-700 mb-2">Total Payable Amount</p>
            <p className="text-2xl font-bold text-green-900">
              ₹ {getTotalAmount().toFixed(2)}
            </p>
            <p className="text-xs text-gray-600 mt-2">
              {getTotalAmount() > 0
                ? toWords.convert(getTotalAmount(), {
                    currency: false,
                  })
                : "Zero"}
            </p>
          </div>
        </div>

        <div className="mt-6 flex gap-4">
          <Button
            htmlType="submit"
            type="primary"
            size="large"
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Processing..." : "Proceed to Payment"}
          </Button>
          <Button
            size="large"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </>
  );
};
