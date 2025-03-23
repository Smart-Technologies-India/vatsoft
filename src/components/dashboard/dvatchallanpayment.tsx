/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Button } from "antd";
import { ToWords } from "to-words";
import {
  capitalcase,
  decryptURLData,
  formateDate,
  getDaysBetweenDates,
  isNegative,
  onFormError,
} from "@/utils/methods";
import {
  CategoryOfEntry,
  dvat04,
  DvatType,
  InputTaxCredit,
  NaturePurchase,
  NaturePurchaseOption,
  registration,
  returns_01,
  returns_entry,
  SaleOf,
  user,
} from "@prisma/client";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { useForm } from "react-hook-form";
import {
  SubmitPaymentForm,
  SubmitPaymentSchema,
} from "@/schema/subtmitpayment";
import AddPayment from "@/action/return/addpayment";
import CheckLastPayment from "@/action/return/checklastpayment";
import GetReturn01 from "@/action/return/getreturn";
import getReturnEntry from "@/action/return/getreturnentry";
import GetUser from "@/action/user/getuser";

interface PercentageOutput {
  increase: string;
  decrease: string;
}

type DvatChallanPaymentProps = {
  returnid: string;
};

export const DvatChallanPayment = (props: DvatChallanPaymentProps) => {
  const router = useRouter();
  const toWords = new ToWords();

  const [return01, setReturn01] = useState<
    (returns_01 & { dvat04: dvat04 & { registration: registration[] } }) | null
  >();

  const [lateFees, setLateFees] = useState<number>(0);
  const [DiffDays, setDiffDays] = useState<number>(0);
  const [returns_entryData, serReturns_entryData] = useState<returns_entry[]>(
    []
  );

  const [user, setUser] = useState<user | null>(null);

  useEffect(() => {
    const init = async () => {
      const returns_response = await GetReturn01({
        id: parseInt(decryptURLData(props.returnid, router)),
      });
      if (returns_response.status && returns_response.data) {
        setReturn01(returns_response.data);

        const user_response = await GetUser({
          id: returns_response.data.dvat04.createdById,
        });
        if (user_response.status && user_response.data) {
          setUser(user_response.data);
        }

        const entry_response = await getReturnEntry({
          returnid: returns_response.data.id,
        });
        if (entry_response.status && entry_response.data) {
          serReturns_entryData(entry_response.data);
        }

        getLateFees(
          returns_response.data.year,
          returns_response.data.month!,
          returns_response.data.rr_number
        );
      }
    };
    init();
  }, []);

  const getLateFees = (year: string, month: string, rr_number: string) => {
    const currentDate = new Date();

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    // Get the month index from the month name
    let monthIndex = monthNames.indexOf(month);

    // Check if it's December (index 11) and increment year if needed
    let newYear = parseInt(year);
    if (monthIndex === 11) {
      newYear += 1;
      monthIndex = 0; // Set month to January
    } else {
      monthIndex += 1; // Otherwise, just increment the month
    }

    const diff_days = getDaysBetweenDates(
      new Date(newYear, monthIndex, 11),
      currentDate
    );
    setDiffDays(diff_days);

    if (rr_number == null || rr_number == undefined || rr_number == "") {
      setLateFees(100 * diff_days);
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<SubmitPaymentForm>({
    resolver: valibotResolver(SubmitPaymentSchema),
  });
  const get_rr_number = (): string => {
    const rr_no = return01?.dvat04.tinNumber?.toString().slice(-4);
    const today = new Date();
    const month = ("0" + (today.getMonth() + 1)).slice(-2);
    const day = ("0" + today.getDate()).slice(-2);
    const return_id = parseInt(return01?.id.toString() ?? "0") + 4000;

    return `${rr_no}${month}${day}${return_id}`;
  };

  const onSubmit = async (data: SubmitPaymentForm) => {
    if (return01 == null) return toast.error("No return exist");

    const lastPayment = await CheckLastPayment({
      id: return01.id ?? 0,
    });

    if (!lastPayment.status) {
      toast.error(lastPayment.message);
      reset();
      return;
    }

    if (lastPayment.data == false) {
      toast.error(lastPayment.message);
      reset();
      return;
    }

    const response = await AddPayment({
      id: return01.id ?? 0,
      bank_name: data.bank_name,
      track_id: data.track_id,
      transaction_id: data.transaction_id,
      rr_number: get_rr_number(),
      penalty: lateFees.toString(),
      ...(isNegative(getValue()) && {
        pending_payment: getValue().toFixed(),
      }),
    });

    if (!response.status) return toast.error(response.message);
    toast.success(response.message);
    router.push("/dashboard/returns/returns-dashboard");
    reset();
  };

  // extra calcuation
  const getInvoicePercentage = (value: string): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = returns_entryData.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31 &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.sale_of == SaleOf.GOODS_TAXABLE &&
        val.tax_percent == value
    );
    for (let i = 0; i < output.length; i++) {
      increase = (
        parseFloat(increase) + parseFloat(output[i].amount ?? "0")
      ).toFixed(2);
      decrease = (
        parseFloat(decrease) + parseFloat(output[i].vatamount ?? "0")
      ).toFixed(2);
    }
    return {
      increase,
      decrease,
    };
  };
  const getSaleOfPercentage = (value: string): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = returns_entryData.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31 &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.sale_of == SaleOf.WORKS_CONTRACT &&
        val.tax_percent == value
    );
    for (let i = 0; i < output.length; i++) {
      increase = (
        parseFloat(increase) + parseFloat(output[i].amount ?? "0")
      ).toFixed(2);
      decrease = (
        parseFloat(decrease) + parseFloat(output[i].vatamount ?? "0")
      ).toFixed(2);
    }
    return {
      increase,
      decrease,
    };
  };

  const get4_6 = (): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = returns_entryData.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31 &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        (val.sale_of == SaleOf.LABOUR || val.sale_of == SaleOf.EXEMPTED_GOODS)
    );
    for (let i = 0; i < output.length; i++) {
      increase = (
        parseFloat(increase) + parseFloat(output[i].amount ?? "0")
      ).toFixed(2);
      decrease = (
        parseFloat(decrease) + parseFloat(output[i].vatamount ?? "0")
      ).toFixed(2);
    }
    return {
      increase,
      decrease,
    };
  };

  const get4_7 = (): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = returns_entryData.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31 &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.sale_of == SaleOf.PROCESSED_GOODS
    );
    for (let i = 0; i < output.length; i++) {
      increase = (
        parseFloat(increase) + parseFloat(output[i].amount ?? "0")
      ).toFixed(2);
      decrease = (
        parseFloat(decrease) + parseFloat(output[i].vatamount ?? "0")
      ).toFixed(2);
    }
    return {
      increase,
      decrease,
    };
  };

  const get4_9 = (): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = returns_entryData.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_31 &&
        (val.category_of_entry == CategoryOfEntry.GOODS_RETURNED ||
          val.category_of_entry == CategoryOfEntry.SALE_CANCELLED) &&
        val.sale_of == SaleOf.GOODS_TAXABLE
    );
    for (let i = 0; i < output.length; i++) {
      increase = (
        parseFloat(increase) + parseFloat(output[i].amount ?? "0")
      ).toFixed(2);
      decrease = (
        parseFloat(decrease) + parseFloat(output[i].vatamount ?? "0")
      ).toFixed(2);
    }
    return {
      increase,
      decrease,
    };
  };
  const get5_1 = (): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = returns_entryData.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_30 &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.nature_purchase == NaturePurchase.CAPITAL_GOODS &&
        val.nature_purchase_option == NaturePurchaseOption.REGISTER_DEALERS &&
        val.input_tax_credit == InputTaxCredit.ITC_ELIGIBLE
    );
    for (let i = 0; i < output.length; i++) {
      increase = (
        parseFloat(increase) + parseFloat(output[i].amount ?? "0")
      ).toFixed(2);
      decrease = (
        parseFloat(decrease) + parseFloat(output[i].vatamount ?? "0")
      ).toFixed(2);
    }
    return {
      increase,
      decrease,
    };
  };
  const get5_2 = (): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = returns_entryData.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_30 &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        val.nature_purchase == NaturePurchase.OTHER_GOODS &&
        val.nature_purchase_option == NaturePurchaseOption.REGISTER_DEALERS &&
        val.input_tax_credit == InputTaxCredit.ITC_ELIGIBLE
    );
    for (let i = 0; i < output.length; i++) {
      increase = (
        parseFloat(increase) + parseFloat(output[i].amount ?? "0")
      ).toFixed(2);
      decrease = (
        parseFloat(decrease) + parseFloat(output[i].vatamount ?? "0")
      ).toFixed(2);
    }
    return {
      increase,
      decrease,
    };
  };
  const get5_3 = (): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = returns_entryData.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_30 &&
        val.category_of_entry == CategoryOfEntry.INVOICE &&
        (val.nature_purchase == NaturePurchase.OTHER_GOODS ||
          val.nature_purchase == NaturePurchase.CAPITAL_GOODS) &&
        val.input_tax_credit == InputTaxCredit.ITC_NOT_ELIGIBLE
    );
    for (let i = 0; i < output.length; i++) {
      increase = (
        parseFloat(increase) + parseFloat(output[i].amount ?? "0")
      ).toFixed(2);
      decrease = (
        parseFloat(decrease) + parseFloat(output[i].vatamount ?? "0")
      ).toFixed(2);
    }
    return {
      increase,
      decrease,
    };
  };

  const getCreditNote = (): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = returns_entryData.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_30 &&
        val.category_of_entry == CategoryOfEntry.CREDIT_NOTE &&
        (val.nature_purchase == NaturePurchase.OTHER_GOODS ||
          val.nature_purchase == NaturePurchase.CAPITAL_GOODS) &&
        val.input_tax_credit == InputTaxCredit.ITC_ELIGIBLE &&
        val.nature_purchase_option == NaturePurchaseOption.REGISTER_DEALERS
    );
    for (let i = 0; i < output.length; i++) {
      increase = (
        parseFloat(increase) + parseFloat(output[i].amount ?? "0")
      ).toFixed(2);
      decrease = (
        parseFloat(decrease) + parseFloat(output[i].vatamount ?? "0")
      ).toFixed(2);
    }
    return {
      increase,
      decrease,
    };
  };
  const getDebitNote = (): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = returns_entryData.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_30 &&
        val.category_of_entry == CategoryOfEntry.DEBIT_NOTE &&
        (val.nature_purchase == NaturePurchase.OTHER_GOODS ||
          val.nature_purchase == NaturePurchase.CAPITAL_GOODS) &&
        val.input_tax_credit == InputTaxCredit.ITC_ELIGIBLE &&
        val.nature_purchase_option == NaturePurchaseOption.REGISTER_DEALERS
    );
    for (let i = 0; i < output.length; i++) {
      increase = (
        parseFloat(increase) + parseFloat(output[i].amount ?? "0")
      ).toFixed(2);
      decrease = (
        parseFloat(decrease) + parseFloat(output[i].vatamount ?? "0")
      ).toFixed(2);
    }
    return {
      increase,
      decrease,
    };
  };
  const getGoodsReturnsNote = (): PercentageOutput => {
    let increase: string = "0";
    let decrease: string = "0";
    const output: returns_entry[] = returns_entryData.filter(
      (val: returns_entry) =>
        val.dvat_type == DvatType.DVAT_30 &&
        val.category_of_entry == CategoryOfEntry.GOODS_RETURNED &&
        (val.nature_purchase == NaturePurchase.OTHER_GOODS ||
          val.nature_purchase == NaturePurchase.CAPITAL_GOODS) &&
        val.input_tax_credit == InputTaxCredit.ITC_ELIGIBLE &&
        val.nature_purchase_option == NaturePurchaseOption.REGISTER_DEALERS
    );
    for (let i = 0; i < output.length; i++) {
      increase = (
        parseFloat(increase) + parseFloat(output[i].amount ?? "0")
      ).toFixed(2);
      decrease = (
        parseFloat(decrease) + parseFloat(output[i].vatamount ?? "0")
      ).toFixed(2);
    }
    return {
      increase,
      decrease,
    };
  };

  const getVatAmount = (): number => {
    return (
      parseFloat(getInvoicePercentage("0").decrease) +
      parseFloat(getInvoicePercentage("1").decrease) +
      parseFloat(getInvoicePercentage("4").decrease) +
      parseFloat(getInvoicePercentage("5").decrease) +
      parseFloat(getInvoicePercentage("6").decrease) +
      parseFloat(getInvoicePercentage("12.5").decrease) +
      parseFloat(getInvoicePercentage("12.75").decrease) +
      parseFloat(getInvoicePercentage("13.5").decrease) +
      parseFloat(getInvoicePercentage("15").decrease) +
      parseFloat(getInvoicePercentage("20").decrease) +
      parseFloat(getSaleOfPercentage("4").decrease) +
      parseFloat(getSaleOfPercentage("5").decrease) +
      parseFloat(getSaleOfPercentage("12.5").decrease) +
      parseFloat(get4_6().decrease) +
      parseFloat(get4_7().decrease) -
      parseFloat(get4_9().decrease) -
      (parseFloat(get5_1().decrease) +
        parseFloat(get5_2().decrease) +
        (parseFloat(getCreditNote().decrease) -
          parseFloat(getDebitNote().decrease) -
          parseFloat(getGoodsReturnsNote().decrease)))
    );
  };

  const getValue = () => {
    return (
      parseFloat(getInvoicePercentage("0").decrease) +
      parseFloat(getInvoicePercentage("1").decrease) +
      parseFloat(getInvoicePercentage("4").decrease) +
      parseFloat(getInvoicePercentage("5").decrease) +
      parseFloat(getInvoicePercentage("6").decrease) +
      parseFloat(getInvoicePercentage("12.5").decrease) +
      parseFloat(getInvoicePercentage("12.75").decrease) +
      parseFloat(getInvoicePercentage("13.5").decrease) +
      parseFloat(getInvoicePercentage("15").decrease) +
      parseFloat(getInvoicePercentage("20").decrease) +
      parseFloat(getSaleOfPercentage("4").decrease) +
      parseFloat(getSaleOfPercentage("5").decrease) +
      parseFloat(getSaleOfPercentage("12.5").decrease) +
      parseFloat(get4_6().decrease) +
      parseFloat(get4_7().decrease) -
      parseFloat(get4_9().decrease) -
      (parseFloat(get5_1().decrease) +
        parseFloat(get5_2().decrease) +
        (parseFloat(getCreditNote().decrease) -
          parseFloat(getDebitNote().decrease) -
          parseFloat(getGoodsReturnsNote().decrease))) +
      (((parseFloat(getInvoicePercentage("0").decrease) +
        parseFloat(getInvoicePercentage("1").decrease) +
        parseFloat(getInvoicePercentage("4").decrease) +
        parseFloat(getInvoicePercentage("5").decrease) +
        parseFloat(getInvoicePercentage("6").decrease) +
        parseFloat(getInvoicePercentage("12.5").decrease) +
        parseFloat(getInvoicePercentage("12.75").decrease) +
        parseFloat(getInvoicePercentage("13.5").decrease) +
        parseFloat(getInvoicePercentage("15").decrease) +
        parseFloat(getInvoicePercentage("20").decrease) +
        parseFloat(getSaleOfPercentage("4").decrease) +
        parseFloat(getSaleOfPercentage("5").decrease) +
        parseFloat(getSaleOfPercentage("12.5").decrease) +
        parseFloat(get4_6().decrease) +
        parseFloat(get4_7().decrease) -
        parseFloat(get4_9().decrease) -
        (parseFloat(get5_1().decrease) +
          parseFloat(get5_2().decrease) +
          (parseFloat(getCreditNote().decrease) -
            parseFloat(getDebitNote().decrease) -
            parseFloat(getGoodsReturnsNote().decrease)))) *
        0.15) /
        365) *
        DiffDays +
      lateFees +
      0 -
      0
    );
  };

  const isPayment = (): boolean => {
    let res: boolean =
      return01!.rr_number == null ||
      return01!.rr_number == undefined ||
      return01!.rr_number == "";
    return res == false;
  };

  return (
    <>
      <main>
        <div className="py-1 text-sm font-medium border-y-2 border-gray-300 mt-4">
          Details Of Taxpayer
        </div>
        <div className="p-1 bg-gray-50 grid grid-cols-4 gap-6 justify-between px-4">
          <div>
            <p className="text-sm">Name</p>
            <p className="text-sm  font-medium">
              {user?.firstName} - {user?.lastName}
            </p>
          </div>
          <div>
            <p className="text-sm">Email</p>
            <p className="text-sm  font-medium">{user?.email}</p>
          </div>
          <div>
            <p className="text-sm">Mobile</p>
            <p className="text-sm  font-medium">{user?.mobileOne}</p>
          </div>
          <div>
            <p className="text-sm">User TIN Number</p>
            <p className="text-sm  font-medium">
              {return01?.dvat04?.tinNumber}
            </p>
          </div>
          <div>
            <p className="text-sm">Address</p>
            <p className="text-sm  font-medium">{user?.address}</p>
          </div>
        </div>

        <div className="py-1 text-sm font-medium border-y-2 border-gray-300 mt-4">
          Reason for challan
        </div>
        <div className="p-1 bg-gray-50 grid grid-cols-4  gap-2  px-4">
          <div>
            <p className="text-sm">Reason for challan</p>
            <p className="text-sm font-medium">MONTHLYPAYMENT</p>
          </div>
        </div>

        <div className="flex gap-4">
          <Table className="border mt-2">
            <TableHeader>
              <TableRow className="bg-gray-100">
                <TableHead className="whitespace-nowrap text-center px-2 border">
                  Payment of account of
                </TableHead>
                <TableHead className="whitespace-nowrap text-center px-2 w-60 border">
                  Tax (&#x20b9;)
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="text-left p-2 border">
                  VAT(0005)
                </TableCell>
                <TableCell className="text-center p-2 border ">
                  {getVatAmount().toFixed(0)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-left p-2 border">
                  Interest(0008)
                </TableCell>
                <TableCell className="text-center p-2 border">
                  {(
                    (((parseFloat(getInvoicePercentage("0").decrease) +
                      parseFloat(getInvoicePercentage("1").decrease) +
                      parseFloat(getInvoicePercentage("4").decrease) +
                      parseFloat(getInvoicePercentage("5").decrease) +
                      parseFloat(getInvoicePercentage("6").decrease) +
                      parseFloat(getInvoicePercentage("12.5").decrease) +
                      parseFloat(getInvoicePercentage("12.75").decrease) +
                      parseFloat(getInvoicePercentage("13.5").decrease) +
                      parseFloat(getInvoicePercentage("15").decrease) +
                      parseFloat(getInvoicePercentage("20").decrease) +
                      parseFloat(getSaleOfPercentage("4").decrease) +
                      parseFloat(getSaleOfPercentage("5").decrease) +
                      parseFloat(getSaleOfPercentage("12.5").decrease) +
                      parseFloat(get4_6().decrease) +
                      parseFloat(get4_7().decrease) -
                      parseFloat(get4_9().decrease) -
                      (parseFloat(get5_1().decrease) +
                        parseFloat(get5_2().decrease) +
                        (parseFloat(getCreditNote().decrease) -
                          parseFloat(getDebitNote().decrease) -
                          parseFloat(getGoodsReturnsNote().decrease)))) *
                      0.15) /
                      365) *
                    DiffDays
                  ).toFixed(0)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-left p-2 border">
                  CESS(0009)
                </TableCell>
                <TableCell className="text-center p-2 border">0</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-left p-2 border">Penalty</TableCell>
                <TableCell className="text-center p-2 border">
                  {lateFees}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-left p-2 border">Others</TableCell>
                <TableCell className="text-center p-2 border">0</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-left p-2 border">
                  Total Challan Amount:
                </TableCell>
                <TableCell className="text-center p-2 border">
                  {(
                    getVatAmount() +
                    lateFees +
                    (((parseFloat(getInvoicePercentage("0").decrease) +
                      parseFloat(getInvoicePercentage("1").decrease) +
                      parseFloat(getInvoicePercentage("4").decrease) +
                      parseFloat(getInvoicePercentage("5").decrease) +
                      parseFloat(getInvoicePercentage("6").decrease) +
                      parseFloat(getInvoicePercentage("12.5").decrease) +
                      parseFloat(getInvoicePercentage("12.75").decrease) +
                      parseFloat(getInvoicePercentage("13.5").decrease) +
                      parseFloat(getInvoicePercentage("15").decrease) +
                      parseFloat(getInvoicePercentage("20").decrease) +
                      parseFloat(getSaleOfPercentage("4").decrease) +
                      parseFloat(getSaleOfPercentage("5").decrease) +
                      parseFloat(getSaleOfPercentage("12.5").decrease) +
                      parseFloat(get4_6().decrease) +
                      parseFloat(get4_7().decrease) -
                      parseFloat(get4_9().decrease) -
                      (parseFloat(get5_1().decrease) +
                        parseFloat(get5_2().decrease) +
                        (parseFloat(getCreditNote().decrease) -
                          parseFloat(getDebitNote().decrease) -
                          parseFloat(getGoodsReturnsNote().decrease)))) *
                      0.15) /
                      365) *
                      DiffDays
                  ).toFixed(0)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-left p-2 border">
                  Total amount paid (in words): Rupees
                </TableCell>
                <TableCell className="text-left p-2 border">
                  {capitalcase(
                    toWords.convert(
                      parseFloat(
                        (
                          getVatAmount() +
                          lateFees +
                          (((parseFloat(getInvoicePercentage("0").decrease) +
                            parseFloat(getInvoicePercentage("1").decrease) +
                            parseFloat(getInvoicePercentage("4").decrease) +
                            parseFloat(getInvoicePercentage("5").decrease) +
                            parseFloat(getInvoicePercentage("6").decrease) +
                            parseFloat(getInvoicePercentage("12.5").decrease) +
                            parseFloat(getInvoicePercentage("12.75").decrease) +
                            parseFloat(getInvoicePercentage("13.5").decrease) +
                            parseFloat(getInvoicePercentage("15").decrease) +
                            parseFloat(getInvoicePercentage("20").decrease) +
                            parseFloat(getSaleOfPercentage("4").decrease) +
                            parseFloat(getSaleOfPercentage("5").decrease) +
                            parseFloat(getSaleOfPercentage("12.5").decrease) +
                            parseFloat(get4_6().decrease) +
                            parseFloat(get4_7().decrease) -
                            parseFloat(get4_9().decrease) -
                            (parseFloat(get5_1().decrease) +
                              parseFloat(get5_2().decrease) +
                              (parseFloat(getCreditNote().decrease) -
                                parseFloat(getDebitNote().decrease) -
                                parseFloat(getGoodsReturnsNote().decrease)))) *
                            0.15) /
                            365) *
                            DiffDays
                        ).toFixed(0)
                      )
                    )
                  )}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <div className="w-96">
            {!(
              return01?.rr_number == null ||
              return01?.rr_number == undefined ||
              return01?.rr_number == ""
            ) ? (
              <>
                <div className="p-2 flex flex-col gap-2 border bg-gray-100 mt-2">
                  <div>
                    <p className="text-sm">Bank Name</p>
                    <p className="text-sm  font-medium">
                      {return01?.bank_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm">Track Id</p>
                    <p className="text-sm  font-medium">{return01?.track_id}</p>
                  </div>
                  <div>
                    <p className="text-sm">Transaction Id</p>
                    <p className="text-sm  font-medium">
                      {return01?.transaction_id}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm">Transaction Date</p>
                    <p className="text-sm  font-medium">
                      {formateDate(new Date(return01?.transaction_date!))}
                    </p>
                  </div>
                </div>
                <div className="mt-2"></div>
                <Button
                  onClick={() => {
                    router.push("/dashboard/returns/returns-dashboard");
                  }}
                  type="primary"
                >
                  Close
                </Button>
              </>
            ) : (
              <>
                <form onSubmit={handleSubmit(onSubmit, onFormError)}>
                  <div className="mt-2">
                    <p>Bank Name</p>
                    <input
                      className={`w-full px-2 py-1 border rounded-md outline-none focus:outline-none focus:border-blue-500  ${
                        errors.bank_name
                          ? "border-red-500"
                          : "hover:border-blue-500"
                      }`}
                      placeholder="Bank Name"
                      {...register("bank_name")}
                      type="text"
                    />
                    {errors.bank_name && (
                      <p className="text-xs text-red-500">
                        {errors.bank_name.message?.toString()}
                      </p>
                    )}
                  </div>
                  <div className="mt-2">
                    <p>Transaction Id</p>
                    <input
                      className={`w-full px-2 py-1 border rounded-md outline-none focus:outline-none focus:border-blue-500 ${
                        errors.transaction_id
                          ? "border-red-500"
                          : "hover:border-blue-500"
                      }`}
                      placeholder="Transaction id"
                      {...register("transaction_id")}
                    />
                    {errors.transaction_id && (
                      <p className="text-xs text-red-500">
                        {errors.transaction_id.message?.toString()}
                      </p>
                    )}
                  </div>
                  <div className="mt-2">
                    <p>Track Id</p>
                    <input
                      className={`w-full px-2 py-1 border rounded-md outline-none focus:outline-none focus:border-blue-500  ${
                        errors.track_id
                          ? "border-red-500"
                          : "hover:border-blue-500"
                      }`}
                      placeholder="Track Id"
                      {...register("track_id")}
                    />
                    {errors.track_id && (
                      <p className="text-xs text-red-500">
                        {errors.track_id.message?.toString()}
                      </p>
                    )}
                  </div>
                  <div className="flex  gap-2 mt-2">
                    <div className="grow"></div>
                    {/* <Button
                      onClick={(e) => {
                        e.preventDefault();
                        router.back();
                      }}
                    >
                      Back
                    </Button> */}
                    <Button
                      disabled={isSubmitting}
                      onClick={(e) => {
                        e.preventDefault();
                        reset({});
                      }}
                    >
                      Reset
                    </Button>
                    <input
                      type="submit"
                      value={"Pay Challan"}
                      className="py-1 rounded-md bg-blue-500 px-4 text-sm text-white cursor-pointer"
                    />
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
};
