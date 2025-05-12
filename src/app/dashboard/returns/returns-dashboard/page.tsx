/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { Label } from "@/components/ui/label";
import { useEffect, useMemo, useState } from "react";
import Marquee from "react-fast-marquee";
import { RowData } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { Checkbox, Modal, Select } from "antd";
import {
  dvat04,
  DvatType,
  Quarter,
  return_filing,
  returns_01,
  returns_entry,
} from "@prisma/client";
import { getCookie } from "cookies-next";
import getPdfReturn from "@/action/return/getpdfreturn";
import GetUserDvat04 from "@/action/dvat/getuserdvat";
import { toast } from "react-toastify";
import { encryptURLData, formateDate, generatePDF } from "@/utils/methods";
import { CheckboxChangeEvent } from "antd/es/checkbox";
import CreateReturnRevised from "@/action/return/createreturnrevised";
import GetUserLastPandingReturn from "@/action/return/userlastpandingreturn";
import { set } from "date-fns";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    filterVariant?: "text" | "range" | "select";
  }
}

const ReturnDashboard = () => {
  const userid: number = parseInt(getCookie("id") ?? "0");
  const [year, setYear] = useState<string>();
  const [quarter, setQuarter] = useState<Quarter>(Quarter.QUARTER1);
  const [period, setPeriod] = useState<string>();
  const [davtdata, setDvatdata] = useState<dvat04>();
  const [isSearch, setSearch] = useState<boolean>(false);
  const router = useRouter();

  const [return01, setReturn01] = useState<returns_01 | null>(null);
  const [returns_entryData, serReturns_entryData] = useState<returns_entry[]>(
    []
  );

  const [duedate, setDueDate] = useState<Date>(new Date());

  const search = async (year: string, period: string) => {
    setSearch(true);
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
    let monthIndex = monthNames.indexOf(period);

    // Check if it's December (index 11) and increment year if needed
    let newYear = parseInt(year);
    if (monthIndex === 11) {
      newYear += 1;
      monthIndex = 0; // Set month to January
    } else {
      monthIndex += 1; // Otherwise, just increment the month
    }

    setDueDate(new Date(parseInt(year), monthIndex, 10));

    console.log("newYear", new Date(parseInt(year), monthIndex, 10));

    const returnformsresponse = await getPdfReturn({
      year: year,
      month: period,
      userid: userid,
    });

    if (returnformsresponse.status && returnformsresponse.data) {
      setReturn01(returnformsresponse.data.returns_01);
      serReturns_entryData(returnformsresponse.data.returns_entry);
    } else {
      serReturns_entryData([]);
      setReturn01(null);
    }
  };

  interface DvatData {
    entry: number;
    amount: number;
    tax: number;
    isnil: boolean;
  }

  const getDvatData = (dvatType: DvatType): DvatData => {
    let entry: number = 0;
    let amount: string = "0";
    let tax: string = "0";

    const output: returns_entry[] = returns_entryData.filter(
      (val: returns_entry) => val.dvat_type == dvatType && val.isnil == false
    );

    // out invoice_value shuold not repeat

    const seenInvoices = new Set<string>();

    for (let i = 0; i < output.length; i++) {
      const invoiceValue = output[i].invoice_number;

      if (invoiceValue && !seenInvoices.has(invoiceValue)) {
        seenInvoices.add(invoiceValue);
        entry += 1;
      }

      // entry += 1;
      amount = (
        parseFloat(amount) + parseFloat(output[i].amount ?? "0")
      ).toFixed(2);
      tax = (parseFloat(tax) + parseFloat(output[i].vatamount ?? "0")).toFixed(
        2
      );
    }

    return {
      entry,
      amount: parseFloat(amount),
      tax: parseFloat(tax),
      isnil:
        0 <
        returns_entryData.filter(
          (val: returns_entry) => val.dvat_type == dvatType && val.isnil == true
        ).length,
    };
  };

  const [lastPending, setLastPending] = useState<return_filing | null>(null);

  useEffect(() => {
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

    // setDateValue(currentDate);
    let currentDate: Date = new Date();

    const fiscalYearStartMonth = 3; // April
    const currentMonth = currentDate.getMonth();
    const fiscalYear =
      currentMonth < fiscalYearStartMonth
        ? currentDate.getFullYear() - 1
        : currentDate.getFullYear();

    if (currentMonth === fiscalYearStartMonth) {
      setYear((fiscalYear - 1).toString());
    } else {
      setYear(fiscalYear.toString());
    }

    const init = async () => {
      const lastPendingResponse = await GetUserLastPandingReturn({
        userid: userid,
      });

      if (lastPendingResponse.status && lastPendingResponse.data) {
        setLastPending(lastPendingResponse.data);

        setYear(lastPendingResponse.data.due_date!.getFullYear().toString());
        currentDate = lastPendingResponse.data.due_date!;
      }

      const response = await GetUserDvat04({
        userid: userid,
      });
      if (response.status && response.data) {
        setDvatdata(response.data);

        const quarters = getQuarterList(
          new Date(),
          currentMonth === fiscalYearStartMonth
            ? (fiscalYear - 1).toString()
            : fiscalYear.toString(),
          response.data?.vatLiableDate ?? new Date()
        );

        const selectedQuarter = quarters.at(-1)?.value as Quarter;
        setQuarter(selectedQuarter);

        const quarterMonthsMap: Record<Quarter, [number, number]> = {
          QUARTER1: [3, 5], // Apr (3) to Jun (5)
          QUARTER2: [6, 8], // Jul (6) to Sep (8)
          QUARTER3: [9, 11], // Oct (9) to Dec (11)
          QUARTER4: [0, 2], // Jan (0) to Mar (2)
        };

        console.log("quarterMonthsMap", quarterMonthsMap);
        console.log("selectedQuarter", selectedQuarter);

        const [startMonthIndex, endMonthIndex] =
          quarterMonthsMap[selectedQuarter];

        let monthToSet: string;

        monthToSet = monthNames[startMonthIndex];

        // if (response.data?.compositionScheme) {
        //   // Pick last month of the quarter
        //   monthToSet = monthNames[endMonthIndex];
        // } else {
        //   // Pick first month of quarter or vatLiableDate month if it's later
        //   // const liableMonth =
        //   //   response.data?.vatLiableDate?.getMonth() ?? startMonthIndex;
        //   // const adjustedStartMonth = Math.max(startMonthIndex, liableMonth);
        //   monthToSet = monthNames[startMonthIndex];
        // }
        // const periodsdata = getPeriodList(
        //   new Date(),
        //   currentMonth === fiscalYearStartMonth
        //     ? (fiscalYear - 1).toString()
        //     : fiscalYear.toString(),
        //   selectedQuarter,
        //   response.data?.vatLiableDate ?? new Date()
        // );
        // console.log("periodsdata", periodsdata);
        // console.log("monthToSet", monthToSet);
        setPeriod(monthToSet);

        // await search(
        //   currentDate.getFullYear().toString(),
        //   monthNames[currentDate.getMonth()]
        // );
        await search(currentDate.getFullYear().toString(), monthToSet);
      }
    };
    init();
  }, [userid]);

  interface PeriodValue {
    value: string;
    label: string;
  }

  const getYearList = (dateValue: Date): PeriodValue[] => {
    const liableDate: Date = davtdata?.vatLiableDate ?? new Date();

    // Fiscal year starts from April, but switch to new FY only after May 1
    const getFiscalYearStart = (date: Date) => {
      const month = date.getMonth(); // 0-indexed: April = 3
      const day = date.getDate();
      if (month > 4 || (month === 4 && day >= 1)) {
        return date.getFullYear();
      } else {
        return date.getFullYear() - 1;
      }
    };

    const startYear = getFiscalYearStart(liableDate);
    const currentFY = getFiscalYearStart(dateValue);

    const periodValues: PeriodValue[] = [];

    // Always push current fiscal year
    periodValues.push({
      value: (currentFY - 1).toString(),
      label: `${currentFY - 1}-${currentFY.toString().slice(-2)}`,
    });

    // Only push next FY if date is on or after May 1st
    const isAfterMay =
      dateValue.getMonth() > 4 ||
      (dateValue.getMonth() === 4 && dateValue.getDate() >= 1);
    if (isAfterMay) {
      periodValues.push({
        value: currentFY.toString(),
        label: `${currentFY}-${(currentFY + 1).toString().slice(-2)}`,
      });
    }

    return periodValues;
  };

  const getFinancialYear = (date: Date): string => {
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-based

    return month >= 3 ? `${year}` : `${year - 1}`;
  };

  const getQuarterList = (
    dateValue: Date,
    selectedYear: string,
    vatLiableDate: Date
  ): PeriodValue[] => {
    const getFiscalYearStart = (date: Date) => {
      const month = date.getMonth(); // 0-indexed
      const day = date.getDate();
      if (month > 3 || (month === 3 && day >= 1)) {
        return date.getFullYear();
      } else {
        return date.getFullYear() - 1;
      }
    };

    const currentFY = getFiscalYearStart(dateValue).toString();
    const liableFY = getFiscalYearStart(vatLiableDate).toString();

    const currentMonth = dateValue.getMonth();
    const currentDay = dateValue.getDate();
    const liableMonth = vatLiableDate.getMonth();

    const quarters: PeriodValue[] = [
      { value: "QUARTER1", label: "Quarter 1 [Apr - Jun]" },
      { value: "QUARTER2", label: "Quarter 2 [Jul - Sep]" },
      { value: "QUARTER3", label: "Quarter 3 [Oct - Dec]" },
      { value: "QUARTER4", label: "Quarter 4 [Jan - Mar]" },
    ];

    const getQuarterIndex = (month: number): number => {
      if (month >= 3 && month <= 5) return 1; // Apr-Jun
      if (month >= 6 && month <= 8) return 2; // Jul-Sep
      if (month >= 9 && month <= 11) return 3; // Oct-Dec
      return 4; // Jan-Mar
    };

    const selectedFY = selectedYear;
    const selectedYearNumber = parseInt(selectedYear);

    let startQuarterIndex = 1;
    let endQuarterIndex = 4;

    if (selectedFY === liableFY) {
      // Start from liable quarter
      startQuarterIndex = getQuarterIndex(liableMonth);

      // Stop at current quarter only if same FY
      if (selectedFY === currentFY) {
        const tentativeEnd = getQuarterIndex(currentMonth);
        const cutoffReached =
          (tentativeEnd === 1 && currentMonth >= 3) ||
          (tentativeEnd === 2 && currentMonth >= 6) ||
          (tentativeEnd === 3 && currentMonth >= 9) ||
          (tentativeEnd === 4 && (currentMonth === 0 || currentMonth >= 0));

        endQuarterIndex = cutoffReached ? tentativeEnd : tentativeEnd - 1;
      }
    } else if (selectedFY === currentFY) {
      // Only show up to current quarter
      const currentQuarter = getQuarterIndex(currentMonth);
      const cutoffReached =
        (currentQuarter === 1 && currentMonth >= 3) ||
        (currentQuarter === 2 && currentMonth >= 6) ||
        (currentQuarter === 3 && currentMonth >= 9) ||
        (currentQuarter === 4 && currentMonth >= 0);

      endQuarterIndex = cutoffReached ? currentQuarter : currentQuarter - 1;
    } else {
      // Other years: full year
      return quarters;
    }

    return quarters.slice(startQuarterIndex - 1, endQuarterIndex);
  };

  const getPeriodList = (
    dateValue: Date,
    year: string,
    quarter: Quarter,
    vatLiableDate: Date
  ): PeriodValue[] => {
    const currentYear = dateValue.getFullYear();
    const currentMonth = dateValue.getMonth();
    const liableYear = vatLiableDate.getFullYear();
    const liableMonth = vatLiableDate.getMonth();
    const selectedYear = parseInt(year ?? "0");

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

    const periods: PeriodValue[] = [];

    const quarterMonthsMap: Record<Quarter, number[]> = {
      QUARTER1: [3, 4, 5], // Apr, May, Jun
      QUARTER2: [6, 7, 8], // Jul, Aug, Sep
      QUARTER3: [9, 10, 11], // Oct, Nov, Dec
      QUARTER4: [0, 1, 2], // Jan, Feb, Mar
    };

    const quarterMonths = quarterMonthsMap[quarter];

    for (const month of quarterMonths) {
      // Current year condition
      if (selectedYear === currentYear) {
        if (month < currentMonth) {
          periods.push({
            value: monthNames[month],
            label: monthNames[month],
          });
        }
      }

      // Liable year condition
      else if (selectedYear === liableYear) {
        if (quarterMonths.some((m) => m >= liableMonth)) {
          if (month >= liableMonth) {
            periods.push({
              value: monthNames[month],
              label: monthNames[month],
            });
          }
        } else {
          // If quarter doesn't overlap with liableMonth, allow full quarter
          if (month < currentMonth) {
            periods.push({
              value: monthNames[month],
              label: monthNames[month],
            });
          }
        }
      }
      // Other years
      else {
        periods.push({
          value: monthNames[month],
          label: monthNames[month],
        });
      }
    }

    return periods;
  };

  const ispreview = (): boolean => {
    const dvat_30 =
      returns_entryData.filter(
        (val: returns_entry) => val.dvat_type == DvatType.DVAT_30
      ).length > 0;
    const dvat_30A =
      returns_entryData.filter(
        (val: returns_entry) => val.dvat_type == DvatType.DVAT_30_A
      ).length > 0;
    const dvat_31 =
      returns_entryData.filter(
        (val: returns_entry) => val.dvat_type == DvatType.DVAT_31
      ).length > 0;
    const dvat_31A =
      returns_entryData.filter(
        (val: returns_entry) => val.dvat_type == DvatType.DVAT_31_A
      ).length > 0;

    if (dvat_30 && dvat_30A && dvat_31 && dvat_31) return true;

    return false;
  };
  const isanynil = (): boolean => {
    const dvat_30 = returns_entryData.some(
      (val: returns_entry) => val.dvat_type == DvatType.DVAT_30 && val.isnil
    );
    const dvat_30A = returns_entryData.some(
      (val: returns_entry) => val.dvat_type == DvatType.DVAT_30_A && val.isnil
    );
    const dvat_31 = returns_entryData.some(
      (val: returns_entry) => val.dvat_type == DvatType.DVAT_31 && val.isnil
    );
    const dvat_31A = returns_entryData.some(
      (val: returns_entry) => val.dvat_type == DvatType.DVAT_31_A && val.isnil
    );

    // Return true if any of the conditions are true
    return dvat_30 || dvat_30A || dvat_31 || dvat_31A;
  };

  const ispayment = (): boolean => {
    return !(
      return01?.rr_number == null ||
      return01?.rr_number == undefined ||
      return01?.rr_number == ""
    );
  };

  const salesLocalData = useMemo(
    () => getDvatData(DvatType.DVAT_31),
    [returns_entryData, year, quarter, period] // Include relevant dependencies
  );

  const purchaseLocalData = useMemo(
    () => getDvatData(DvatType.DVAT_30),
    [returns_entryData, year, quarter, period] // Same here
  );

  const salesInterStateData = useMemo(
    () => getDvatData(DvatType.DVAT_31_A),
    [returns_entryData, year, quarter, period]
  );

  const purchaseInterStateData = useMemo(
    () => getDvatData(DvatType.DVAT_30_A),
    [returns_entryData, year, quarter, period]
  );

  const [nilBox, setNilBox] = useState<boolean>(false);
  const [rrbox, setRRBox] = useState<boolean>(false);

  const [isAccept, setIsAccept] = useState<boolean>(false);

  const nilSubmit = () => {
    if (!isAccept) {
      return toast.error("Kindly accept the terms and conditions.");
    }
    router.push(
      `/dashboard/returns/returns-dashboard/preview/${encryptURLData(
        userid.toString()
      )}?form=30A&year=${year}&quarter=${quarter}&month=${period}`
    );
  };

  const returnRevised = async () => {
    if (return01 == null)
      return toast.error("There is not any return revised selected");
    const response = await CreateReturnRevised({
      id: return01.id,
    });

    if (!response.status) {
      toast.error(response.message);
    } else {
      toast.success(response.message);
    }

    setRRBox(false);
    search(year ?? "", period ?? "");
  };

  function getQuarterForMonth(month: string): Quarter | undefined {
    const monthToQuarterMap: { [key: string]: Quarter } = {
      January: Quarter.QUARTER4,
      February: Quarter.QUARTER4,
      March: Quarter.QUARTER4,
      April: Quarter.QUARTER1,
      May: Quarter.QUARTER1,
      June: Quarter.QUARTER1,
      July: Quarter.QUARTER1,
      August: Quarter.QUARTER2,
      September: Quarter.QUARTER2,
      October: Quarter.QUARTER3,
      November: Quarter.QUARTER3,
      December: Quarter.QUARTER3,
    };

    return monthToQuarterMap[month] || undefined;
  }

  const [isDownload, setDownload] = useState<boolean>(false);

  return (
    <>
      <Modal title="Confirmation" open={rrbox} footer={null} closeIcon={false}>
        <div>
          <p>
            Would you like to proceed with filing the revised VAT return? Please
            note that penalties may apply if any discrepancies are found.
          </p>

          <div className="text-sm flex gap-1 items-center bg-white">
            <Checkbox
              value={isAccept}
              onChange={(value: CheckboxChangeEvent) => {
                setIsAccept(value.target.checked);
              }}
            />
            <p>I accept the terms and conditions</p>
          </div>
        </div>
        <div className="flex  gap-2 mt-2">
          <div className="grow"></div>
          <button
            className="py-1 rounded-md border px-4 text-sm text-gray-600"
            onClick={() => {
              setRRBox(false);
            }}
          >
            Close
          </button>
          <button
            onClick={returnRevised}
            className="py-1 rounded-md bg-blue-500 px-4 text-sm text-white"
          >
            Return Revised
          </button>
        </div>
      </Modal>
      <Modal title="Confirmation" open={nilBox} footer={null} closeIcon={false}>
        <div>
          <p>
            You have declared nil filing for a return type. You may be penalized
            if any irregularity found in the declaration of the same.
          </p>

          <div className="text-sm flex gap-1 items-center bg-white">
            <Checkbox
              value={isAccept}
              onChange={(value: CheckboxChangeEvent) => {
                setIsAccept(value.target.checked);
              }}
            />
            <p>I accept the terms and conditions</p>
          </div>
        </div>
        <div className="flex  gap-2 mt-2">
          <div className="grow"></div>
          <button
            className="py-1 rounded-md border px-4 text-sm text-gray-600"
            onClick={() => {
              setNilBox(false);
            }}
          >
            Close
          </button>
          <button
            onClick={nilSubmit}
            className="py-1 rounded-md bg-blue-500 px-4 text-sm text-white"
          >
            Submit
          </button>
        </div>
      </Modal>
      <main className="w-full p-4 relative h-full grow xl:w-5/6 xl:mx-auto">
        <div className="bg-white w-full px-4 py-2 rounded-xl font-normal pb-4">
          <h1>File Returns</h1>
          <Marquee className="bg-yellow-500 bg-opacity-10 mt-2 text-sm">
            This is a banner can be used for official updates and notifications.
          </Marquee>

          <div className="flex flex-col sm:flex-row w-full gap-4 items-end mt-4">
            <div className="grid items-center gap-1.5 w-full">
              <Label htmlFor="duedate">
                Financial Year <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={year}
                placeholder="Select a year"
                options={getYearList(new Date())}
                onChange={(val: string) => {
                  if (!val) return;
                  setYear(val.toString());

                  const quarters = getQuarterList(
                    new Date(),
                    val,
                    davtdata?.vatLiableDate ?? new Date()
                  );

                  const selectedQuarter = quarters[0]?.value as Quarter;
                  setQuarter(selectedQuarter);

                  const quarterMonthsMap: Record<Quarter, [number, number]> = {
                    QUARTER1: [3, 5], // Apr (3) to Jun (5)
                    QUARTER2: [6, 8], // Jul (6) to Sep (8)
                    QUARTER3: [9, 11], // Oct (9) to Dec (11)
                    QUARTER4: [0, 2], // Jan (0) to Mar (2)
                  };

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

                  const [startMonthIndex, endMonthIndex] =
                    quarterMonthsMap[selectedQuarter];

                  let monthToSet: string;

                  // Pick first month of quarter or vatLiableDate month if it's later
                  const liableMonth =
                    davtdata?.vatLiableDate?.getMonth() ?? startMonthIndex;

                  if (
                    davtdata?.vatLiableDate?.getFullYear().toString() == val
                  ) {
                    if (davtdata?.compositionScheme) {
                      // Pick last month of the quarter
                      monthToSet = monthNames[endMonthIndex];
                    } else {
                      const adjustedStartMonth = Math.max(
                        startMonthIndex,
                        liableMonth
                      );
                      monthToSet = monthNames[adjustedStartMonth];
                    }
                  } else {
                    monthToSet = monthNames[startMonthIndex];
                  }

                  setPeriod(monthToSet);
                }}
              />
            </div>
            <div className="grid items-center gap-1.5 w-full">
              <Label htmlFor="duedate">
                Quarter <span className="text-rose-500">*</span>
              </Label>

              <Select
                value={quarter}
                placeholder="Select quarter"
                options={getQuarterList(
                  new Date(),
                  year!,
                  davtdata?.vatLiableDate ?? new Date()
                )}
                onChange={(val: Quarter) => {
                  if (!val || !davtdata) return;

                  setQuarter(val);

                  const quarterMonthsMap: Record<Quarter, [number, number]> = {
                    QUARTER1: [3, 5], // Apr - Jun
                    QUARTER2: [6, 8], // Jul - Sep
                    QUARTER3: [9, 11], // Oct - Dec
                    QUARTER4: [0, 2], // Jan - Mar
                  };

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

                  const [startMonthIndex, endMonthIndex] =
                    quarterMonthsMap[val];
                  const selectedYear = parseInt(year!);
                  const liableYear = davtdata.vatLiableDate?.getFullYear();
                  const liableMonth = davtdata.vatLiableDate?.getMonth();

                  let monthToSet: string;

                  if (davtdata.compositionScheme) {
                    // Use the last month of the quarter
                    monthToSet = monthNames[endMonthIndex];
                  } else {
                    const isSameYear = selectedYear === liableYear;
                    const isLiableMonthInQuarter =
                      liableMonth !== undefined &&
                      liableMonth >= startMonthIndex &&
                      liableMonth <= endMonthIndex;

                    const effectiveMonthIndex =
                      isSameYear && isLiableMonthInQuarter
                        ? liableMonth
                        : startMonthIndex;

                    monthToSet = monthNames[effectiveMonthIndex];
                  }

                  setPeriod(monthToSet);
                }}
              />
            </div>
            {davtdata?.compositionScheme == false && (
              <div className="grid items-center gap-1.5 w-full">
                <Label htmlFor="duedate">
                  Period <span className="text-rose-500">*</span>
                </Label>
                <Select
                  value={period}
                  placeholder="Select Period"
                  options={getPeriodList(
                    new Date(),
                    year!,
                    quarter,
                    davtdata.vatLiableDate ?? new Date()
                  )}
                  onChange={(val: string) => {
                    if (!val) return;
                    setPeriod(val.toString());
                  }}
                />
              </div>
            )}

            <button
              className="bg-[#172e57] px-4  text-white py-1 rounded-md"
              onClick={() => search(year ?? "", period ?? "")}
            >
              Search
            </button>
          </div>
        </div>
        {isSearch && (
          <>
            {/* {lastPending != null ? (
              <>
                <div className="bg-white w-full px-4 py-2 rounded-xl font-normal pb-4 p-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 justify-between mt-4 border">
                  <div>
                    <p className="text-sm">RR Number</p>
                    <p className="text-sm  font-medium">N/A</p>
                  </div>
                  <div>
                    <p className="text-sm">User TIN Number</p>
                    <p className="text-sm  font-medium">
                      {davtdata?.tinNumber}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm">Filing Date</p>
                    <p className="text-sm  font-medium">
                      {formateDate(lastPending.due_date!)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm">Status</p>
                    <p className="text-sm  font-medium">Due - Not Filed</p>
                  </div>
                  <div>
                    <p className="text-sm">Return Type</p>
                    <p className="text-sm  font-medium">
                      {return01?.return_type ?? "ORIGINAL"}
                    </p>
                  </div>
                </div>
              </>
            ) : ( */}
            <>
              <div className="bg-white w-full px-4 py-2 rounded-xl font-normal pb-4 p-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 justify-between mt-4 border">
                <div>
                  <p className="text-sm">RR Number</p>
                  <p className="text-sm  font-medium">
                    {return01?.rr_number == null ||
                    return01?.rr_number == undefined ||
                    return01?.rr_number == ""
                      ? "N/A"
                      : return01?.rr_number}
                  </p>
                </div>
                <div>
                  <p className="text-sm">User TIN Number</p>
                  <p className="text-sm  font-medium">{davtdata?.tinNumber}</p>
                </div>

                <div>
                  <p className="text-sm">
                    {return01?.rr_number != "" &&
                    return01?.rr_number != undefined &&
                    return01?.rr_number != null
                      ? "Filed Date"
                      : "Filing Date"}
                  </p>
                  <p className="text-sm  font-medium">
                    {return01?.rr_number != "" &&
                    return01?.rr_number != undefined &&
                    return01?.rr_number != null
                      ? formateDate(return01.filing_datetime)
                      : formateDate(duedate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm">Status</p>
                  <p className="text-sm  font-medium">
                    {return01?.rr_number != "" &&
                    return01?.rr_number != undefined &&
                    return01?.rr_number != null
                      ? "Filed"
                      : "Due - Not Filed"}
                  </p>
                </div>
                <div>
                  <p className="text-sm">Return Type</p>
                  <p className="text-sm  font-medium">
                    {return01?.return_type ?? "ORIGINAL"}
                  </p>
                </div>
              </div>
            </>
            {/* )} */}

            <div className="grid w-full grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <Card
                title={"Sales Local"}
                subtitle={"Form 31"}
                buttonone="View"
                buttontwo="Add"
                entry={salesLocalData.entry}
                amount={salesLocalData.amount.toFixed(2)}
                tax={salesLocalData.tax.toFixed(2)}
                isnil={salesLocalData.isnil}
                link={`/dashboard/returns/returns-dashboard/outward-supplies?form=31&year=${year}&quarter=${quarter}&month=${period}`}
              />
              <Card
                title={"Purchase Local"}
                subtitle={"Form 30"}
                buttonone="View"
                buttontwo="Add"
                entry={purchaseLocalData.entry}
                amount={purchaseLocalData.amount.toFixed(2)}
                tax={purchaseLocalData.tax.toFixed(2)}
                isnil={purchaseLocalData.isnil}
                link={`/dashboard/returns/returns-dashboard/inward-supplies?form=30&year=${year}&quarter=${quarter}&month=${period}`}
              />
              <Card
                title={"Sales Inter-State"}
                subtitle={"Form 31-A"}
                buttonone="View"
                buttontwo="Add"
                entry={salesInterStateData.entry}
                amount={salesInterStateData.amount.toFixed(2)}
                tax={salesInterStateData.tax.toFixed(2)}
                isnil={salesInterStateData.isnil}
                link={`/dashboard/returns/returns-dashboard/outward-supplies?form=31A&year=${year}&quarter=${quarter}&month=${period}`}
              />
              <Card
                title={"Purchase Inter-State"}
                subtitle={"Form 30-A"}
                buttonone="View"
                buttontwo="Add"
                entry={purchaseInterStateData.entry}
                amount={purchaseInterStateData.amount.toFixed(2)}
                tax={purchaseInterStateData.tax.toFixed(2)}
                isnil={purchaseInterStateData.isnil}
                link={`/dashboard/returns/returns-dashboard/inward-supplies?form=30A&year=${year}&quarter=${quarter}&month=${period}`}
              />
            </div>
          </>
        )}

        <div className="absolute bottom-2 right-2 rounded shadow bg-white p-1 flex gap-2">
          {isSearch && (
            <>
              {ispreview() && (
                <>
                  {ispayment() && (
                    <>
                      <button
                        disabled={isDownload}
                        onClick={async () => {
                          await generatePDF(
                            `/dashboard/returns/returns-dashboard/preview/${encryptURLData(
                              userid.toString()
                            )}?form=30A&year=${year}&quarter=${quarter}&month=${period}&sidebar=no`
                          );
                          setTimeout(() => {
                            setDownload(false);
                          }, 3600);
                        }}
                        className="py-1 px-4 border text-white text-xs rounded bg-[#162e57]"
                      >
                        {isDownload ? "Downloading..." : "Download Return"}
                        {/* Download Return */}
                      </button>
                      {/* <button
                        onClick={() => {
                          setRRBox(true);
                        }}
                        className="py-1 px-4 border text-white text-xs rounded bg-[#162e57]"
                      >
                        Revise Return
                      </button> */}
                      {/* <button
                        onClick={async () => {
                          router.push(
                            `/dashboard/cform/${encryptURLData(
                              userid.toString()
                            )}?form=30A&year=${year}&quarter=${quarter}&month=${period}&sidebar=no`
                          );
                        }}
                        className="py-1 px-4 border text-white text-xs rounded bg-[#162e57]"
                      >
                        C-FORM
                      </button> */}
                    </>
                  )}
                  {!ispayment() && (
                    <button
                      onClick={() => {
                        if (isanynil()) {
                          setNilBox(true);
                        } else {
                          router.push(
                            `/dashboard/returns/returns-dashboard/preview/${encryptURLData(
                              userid.toString()
                            )}?form=30A&year=${year}&quarter=${quarter}&month=${period}`
                          );
                        }
                      }}
                      className="py-1 px-4 border text-white text-xs rounded bg-[#162e57]"
                    >
                      Preview
                    </button>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
};
export default ReturnDashboard;

interface CardProps {
  subtitle: string;
  title: string;
  buttonone: string;
  buttontwo: string;
  entry: number;
  amount: string;
  tax: string;
  link: string;
  isnil: boolean;
}

const Card = (props: CardProps) => {
  const route = useRouter();
  return (
    <div className=" p-2 bg-white rounded-md hover:shadow-md hover:-translate-y-2 transition-all duration-700">
      <div className="text-white text-sm font-semibold text-center bg-[#162e57] p-2 rounded-md grid place-items-center">
        <div>
          <p className="text-white text-xs font-normal text-center">
            {props.subtitle}
          </p>
          <p>{props.title}</p>
        </div>
      </div>

      <p className="text-[#162e57] mt-2 text-xs text-left">
        No Of Entries : {props.isnil ? "Nil Filed" : props.entry}
      </p>
      <p className="text-[#162e57] text-xs text-left">
        Taxable Amount : {props.amount}
      </p>
      <p className="text-[#162e57] text-xs text-left">Tax : {props.tax}</p>

      <div className="flex gap-2 justify-around mt-2">
        <button
          onClick={() => {
            route.push(props.link);
            // route.push("/dashboard/returns/returns-dashboard/outward-supplies");
          }}
          className="border flex-1 bg-[#162e57] text-white rounded-md text-sm py-1 text-center"
        >
          {props.buttonone}
        </button>

        {!props.isnil && (
          <button
            onClick={() => {
              route.push(props.link);
            }}
            className="border flex-1 bg-[#162e57]  text-white rounded-md text-sm py-1 text-center"
          >
            {props.buttontwo}
          </button>
        )}
      </div>
    </div>
  );
};
