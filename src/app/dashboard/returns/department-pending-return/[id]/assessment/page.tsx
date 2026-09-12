/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { decryptURLData, encryptURLData } from "@/utils/methods";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { dvat04, return_filing } from "@prisma/client";
import { Table, Button, Card, Empty, Spin, Tabs } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import GetDvat04 from "@/action/register/getdvat04";
import GetDvatChallan, {
  type DvatChallanWithRelations,
} from "@/action/challan/getdvatchallan";
import GetReturnMonth from "@/action/dvat/getreturnmonth";
import GetMonthlySaleAndPurchaseSummary from "@/action/stock/getmonthlysaleandpurchasesummary";
import GetDailySaleWithLossAnalysis from "@/action/stock/getdailysalewithlossanalysis";

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatINR = (value: number) => inrFormatter.format(value);

const parseAmount = (value: string | null | undefined) =>
  Number.parseFloat(value ?? "0") || 0;

interface MonthlyChallanSummary {
  year: number;
  month: string;
  monthIndex: number;
  displayLabel: string;
  paidCount: number;
  totalVat: number;
  totalInterest: number;
  totalPenalty: number;
  totalOthers: number;
  totalAmount: number;
}

interface YearlyChallanSummary {
  year: number;
  paidCount: number;
  totalVat: number;
  totalInterest: number;
  totalPenalty: number;
  totalAmount: number;
}

interface YearlyReturnAssessment {
  year: number;
  late_filed: number;
  filed: number;
  due: number;
  pending: number;
}

interface MonthlySalePurchaseSummary {
  month: number;
  year: number;
  monthName: string;
  salesCount: number;
  purchaseCount: number;
  salesTotalAmount: number;
  salesTotalVat: number;
  purchaseTotalAmount: number;
  purchaseTotalVat: number;
  returnsFiled: boolean;
}

interface MonthlySaleLossReport {
  year: number;
  month: string;
  monthIndex: number;
  displayLabel: string;
  totalVatLoss: number;
  totalVatLossQuantity: number;
  averageVatLossPercentage: number;
  itemsWithVatLoss: SaleLossItem[];
}

interface SaleLossItem {
  invoiceNumber: string;
  invoiceDate: Date;
  commodity: string;
  quantity: number;
  commodityPrice: number;
  salePrice: number;
  commodityVat: number;
  saleVat: number;
  vatLossPerUnit: number;
  vatLossPercentage: number;
  totalVatLoss: number;
}

