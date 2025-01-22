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

    for (let i = 0; i < output.length; i++) {
      entry += 1;
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
    setYear(currentDate.getFullYear().toString());
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
        // response.data.compositionScheme
        //   ? setPeriod("June")
        //   : setPeriod("April");

        // const cusQuarter: Quarter = getQuarterList(
        //   new Date(),
        //   new Date().getFullYear().toString(),
        //   response.data.vatLiableDate ?? new Date()
        // ).at(-1)?.value as Quarter;

        const cusQuarter: Quarter = getQuarterList(
          currentDate,
          currentDate.getFullYear().toString(),
          response.data.vatLiableDate ?? currentDate
        ).at(-1)?.value as Quarter;
        setQuarter(
          getQuarterForMonth(monthNames[currentDate.getMonth()]) ??
            Quarter.QUARTER1
        );

        // setPeriod(
        //   getPeriodList(
        //     new Date(),
        //     new Date().getFullYear().toString(),
        //     cusQuarter,
        //     response.data.vatLiableDate ?? new Date()
        //   ).at(-1)?.value
        // );
        setPeriod(monthNames[currentDate.getMonth()]);

        await search(
          currentDate.getFullYear().toString(),
          monthNames[currentDate.getMonth()]
        );
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

    // Determine the current fiscal year based on the date
    const currentYear = dateValue.getFullYear();
    const currentMonth = dateValue.getMonth();
    const startYear = currentMonth >= 3 ? currentYear : currentYear - 1; // Fiscal year starts in April

    // Generate up to 8 fiscal years (current + 7 previous)
    const numberOfYears = 8;
    const periodValues: PeriodValue[] = [];

    for (let i = 0; i < numberOfYears; i++) {
      const fiscalYearStart = startYear - i;
      const fiscalYearEnd = fiscalYearStart + 1;

      // Include fiscal years only if they are after the liable date
      const fiscalYearStartDate = new Date(fiscalYearStart, 3, 1); // April 1st of the fiscal year
      if (liableDate <= fiscalYearStartDate || i === 0) {
        // Always include the current fiscal year (i === 0)
        periodValues.push({
          value: fiscalYearStart.toString(),
          label: `${fiscalYearStart}-${fiscalYearEnd.toString().slice(-2)}`,
        });
      }
    }

    return periodValues;
  };

  const getQuarterList = (
    dateValue: Date,
    year: string,
    vatLiableDate: Date
  ): PeriodValue[] => {
    const currentYear: number = dateValue.getFullYear();
    const currentMonth: number = dateValue.getMonth();

    const liableYear: number = vatLiableDate.getFullYear();
    const liableMonth: number = vatLiableDate.getMonth();

    const quarters: PeriodValue[] = [
      { value: "QUARTER1", label: "Quarter 1 [Apr - Jun]" },
      { value: "QUARTER2", label: "Quarter 2 [Jul - Sep]" },
      { value: "QUARTER3", label: "Quarter 3 [Oct - Dec]" },
      { value: "QUARTER4", label: "Quarter 4 [Jan - Mar]" },
    ];

    let startQuarterIndex: number = 1;
    let endQuarterIndex: number = 4;

    if (parseInt(year ?? "0") == liableYear) {
      // Determine the starting quarter based on the liable month
      if (liableMonth >= 3 && liableMonth <= 5) {
        startQuarterIndex = 1; // Quarter 1
      } else if (liableMonth >= 6 && liableMonth <= 8) {
        startQuarterIndex = 2; // Quarter 2
      } else if (liableMonth >= 9 && liableMonth <= 11) {
        startQuarterIndex = 3; // Quarter 3
      } else {
        startQuarterIndex = 4; // Quarter 4
      }

      // Determine the ending quarter based on the current month
      if (currentMonth >= 3 && currentMonth <= 5) {
        endQuarterIndex = 1; // Quarter 1
      } else if (currentMonth >= 6 && currentMonth <= 8) {
        endQuarterIndex = 2; // Quarter 2
      } else if (currentMonth >= 9 && currentMonth <= 11) {
        endQuarterIndex = 3; // Quarter 3
      } else {
        endQuarterIndex = 4; // Quarter 4
      }
    } else if (parseInt(year ?? "0") != currentYear) {
      startQuarterIndex = 4; // Return all quarters for non-current and non-liable years
    } else {
      // For the current year, calculate based on the current month
      if (currentMonth >= 6 && currentMonth <= 8) {
        startQuarterIndex = 2; // Quarter 2
      } else if (currentMonth >= 9 && currentMonth <= 11) {
        startQuarterIndex = 3; // Quarter 3
      } else if (currentMonth >= 0 && currentMonth <= 2) {
        startQuarterIndex = 4; // Quarter 4
      }
    }

    // Generate the quarters within the range [startQuarterIndex, endQuarterIndex]
    const resultQuarters: PeriodValue[] = quarters.slice(
      startQuarterIndex - 1,
      endQuarterIndex
    );

    return resultQuarters;
  };

  const getPeriodList = (
    dateValue: Date,
    year: string,
    quarter: Quarter,
    vatLiableDate: Date
  ): PeriodValue[] => {
    const currentYear: number = dateValue.getFullYear();
    const currentMonth: number = dateValue.getMonth();
    const liableYear: number = vatLiableDate.getFullYear();
    const liableMonth: number = vatLiableDate.getMonth();

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

    let startMonth: number;

    // Determine the starting month of the quarter
    switch (quarter) {
      case Quarter.QUARTER1:
        startMonth = 3; // April
        break;
      case Quarter.QUARTER2:
        startMonth = 6; // July
        break;
      case Quarter.QUARTER3:
        startMonth = 9; // October
        break;
      case Quarter.QUARTER4:
        startMonth = 0; // January
        break;
      default:
        return [];
    }

    for (let i = 0; i < 3; i++) {
      const periodMonth = (startMonth + i) % 12;

      // Handle the case when `year` matches `vatLiableDate` year
      if (parseInt(year ?? "0") === liableYear) {
        if (periodMonth >= liableMonth && periodMonth <= currentMonth) {
          periods.push({
            value: monthNames[periodMonth],
            label: monthNames[periodMonth],
          });
        }
      } else if (parseInt(year ?? "0") !== currentYear) {
        // Handle non-current years (include all months in the quarter)
        periods.push({
          value: monthNames[periodMonth],
          label: monthNames[periodMonth],
        });
      } else {
        // Handle the current year (up to the current month)
        if (periodMonth <= currentMonth) {
          periods.push({
            value: monthNames[periodMonth],
            label: monthNames[periodMonth],
          });
        }
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

  return (
    <>
      <Modal title="Confirmation" open={rrbox} footer={null} closeIcon={false}>
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
                  setQuarter(Quarter.QUARTER1);
                  davtdata?.compositionScheme
                    ? setPeriod("June")
                    : setPeriod("April");
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
                  if (!val) return;
                  if (!davtdata) return;
                  setQuarter(val);

                  switch (val.toString() as Quarter) {
                    case Quarter.QUARTER1:
                      davtdata.compositionScheme
                        ? setPeriod("June")
                        : setPeriod(
                            getPeriodList(
                              new Date(),
                              year!,
                              Quarter.QUARTER1,
                              davtdata.vatLiableDate ?? new Date()
                            )[0].value
                          );
                      break;
                    case Quarter.QUARTER2:
                      davtdata.compositionScheme
                        ? setPeriod("September")
                        : setPeriod(
                            getPeriodList(
                              new Date(),
                              year!,
                              Quarter.QUARTER2,
                              davtdata.vatLiableDate ?? new Date()
                            )[0].value
                          );
                      break;
                    case Quarter.QUARTER3:
                      davtdata.compositionScheme
                        ? setPeriod("December")
                        : setPeriod(
                            getPeriodList(
                              new Date(),
                              year!,
                              Quarter.QUARTER3,
                              davtdata.vatLiableDate ?? new Date()
                            )[0].value
                          );
                      break;
                    case Quarter.QUARTER4:
                      davtdata.compositionScheme
                        ? setPeriod("March")
                        : setPeriod(
                            getPeriodList(
                              new Date(),
                              year!,
                              Quarter.QUARTER4,
                              davtdata.vatLiableDate ?? new Date()
                            )[0].value
                          );
                      break;
                    default:
                      break;
                  }
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
                        onClick={async () => {
                          await generatePDF(
                            `/dashboard/returns/returns-dashboard/preview/${encryptURLData(
                              userid.toString()
                            )}?form=30A&year=${year}&quarter=${quarter}&month=${period}&sidebar=no`
                          );
                        }}
                        className="py-1 px-4 border text-white text-xs rounded bg-[#162e57]"
                      >
                        Download Return
                      </button>
                      <button
                        onClick={() => {
                          setRRBox(true);
                        }}
                        className="py-1 px-4 border text-white text-xs rounded bg-[#162e57]"
                      >
                        Revise Return
                      </button>
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