const AssessmentPage = () => {
  const { id } = useParams<{ id: string | string[] }>();
  const router = useRouter();
  const dvat04id = parseInt(
    decryptURLData(Array.isArray(id) ? id[0] : id, router),
  );

  const [isLoading, setIsLoading] = useState(true);
  const [dvatData, setDvatData] = useState<dvat04 | null>(null);
  const [monthlyChallanData, setMonthlyChallanData] = useState<
    MonthlyChallanSummary[]
  >([]);
  const [yearlyReturnAssessment, setYearlyReturnAssessment] = useState<
    YearlyReturnAssessment[]
  >([]);
  const [selectedGroup, setSelectedGroup] = useState<
    "all" | "paid" | "pending"
  >("all");
  const [monthlySalePurchaseData, setMonthlySalePurchaseData] = useState<
    MonthlySalePurchaseSummary[]
  >([]);
  const [monthlySaleLossReport, setMonthlySaleLossReport] = useState<
    MonthlySaleLossReport[]
  >([]);

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

  const calculateChallanSummary = (challans: DvatChallanWithRelations[]) => {
    const monthlyMap = new Map<string, MonthlyChallanSummary>();
    const yearlyMap = new Map<number, YearlyChallanSummary>();

    for (const challan of challans) {
      if (!challan.returns_01) continue;

      const year = parseInt(challan.returns_01.year);
      const month = challan.returns_01.month;

      // Skip if month is null
      if (!month) continue;

      const monthIndex = monthNames.indexOf(month);

      if (monthIndex === -1) continue;

      const displayYear = monthIndex < 3 ? year + 1 : year;
      const displayLabel = `${month} ${displayYear}`;
      const mapKey = `${year}-${monthIndex}`;

      const vat = parseAmount(challan.vat);
      const interest = parseAmount(challan.interest);
      const penalty = parseAmount(challan.penalty);
      const latefees = parseAmount(challan.latefees);
      const others = parseAmount(challan.others);
      const total = parseAmount(challan.total_tax_amount);
      const isPaid = challan.paymentstatus === "PAID" ? 1 : 0;

      // Monthly summary
      if (monthlyMap.has(mapKey)) {
        const existing = monthlyMap.get(mapKey)!;
        existing.paidCount += isPaid;
        existing.totalVat += vat;
        existing.totalInterest += interest;
        existing.totalPenalty += penalty;
        existing.totalOthers += others;
        existing.totalAmount += total;
      } else {
        monthlyMap.set(mapKey, {
          year: year,
          month: month,
          monthIndex: monthIndex,
          displayLabel: displayLabel,
          paidCount: isPaid,
          totalVat: vat,
          totalInterest: interest,
          totalPenalty: penalty,
          totalOthers: others,
          totalAmount: total,
        });
      }

      // Yearly summary
      if (yearlyMap.has(year)) {
        const existing = yearlyMap.get(year)!;
        existing.paidCount += isPaid;
        existing.totalVat += vat;
        existing.totalInterest += interest;
        existing.totalPenalty += penalty;
        existing.totalAmount += total;
      } else {
        yearlyMap.set(year, {
          year: year,
          paidCount: isPaid,
          totalVat: vat,
          totalInterest: interest,
          totalPenalty: penalty,
          totalAmount: total,
        });
      }
    }

    const monthlyArray = Array.from(monthlyMap.values());
    monthlyArray.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.monthIndex - a.monthIndex;
    });

    setMonthlyChallanData(monthlyArray);
  };

  const calculateReturnAssessment = async (
    returnData: Array<return_filing & { dvat: dvat04 }>,
  ) => {
    const years: number[] = returnData.map((item) => parseInt(item.year));
    const uniqueYears: number[] = years.filter((value, index, self) => {
      return self.indexOf(value) === index;
    });

    const assessmentResult: YearlyReturnAssessment[] = [];

    for (const year of uniqueYears) {
      let lateFiledCount = 0;
      let filedCount = 0;
      let dueCount = 0;
      let pendingCount = 0;

      for (let i = 0; i < 12; i++) {
        const adjustedMonth = i % 12;

        const getdata: (return_filing & { dvat: dvat04 }) | undefined =
          returnData.find(
            (item: return_filing & { dvat: dvat04 }) =>
              item.year == year.toString() &&
              item.month == monthNames[adjustedMonth],
          );

        if (getdata) {
          if (getdata.filing_status) {
            // Filed
            if (getdata.due_date! > getdata.filing_date!) {
              // On time filing
              filedCount++;
            } else {
              // Late filing
              lateFiledCount++;
            }
          } else {
            // Not filed
            const currentdate = new Date();
            if (getdata.due_date! < currentdate) {
              pendingCount++;
            } else {
              dueCount++;
            }
          }
        }
      }

      assessmentResult.push({
        year: year,
        late_filed: lateFiledCount,
        filed: filedCount,
        due: dueCount,
        pending: pendingCount,
      });
    }

    // Sort by year in descending order
    assessmentResult.sort((a, b) => b.year - a.year);
    setYearlyReturnAssessment(assessmentResult);
  };

  const calculateSaleLossReport = async (
    dailySalesData: Array<{
      id: number;
      invoice_number: string;
      invoice_date: Date;
      quantity: number;
      vatamount: string;
      amount_unit: string;
      commodity_master: {
        product_name: string;
        sale_price: string;
        taxable_at: string;
        crate_size: number;
      };
    }>,
  ) => {
    const monthlyMap = new Map<string, MonthlySaleLossReport>();

    for (const sale of dailySalesData) {
      const invoiceDate = new Date(sale.invoice_date);
      const year = invoiceDate.getFullYear();
      const month = invoiceDate.getMonth();
      const monthName = monthNames[month];
      const displayLabel = `${monthName} ${year}`;
      const mapKey = `${year}-${month}`;

      // Calculate VAT per unit (sale_price is inclusive of VAT)
      // VAT = sale_price * (taxable_at / (100 + taxable_at))
      const commodityPrice =
        parseFloat(sale.commodity_master.sale_price || "0") /
        sale.commodity_master.crate_size;
      const taxablePercent = parseFloat(
        sale.commodity_master.taxable_at || "0",
      );
      const commodityVat =
        ((commodityPrice * taxablePercent) / (100 + taxablePercent)) *
        sale.quantity;
      const saleVat = parseFloat(sale.vatamount || "0");

      // Only check if there's a VAT loss (commodity VAT > sale VAT)
      if (commodityVat > saleVat) {
        const vatLossPerUnit = commodityVat - saleVat;
        const vatLossPercentage = (vatLossPerUnit / commodityVat) * 100;

        // Only include if VAT loss is <= 10%
        if (vatLossPercentage >= 10) {
          const totalVatLoss = vatLossPerUnit;

          if (monthlyMap.has(mapKey)) {
            const existing = monthlyMap.get(mapKey)!;
            existing.totalVatLoss += totalVatLoss;
            existing.totalVatLossQuantity += sale.quantity;
            existing.itemsWithVatLoss.push({
              invoiceNumber: sale.invoice_number,
              invoiceDate: sale.invoice_date,
              commodity: sale.commodity_master.product_name,
              quantity: sale.quantity,
              commodityPrice: commodityPrice,
              salePrice: parseFloat(sale.amount_unit || "0"),
              commodityVat: commodityVat,
              saleVat: saleVat,
              vatLossPerUnit: vatLossPerUnit,
              vatLossPercentage: vatLossPercentage,
              totalVatLoss: totalVatLoss,
            });
          } else {
            monthlyMap.set(mapKey, {
              year: year,
              month: monthName,
              monthIndex: month,
              displayLabel: displayLabel,
              totalVatLoss: totalVatLoss,
              totalVatLossQuantity: sale.quantity,
              averageVatLossPercentage: vatLossPercentage,
              itemsWithVatLoss: [
                {
                  invoiceNumber: sale.invoice_number,
                  invoiceDate: sale.invoice_date,
                  commodity: sale.commodity_master.product_name,
                  quantity: sale.quantity,
                  commodityPrice: commodityPrice,
                  salePrice: parseFloat(sale.amount_unit || "0"),
                  commodityVat: commodityVat,
                  saleVat: saleVat,
                  vatLossPerUnit: vatLossPerUnit,
                  vatLossPercentage: vatLossPercentage,
                  totalVatLoss: totalVatLoss,
                },
              ],
            });
          }
        }
      }
    }

    const reportArray = Array.from(monthlyMap.values());
    // Calculate average VAT loss percentage for each month
    reportArray.forEach((month) => {
      const totalPercentage = month.itemsWithVatLoss.reduce(
        (sum, item) => sum + item.vatLossPercentage,
        0,
      );
      month.averageVatLossPercentage =
        month.itemsWithVatLoss.length > 0
          ? totalPercentage / month.itemsWithVatLoss.length
          : 0;
    });

    reportArray.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.monthIndex - a.monthIndex;
    });

    setMonthlySaleLossReport(reportArray);
  };

  const generateAssessmentSummary = (): string => {
    let summary = "";

    // 1. Month-wise Challan Summary
    summary += "📊 MONTH-WISE CHALLAN SUMMARY\n";
    summary += "═".repeat(50) + "\n";
    if (monthlyChallanData.length > 0) {
      summary += `Total Months: ${monthlyChallanData.length}\n`;
      const totalChallansPaid = monthlyChallanData.reduce(
        (sum, m) => sum + m.paidCount,
        0,
      );
      const totalChallanVat = monthlyChallanData.reduce(
        (sum, m) => sum + m.totalVat,
        0,
      );
      const totalChallanInterest = monthlyChallanData.reduce(
        (sum, m) => sum + m.totalInterest,
        0,
      );
      const totalChallanPenalty = monthlyChallanData.reduce(
        (sum, m) => sum + m.totalPenalty,
        0,
      );
      const totalChallanAmount = monthlyChallanData.reduce(
        (sum, m) => sum + m.totalAmount,
        0,
      );

      const challanFlag =
        totalChallanInterest + totalChallanPenalty > 1 ? " ⚠️" : "";

      summary += `Total Challans Paid: ${totalChallansPaid}\n`;
      summary += `Total VAT: ${formatINR(totalChallanVat)}\n`;
      summary += `Total Interest: ${formatINR(totalChallanInterest)}\n`;
      summary += `Total Penalty: ${formatINR(totalChallanPenalty)}${challanFlag}\n`;
      summary += `Total Amount: ${formatINR(totalChallanAmount)}\n`;
      summary += `Latest Month: ${monthlyChallanData[0]?.displayLabel}\n`;
    } else {
      summary += "No challan data available\n";
    }
    summary += "\n";

    // 2. Year-wise Return Filing Assessment
    summary += "📅 YEAR-WISE RETURN FILING ASSESSMENT\n";
    summary += "═".repeat(50) + "\n";
    if (yearlyReturnAssessment.length > 0) {
      summary += `Total Years: ${yearlyReturnAssessment.length}\n`;
      const totalFiled = yearlyReturnAssessment.reduce(
        (sum, y) => sum + y.filed,
        0,
      );
      const totalLateFiled = yearlyReturnAssessment.reduce(
        (sum, y) => sum + y.late_filed,
        0,
      );
      const totalDue = yearlyReturnAssessment.reduce(
        (sum, y) => sum + y.due,
        0,
      );
      const totalPending = yearlyReturnAssessment.reduce(
        (sum, y) => sum + y.pending,
        0,
      );
      const totalReturns =
        totalFiled + totalLateFiled + totalDue + totalPending;

      const lateFlag = totalLateFiled > 1 ? " ⚠️" : "";
      const pendingFlag = totalPending > 1 ? " 🚩" : "";

      summary += `Total Returns: ${totalReturns}\n`;
      summary += `On-Time Filed: ${totalFiled} (${totalReturns > 0 ? ((totalFiled / totalReturns) * 100).toFixed(1) : 0}%)\n`;
      summary += `Late Filed: ${totalLateFiled} (${totalReturns > 0 ? ((totalLateFiled / totalReturns) * 100).toFixed(1) : 0}%)${lateFlag}\n`;
      summary += `Due: ${totalDue} (${totalReturns > 0 ? ((totalDue / totalReturns) * 100).toFixed(1) : 0}%)\n`;
      summary += `Pending: ${totalPending} (${totalReturns > 0 ? ((totalPending / totalReturns) * 100).toFixed(1) : 0}%)${pendingFlag}\n`;
      summary += `Year Range: ${yearlyReturnAssessment[yearlyReturnAssessment.length - 1]?.year} - ${yearlyReturnAssessment[0]?.year}\n`;
    } else {
      summary += "No return filing data available\n";
    }
    summary += "\n";

    // 3. Month-wise Sales & Purchases
    summary += "💰 MONTH-WISE SALES & PURCHASES\n";
    summary += "═".repeat(50) + "\n";
    if (monthlySalePurchaseData.length > 0) {
      summary += `Total Months: ${monthlySalePurchaseData.length}\n`;
      const totalSalesCount = monthlySalePurchaseData.reduce(
        (sum, m) => sum + m.salesCount,
        0,
      );
      const totalSalesAmount = monthlySalePurchaseData.reduce(
        (sum, m) => sum + m.salesTotalAmount,
        0,
      );
      const totalSalesVat = monthlySalePurchaseData.reduce(
        (sum, m) => sum + m.salesTotalVat,
        0,
      );
      const totalPurchaseCount = monthlySalePurchaseData.reduce(
        (sum, m) => sum + m.purchaseCount,
        0,
      );
      const totalPurchaseAmount = monthlySalePurchaseData.reduce(
        (sum, m) => sum + m.purchaseTotalAmount,
        0,
      );
      const totalPurchaseVat = monthlySalePurchaseData.reduce(
        (sum, m) => sum + m.purchaseTotalVat,
        0,
      );
      const returnsFiled = monthlySalePurchaseData.filter(
        (m) => m.returnsFiled,
      ).length;

      const totalFiled = yearlyReturnAssessment.reduce(
        (sum, y) => sum + y.filed,
        0,
      );
      const totalLateFiled = yearlyReturnAssessment.reduce(
        (sum, y) => sum + y.late_filed,
        0,
      );
      const totalDue = yearlyReturnAssessment.reduce(
        (sum, y) => sum + y.due,
        0,
      );
      const totalPending = yearlyReturnAssessment.reduce(
        (sum, y) => sum + y.pending,
        0,
      );
      const totalReturns = totalFiled + totalLateFiled + totalPending;

      const vatFlag = totalSalesVat < totalPurchaseVat ? " 🚩" : "";
      let returnsFlag = "";
      if (totalReturns - 1 == returnsFiled) {
        returnsFlag = " ⚠️";
      } else if (totalReturns == returnsFiled) {
        returnsFlag = " ✅";
      } else {
        returnsFlag = " 🚩";
      }
      // if (totalPending >= 4) {
      //   if (returnsFiled === 2) {
      //     returnsFlag = " 🚩";
      //   } else if (returnsFiled === 3) {
      //     returnsFlag = " ⚠️";
      //   }
      // }

      summary += `Sales Count: ${totalSalesCount}\n`;
      summary += `Sales Amount: ${formatINR(totalSalesAmount)}\n`;
      summary += `Sales VAT: ${formatINR(totalSalesVat)}${vatFlag}\n`;
      summary += `Purchase Count: ${totalPurchaseCount}\n`;
      summary += `Purchase Amount: ${formatINR(totalPurchaseAmount)}\n`;
      summary += `Purchase VAT: ${formatINR(totalPurchaseVat)}${vatFlag}\n`;
      summary += `Returns Filed: ${returnsFiled}/${totalReturns} months${returnsFlag}\n`;
    } else {
      summary += "No sales and purchase data available\n";
    }
    summary += "\n";

    // 4. Month-wise VAT Loss Report
    summary += "⚠️  MONTH-WISE VAT LOSS REPORT\n";
    summary += "═".repeat(50) + "\n";
    if (monthlySaleLossReport.length > 0) {
      summary += `Months with VAT Loss: ${monthlySaleLossReport.length}\n`;
      const totalVatLoss = monthlySaleLossReport.reduce(
        (sum, m) => sum + m.totalVatLoss,
        0,
      );
      const totalLossQuantity = monthlySaleLossReport.reduce(
        (sum, m) => sum + m.totalVatLossQuantity,
        0,
      );
      const totalLossInvoices = monthlySaleLossReport.reduce(
        (sum, m) => sum + m.itemsWithVatLoss.length,
        0,
      );
      const avgVatLossPercent =
        monthlySaleLossReport.length > 0
          ? (
              monthlySaleLossReport.reduce(
                (sum, m) => sum + m.averageVatLossPercentage,
                0,
              ) / monthlySaleLossReport.length
            ).toFixed(2)
          : "0.00";

      summary += `Total VAT Loss: ${formatINR(totalVatLoss)}\n`;
      summary += `Total Affected Quantity: ${totalLossQuantity}\n`;
      summary += `Affected Invoices: ${totalLossInvoices}\n`;
      summary += `Average Loss %: ${avgVatLossPercent}%\n`;
    } else {
      summary +=
        "No VAT loss detected (All sales have VAT within acceptable range)\n";
    }
    summary += "\n";

    summary +=
      "═".repeat(50) +
      "\n\nNote: This is a comprehensive overview of all assessment data.\n";
    summary +=
      "Navigate to individual tabs for detailed month/year-wise breakdowns.";

    return summary;
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const dvat_response = await GetDvat04({
          id: dvat04id,
        });
        if (dvat_response.status && dvat_response.data) {
          setDvatData(dvat_response.data);
        }

        // Fetch all challans for this DVAT
        const challan_response = await GetDvatChallan({
          dvatid: dvat04id,
          paymentstatus: "PAID",
          skip: 0,
          take: 10000, // Get all challans
        });

        if (challan_response.status && challan_response.data?.result) {
          const challengData = challan_response.data
            .result as DvatChallanWithRelations[];
          calculateChallanSummary(challengData);
        }

        // Fetch return filing data
        const returnmonth_response = await GetReturnMonth({
          dvatid: dvat04id,
        });

        let returnData: Array<return_filing & { dvat: dvat04 }> = [];
        if (returnmonth_response.status && returnmonth_response.data) {
          returnData = returnmonth_response.data;
          await calculateReturnAssessment(returnData);
        }

        // Fetch monthly sale and purchase summary
        const salePurchaseResponse = await GetMonthlySaleAndPurchaseSummary({
          dvatid: dvat04id,
        });

        if (salePurchaseResponse.status && salePurchaseResponse.data) {
          const enrichedData = salePurchaseResponse.data.map((item) => {
            // Check if returns are filed for this month
            const returnsFiled = returnData.some(
              (ret) =>
                ret.year === item.year.toString() &&
                ret.month === item.monthName &&
                ret.filing_status === true,
            );

            return {
              ...item,
              returnsFiled: returnsFiled,
            };
          });
          setMonthlySalePurchaseData(enrichedData);
        }

        // Fetch daily sales data for loss analysis
        const dailySalesResponse = await GetDailySaleWithLossAnalysis({
          dvatid: dvat04id,
        });

        if (dailySalesResponse.status && dailySalesResponse.data) {
          await calculateSaleLossReport(dailySalesResponse.data);
        }
      } catch (error) {
        console.error("Error loading assessment data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [dvat04id]);

  if (isLoading) {
    return (
      <div className="h-screen w-full grid place-items-center">
        <Spin size="large" />
      </div>
    );
  }

  // Filter data based on selected group
  const getFilteredMonthlyData = () => {
    if (selectedGroup === "all") return monthlyChallanData;
    if (selectedGroup === "paid") {
      return monthlyChallanData.filter((item) => item.paidCount > 0);
    }
    if (selectedGroup === "pending") {
      return monthlyChallanData.filter((item) => item.paidCount === 0);
    }
    return monthlyChallanData;
  };

  const filteredData = getFilteredMonthlyData();

  const monthlyColumns = [
    {
      title: "Month - Year",
      dataIndex: "displayLabel",
      key: "displayLabel",
      width: 150,
      render: (text: string) => <span className="font-medium">{text}</span>,
    },
    {
      title: "Paid Count",
      dataIndex: "paidCount",
      key: "paidCount",
      align: "center" as const,
      width: 110,
      render: (text: number) => (
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-700 font-semibold">
          {text}
        </span>
      ),
    },
    {
      title: "Total VAT",
      dataIndex: "totalVat",
      key: "totalVat",
      align: "right" as const,
      width: 130,
      render: (text: number) => <span>{formatINR(text)}</span>,
    },
    {
      title: "Interest",
      dataIndex: "totalInterest",
      key: "totalInterest",
      align: "right" as const,
      width: 130,
      render: (text: number) => <span>{formatINR(text)}</span>,
    },
    {
      title: "Penalty",
      dataIndex: "totalPenalty",
      key: "totalPenalty",
      align: "right" as const,
      width: 130,
      render: (text: number) => <span>{formatINR(text)}</span>,
    },
    {
      title: "Others",
      dataIndex: "totalOthers",
      key: "totalOthers",
      align: "right" as const,
      width: 130,
      render: (text: number) => <span>{formatINR(text)}</span>,
    },
    {
      title: "Total Amount",
      dataIndex: "totalAmount",
      key: "totalAmount",
      align: "right" as const,
      width: 150,
      render: (text: number) => (
        <span className="font-semibold text-blue-700">{formatINR(text)}</span>
      ),
    },
  ];

  const yearlyReturnColumns = [
    {
      title: "Year",
      dataIndex: "year",
      key: "year",
      align: "center" as const,
      width: 100,
      render: (text: number) => <span className="font-semibold">{text}</span>,
    },
    {
      title: "Filed (On Time)",
      dataIndex: "filed",
      key: "filed",
      align: "center" as const,
      width: 130,
      render: (text: number) => (
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-700 font-semibold">
          {text}
        </span>
      ),
    },
    {
      title: "Late Filed",
      dataIndex: "late_filed",
      key: "late_filed",
      align: "center" as const,
      width: 130,
      render: (text: number) => (
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-700 font-semibold">
          {text}
        </span>
      ),
    },
    {
      title: "Due",
      dataIndex: "due",
      key: "due",
      align: "center" as const,
      width: 100,
      render: (text: number) => (
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold">
          {text}
        </span>
      ),
    },
    {
      title: "Pending",
      dataIndex: "pending",
      key: "pending",
      align: "center" as const,
      width: 100,
      render: (text: number) => (
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-700 font-semibold">
          {text}
        </span>
      ),
    },
  ];

  const salePurchaseColumns = [
    {
      title: "Month",
      dataIndex: "monthName",
      key: "month",
      width: 120,
      render: (text: string, record: any) => (
        <span className="font-medium">
          {text} {record.year}
        </span>
      ),
    },
    {
      title: "Sales Count",
      dataIndex: "salesCount",
      key: "salesCount",
      align: "center" as const,
      width: 100,
      render: (text: number) => (
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold">
          {text}
        </span>
      ),
    },
    {
      title: "Sales Amount",
      dataIndex: "salesTotalAmount",
      key: "salesTotalAmount",
      align: "right" as const,
      width: 130,
      render: (value: number) => <span>{formatINR(value)}</span>,
    },
    {
      title: "Sales VAT",
      dataIndex: "salesTotalVat",
      key: "salesTotalVat",
      align: "right" as const,
      width: 130,
      render: (value: number) => <span>{formatINR(value)}</span>,
    },
    {
      title: "Purchase Count",
      dataIndex: "purchaseCount",
      key: "purchaseCount",
      align: "center" as const,
      width: 120,
      render: (text: number) => (
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-700 font-semibold">
          {text}
        </span>
      ),
    },
    {
      title: "Purchase Amount",
      dataIndex: "purchaseTotalAmount",
      key: "purchaseTotalAmount",
      align: "right" as const,
      width: 140,
      render: (value: number) => <span>{formatINR(value)}</span>,
    },
    {
      title: "Purchase VAT",
      dataIndex: "purchaseTotalVat",
      key: "purchaseTotalVat",
      align: "right" as const,
      width: 130,
      render: (value: number) => <span>{formatINR(value)}</span>,
    },
    {
      title: "Diff Amount",
      key: "totalAmount",
      align: "right" as const,
      width: 130,
      render: (_: unknown, record: any) =>
        formatINR(record.salesTotalAmount - record.purchaseTotalAmount),
    },
    {
      title: "Diff VAT",
      key: "totalVat",
      align: "right" as const,
      width: 130,
      render: (_: unknown, record: any) =>
        formatINR(record.salesTotalVat - record.purchaseTotalVat),
    },
    {
      title: "Returns Filed",
      dataIndex: "returnsFiled",
      key: "returnsFiled",
      align: "center" as const,
      width: 120,
      render: (filed: boolean) =>
        filed ? (
          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-semibold">
            ✓ Yes
          </span>
        ) : (
          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-semibold">
            ✕ No
          </span>
        ),
    },
  ];

  const saleLossReportColumns = [
    {
      title: "Month",
      dataIndex: "displayLabel",
      key: "displayLabel",
      width: 120,
      render: (text: string) => <span className="font-medium">{text}</span>,
    },
    {
      title: "Total VAT Loss",
      dataIndex: "totalVatLoss",
      key: "totalVatLoss",
      align: "right" as const,
      width: 150,
      render: (value: number) => (
        <span className="font-semibold text-red-700">{formatINR(value)}</span>
      ),
    },
    {
      title: "Total Loss Quantity",
      dataIndex: "totalVatLossQuantity",
      key: "totalVatLossQuantity",
      align: "center" as const,
      width: 130,
      render: (text: number) => (
        <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-orange-100 text-orange-700 font-semibold">
          {text}
        </span>
      ),
    },
    {
      title: "Avg VAT Loss %",
      dataIndex: "averageVatLossPercentage",
      key: "averageVatLossPercentage",
      align: "center" as const,
      width: 120,
      render: (text: number) => (
        <span className="font-medium">{text.toFixed(2)}%</span>
      ),
    },
    {
      title: "Invoice Count",
      key: "invoiceCount",
      align: "center" as const,
      width: 120,
      render: (_: unknown, record: any) => (
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold">
          {record.itemsWithVatLoss.length}
        </span>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-5/6 mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => router.back()}
            className="text-lg"
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Assessment</h1>
            <p className="text-sm text-gray-600">
              {dvatData?.tinNumber} - {dvatData?.tradename}
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            <div
              onClick={() => setSelectedGroup("all")}
              className={`p-4 rounded-lg cursor-pointer border-2 transition-all ${
                selectedGroup === "all"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <p className="text-xs text-gray-600 mb-1">Total Challans</p>
              <p className="text-2xl font-semibold text-gray-900">
                {monthlyChallanData.reduce(
                  (sum, item) => sum + item.paidCount,
                  0,
                )}
              </p>
            </div>
            <div className="p-4 rounded-lg border-2 border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Total VAT</p>
              <p className="text-lg font-semibold text-blue-700">
                {formatINR(
                  monthlyChallanData.reduce(
                    (sum, item) => sum + item.totalVat,
                    0,
                  ),
                )}
              </p>
            </div>
            <div className="p-4 rounded-lg border-2 border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Total Interest</p>
              <p className="text-lg font-semibold text-orange-700">
                {formatINR(
                  monthlyChallanData.reduce(
                    (sum, item) => sum + item.totalInterest,
                    0,
                  ),
                )}
              </p>
            </div>
            <div className="p-4 rounded-lg border-2 border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Total Penalty</p>
              <p className="text-lg font-semibold text-red-700">
                {formatINR(
                  monthlyChallanData.reduce(
                    (sum, item) => sum + item.totalPenalty,
                    0,
                  ),
                )}
              </p>
            </div>
            <div className="p-4 rounded-lg border-2 border-gray-200">
              <p className="text-xs text-gray-600 mb-1">Grand Total</p>
              <p className="text-lg font-semibold text-green-700">
                {formatINR(
                  monthlyChallanData.reduce(
                    (sum, item) => sum + item.totalAmount,
                    0,
                  ),
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs for Monthly and Yearly View */}
        <Card className="shadow-sm border border-gray-200">
          <Tabs
            defaultActiveKey="summary"
            items={[
              {
                key: "summary",
                label: "📋 Assessment Summary",
                children: (
                  <div>
                    <div className="mb-6">
                      <h2 className="text-xl font-bold text-gray-900 mb-4">
                        Assessment Summary Report
                      </h2>
                      <div className="bg-linear-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                        <pre className="whitespace-pre-wrap text-sm font-mono text-gray-800 leading-relaxed">
                          {generateAssessmentSummary()}
                        </pre>
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                key: "monthly",
                label: "Month-wise Challan Summary",
                children: (
                  <div>
                    <div className="mb-4">
                      <h2 className="text-lg font-semibold text-gray-900">
                        Month-wise Challan Summary
                      </h2>
                    </div>

                    {filteredData.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table
                          columns={monthlyColumns}
                          dataSource={filteredData.map((item, index) => ({
                            ...item,
                            key: index,
                          }))}
                          pagination={{
                            pageSize: 15,
                            showSizeChanger: true,
                            showTotal: (total) => `Total ${total} months`,
                          }}
                          size="large"
                          bordered
                          className="bg-white"
                        />
                      </div>
                    ) : (
                      <Empty
                        description="No challan data available"
                        style={{ marginTop: "50px", marginBottom: "50px" }}
                      />
                    )}
                  </div>
                ),
              },
              {
                key: "yearlyReturn",
                label: "Year-wise Return Filing Assessment",
                children: (
                  <div>
                    <div className="mb-4">
                      <h2 className="text-lg font-semibold text-gray-900">
                        Year-wise Return Filing Assessment
                      </h2>
                    </div>

                    {yearlyReturnAssessment.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table
                          columns={yearlyReturnColumns}
                          dataSource={yearlyReturnAssessment.map(
                            (item, index) => ({
                              ...item,
                              key: index,
                            }),
                          )}
                          pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            showTotal: (total) => `Total ${total} years`,
                          }}
                          size="large"
                          bordered
                          className="bg-white"
                        />
                      </div>
                    ) : (
                      <Empty
                        description="No return filing data available"
                        style={{ marginTop: "50px", marginBottom: "50px" }}
                      />
                    )}
                  </div>
                ),
              },
              {
                key: "salePurchase",
                label: "Month-wise Sales & Purchases",
                children: (
                  <div>
                    <div className="mb-4">
                      <h2 className="text-lg font-semibold text-gray-900">
                        Month-wise Sales & Purchases Summary
                      </h2>
                    </div>

                    {monthlySalePurchaseData.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table
                          columns={salePurchaseColumns}
                          dataSource={monthlySalePurchaseData.map(
                            (item, index) => ({
                              ...item,
                              key: index,
                            }),
                          )}
                          pagination={{
                            pageSize: 12,
                            showSizeChanger: true,
                            showTotal: (total) => `Total ${total} months`,
                          }}
                          size="large"
                          bordered
                          className="bg-white"
                        />
                      </div>
                    ) : (
                      <Empty
                        description="No sales and purchase data available"
                        style={{ marginTop: "50px", marginBottom: "50px" }}
                      />
                    )}
                  </div>
                ),
              },
              {
                key: "saleLossReport",
                label: "Month-wise VAT Loss Report",
                children: (
                  <div>
                    <div className="mb-4">
                      <h2 className="text-lg font-semibold text-gray-900">
                        Month-wise VAT Loss Report (&gt;10% VAT Loss)
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        This report identifies sales where the VAT charged is
                        less than the commodity standard VAT by 10% or more.
                      </p>
                    </div>

                    {monthlySaleLossReport.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table
                          columns={saleLossReportColumns}
                          dataSource={monthlySaleLossReport.map(
                            (item, index) => ({
                              ...item,
                              key: index,
                            }),
                          )}
                          pagination={{
                            pageSize: 12,
                            showSizeChanger: true,
                            showTotal: (total) => `Total ${total} months`,
                          }}
                          size="large"
                          bordered
                          className="bg-white"
                          expandable={{
                            expandedRowRender: (record: any) => (
                              <Table
                                columns={[
                                  {
                                    title: "Invoice #",
                                    dataIndex: "invoiceNumber",
                                    key: "invoiceNumber",
                                    width: 120,
                                  },
                                  {
                                    title: "Date",
                                    dataIndex: "invoiceDate",
                                    key: "invoiceDate",
                                    width: 100,
                                    render: (date: Date) =>
                                      new Date(date).toLocaleDateString(),
                                  },
                                  {
                                    title: "Commodity",
                                    dataIndex: "commodity",
                                    key: "commodity",
                                    width: 150,
                                  },
                                  {
                                    title: "Qty",
                                    dataIndex: "quantity",
                                    key: "quantity",
                                    align: "center" as const,
                                    width: 80,
                                  },
                                  {
                                    title: "Commodity Price",
                                    dataIndex: "commodityPrice",
                                    key: "commodityPrice",
                                    align: "right" as const,
                                    width: 130,
                                    render: (value: number) => formatINR(value),
                                  },
                                  {
                                    title: "Sale Price",
                                    dataIndex: "salePrice",
                                    key: "salePrice",
                                    align: "right" as const,
                                    width: 130,
                                    render: (value: number) => formatINR(value),
                                  },
                                  {
                                    title: "Commodity VAT",
                                    dataIndex: "commodityVat",
                                    key: "commodityVat",
                                    align: "right" as const,
                                    width: 140,
                                    render: (value: number) => formatINR(value),
                                  },
                                  {
                                    title: "Sale VAT",
                                    dataIndex: "saleVat",
                                    key: "saleVat",
                                    align: "right" as const,
                                    width: 130,
                                    render: (value: number) => formatINR(value),
                                  },
                                  //   {
                                  //     title: "VAT Loss/Unit",
                                  //     dataIndex: "vatLossPerUnit",
                                  //     key: "vatLossPerUnit",
                                  //     align: "right" as const,
                                  //     width: 130,
                                  //     render: (value: number) => formatINR(value),
                                  //   },
                                  {
                                    title: "VAT Loss %",
                                    dataIndex: "vatLossPercentage",
                                    key: "vatLossPercentage",
                                    align: "center" as const,
                                    width: 110,
                                    render: (value: number) =>
                                      `${value.toFixed(2)}%`,
                                  },
                                  {
                                    title: "Total VAT Loss",
                                    dataIndex: "totalVatLoss",
                                    key: "totalVatLoss",
                                    align: "right" as const,
                                    width: 150,
                                    render: (value: number) => (
                                      <span className="font-semibold text-red-700">
                                        {formatINR(value)}
                                      </span>
                                    ),
                                  },
                                ]}
                                dataSource={record.itemsWithVatLoss.map(
                                  (item: any, idx: number) => ({
                                    ...item,
                                    key: idx,
                                  }),
                                )}
                                pagination={false}
                                size="small"
                              />
                            ),
                          }}
                        />
                      </div>
                    ) : (
                      <Empty
                        description="No sales with VAT loss ≤10% found"
                        style={{ marginTop: "50px", marginBottom: "50px" }}
                      />
                    )}
                  </div>
                ),
              },
            ]}
          />
        </Card>
      </div>
    </div>
  );
};

export default AssessmentPage;
