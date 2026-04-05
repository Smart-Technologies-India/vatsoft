"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { dvat04, first_stock, user } from "@prisma/client";
import { toast } from "react-toastify";
import { Button, Input as AntInput, Modal } from "antd";

import GetUser from "@/action/user/getuser";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import GetDvatByOffice from "@/action/return/getdvatbyoffice";
import getCurrentFyMetricsBulk from "@/action/return/getcurrentfymetricsbulk";
import CreateComposition from "@/action/composition/createcomposition";
import GetUserComposition from "@/action/composition/getusercompositon";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ChangeType = "Composition to Regular" | "Quarterly to Monthly";

type DealerRegistrationChangeRow = dvat04 & {
  first_stock: first_stock[];
  annualTurnover: number;
  lastFinancialYearTurnover: number;
  hasLastFinancialYearTurnoverData: boolean;
  taxLiability: number;
  changeType: ChangeType;
  changeReason: string;
};

const COMPOSITION_LIMIT = 50_00_000;
const QUARTERLY_TURNOVER_LIMIT = 5_00_00_000;
const TAX_LIABILITY_LIMIT = 1_00_000;

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(value);
};

const getCurrentFinancialYearStart = (date: Date): number => {
  const month = date.getMonth();
  const year = date.getFullYear();

  return month >= 6 ? year : year - 1;
};

const DealerRegistrationTypeChangePage = () => {
  const router = useRouter();

  const [rows, setRows] = useState<DealerRegistrationChangeRow[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number>(0);
  const [selectedRow, setSelectedRow] =
    useState<DealerRegistrationChangeRow | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnoverLastFinancialYear, setTurnoverLastFinancialYear] =
    useState("");
  const [turnoverCurrentFinancialYear, setTurnoverCurrentFinancialYear] =
    useState("");
  const [taxLiability, setTaxLiability] = useState("");
  const [remark, setRemark] = useState("");

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRow(null);
    setTurnoverLastFinancialYear("");
    setTurnoverCurrentFinancialYear("");
    setTaxLiability("");
    setRemark("");
  };

  const openChangeModal = (row: DealerRegistrationChangeRow) => {
    setSelectedRow(row);
    const annualTurnoverValue = Math.max(0, Math.round(row.annualTurnover)).toString();
    const lastFinancialYearTurnover =
      row.hasLastFinancialYearTurnoverData
        ? Math.max(0, Math.round(row.lastFinancialYearTurnover)).toString()
        : (row.turnoverLastFinancialYear || "").toString().trim();

    setTurnoverLastFinancialYear(lastFinancialYearTurnover);
    setTurnoverCurrentFinancialYear(annualTurnoverValue);
    setTaxLiability(Math.max(0, Math.round(row.taxLiability)).toString());
    setRemark(row.changeReason);
    setIsModalOpen(true);
  };

  const submitChangeEntry = async () => {
    if (!selectedRow) {
      return;
    }

    if (!currentUserId) {
      toast.error("Unable to identify current user.");
      return;
    }

    if (!turnoverLastFinancialYear.trim() || !turnoverCurrentFinancialYear.trim()) {
      toast.error("Please enter both turnover fields.");
      return;
    }

    if (!taxLiability.trim()) {
      toast.error("Please enter tax liability.");
      return;
    }

    setIsSubmitting(true);

    try {
      const existingCompositionResponse = await GetUserComposition({
        dvatid: selectedRow.id,
      });

      if (
        existingCompositionResponse.status &&
        existingCompositionResponse.data &&
        existingCompositionResponse.data.length > 0
      ) {
        toast.error("Composition entry already exists for this dealer.");
        return;
      }

      const response = await CreateComposition({
        dvatid: selectedRow.id,
        createdby: currentUserId,
        compositionScheme:
          selectedRow.changeType === "Composition to Regular"
            ? false
            : Boolean(selectedRow.compositionScheme),
        turnoverLastFinancialYear: turnoverLastFinancialYear.trim(),
        turnoverCurrentFinancialYear: turnoverCurrentFinancialYear.trim(),
        taxLiability: taxLiability.trim(),
        remark: remark.trim() || selectedRow.changeReason,
      });

      if (!response.status) {
        toast.error(response.message || "Unable to create change entry.");
        return;
      }

      toast.success("Change entry added successfully.");
      closeModal();
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);

      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        router.push("/");
        return;
      }
      setCurrentUserId(authResponse.data);

      const userResponse = await GetUser({ id: authResponse.data });
      if (!userResponse.status || !userResponse.data?.selectOffice) {
        toast.error(userResponse.message || "Unable to load user office.");
        setIsLoading(false);
        return;
      }

      const reportResponse = await GetDvatByOffice({
        selectOffice: userResponse.data.selectOffice,
      });

      if (!reportResponse.status || !reportResponse.data) {
        toast.error(reportResponse.message || "Unable to load dealers.");
        setIsLoading(false);
        return;
      }

      const approvedDealers = reportResponse.data.filter(
        (dealer) => dealer.status === "APPROVED",
      );

      const currentFinancialYearStart = getCurrentFinancialYearStart(new Date());
      const previousFinancialYearStart = (currentFinancialYearStart - 1).toString();

      const metricsResponse = await getCurrentFyMetricsBulk({
        dvatids: approvedDealers.map((dealer) => dealer.id),
        fyStartYear: currentFinancialYearStart.toString(),
      });

      const previousFyMetricsResponse = await getCurrentFyMetricsBulk({
        dvatids: approvedDealers.map((dealer) => dealer.id),
        fyStartYear: previousFinancialYearStart,
      });

      if (!metricsResponse.status || !metricsResponse.data) {
        toast.error(metricsResponse.message || "Unable to load dealer metrics.");
        setIsLoading(false);
        return;
      }

      if (!previousFyMetricsResponse.status || !previousFyMetricsResponse.data) {
        toast.error(
          previousFyMetricsResponse.message ||
            "Unable to load previous FY dealer metrics.",
        );
        setIsLoading(false);
        return;
      }

      const metricsMap = new Map(
        metricsResponse.data.map((item) => [
          item.dvatid,
          {
            annualTurnover: item.annualTurnover,
            taxLiability: item.taxLiability,
          },
        ]),
      );

      const previousFyMetricsMap = new Map(
        previousFyMetricsResponse.data.map((item) => [
          item.dvatid,
          {
            annualTurnover: item.annualTurnover,
            hasTurnoverData: item.hasTurnoverData,
          },
        ]),
      );

      const enrichedDealers = approvedDealers
        .map((dealer) => {
          const metrics = metricsMap.get(dealer.id);
          const previousFyMetrics = previousFyMetricsMap.get(dealer.id);
          const annualTurnover = metrics?.annualTurnover ?? 0;
          const taxLiability = metrics?.taxLiability ?? 0;
          const lastFinancialYearTurnover = previousFyMetrics?.annualTurnover ?? 0;
          const hasLastFinancialYearTurnoverData =
            previousFyMetrics?.hasTurnoverData ?? false;

          const needsCompositionChange =
            Boolean(dealer.compositionScheme) && annualTurnover > COMPOSITION_LIMIT;
          const needsQuarterlyChange =
            dealer.frequencyFilings === "QUARTERLY" &&
            (annualTurnover > QUARTERLY_TURNOVER_LIMIT ||
              taxLiability > TAX_LIABILITY_LIMIT);

          if (!needsCompositionChange && !needsQuarterlyChange) {
            return null;
          }

          if (needsCompositionChange) {
            return {
              ...dealer,
              annualTurnover,
              lastFinancialYearTurnover,
              hasLastFinancialYearTurnoverData,
              taxLiability,
              changeType: "Composition to Regular" as const,
              changeReason: `Annual turnover exceeded Rs. 50 lakh in current FY.`,
            };
          }

          return {
            ...dealer,
            annualTurnover,
            lastFinancialYearTurnover,
            hasLastFinancialYearTurnoverData,
            taxLiability,
            changeType: "Quarterly to Monthly" as const,
            changeReason:
              annualTurnover > QUARTERLY_TURNOVER_LIMIT
                ? "Annual turnover exceeded Rs. 5 crore in current FY."
                : "Current FY tax liability exceeded Rs. 1 lakh.",
          };
        })
        .filter(
          (dealer): dealer is DealerRegistrationChangeRow => dealer !== null,
        );

      setRows(enrichedDealers);
      setIsLoading(false);
    };

    init();
  }, [router]);

  const filteredRows = useMemo(() => {
    const searchValue = search.toLowerCase().trim();

    if (!searchValue) {
      return rows;
    }

    return rows.filter((row) =>
      [row.tinNumber, row.tradename, row.contact_one, row.changeType]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(searchValue)),
    );
  }, [rows, search]);

  const compositionCount = rows.filter(
    (row) => row.changeType === "Composition to Regular",
  ).length;
  const quarterlyCount = rows.length - compositionCount;

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Dealer Registration Type Change Report
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-gray-600">
                Shows approved dealers who should move from composition to
                regular registration when current FY turnover exceeds Rs. 50
                lakh, or from quarterly to monthly filing when current FY
                turnover exceeds Rs. 5 crore or tax liability exceeds Rs. 1
                lakh.
              </p>
            </div>
            <button
              onClick={() => router.push("/dashboard/reports")}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              Back To Reports
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Total Dealers</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {rows.length}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Composition To Regular</p>
            <p className="mt-2 text-2xl font-semibold text-amber-600">
              {compositionCount}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Quarterly To Monthly</p>
            <p className="mt-2 text-2xl font-semibold text-blue-600">
              {quarterlyCount}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-4">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by TIN, trade name, contact, or change type"
              className="max-w-md"
            />
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>TIN No</TableHead>
                  <TableHead>Trade Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Current Type</TableHead>
                  <TableHead>Filing Frequency</TableHead>
                  <TableHead>Annual Turnover</TableHead>
                  <TableHead>Tax Liability</TableHead>
                  <TableHead>Required Change</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-10 text-center text-sm text-gray-500">
                      Loading report...
                    </TableCell>
                  </TableRow>
                ) : filteredRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-10 text-center text-sm text-gray-500">
                      No dealers matched the registration change rules.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium text-gray-900">
                        {row.tinNumber}
                      </TableCell>
                      <TableCell>{row.tradename}</TableCell>
                      <TableCell>{row.contact_one}</TableCell>
                      <TableCell>
                        {row.compositionScheme ? "Composition" : "Regular"}
                      </TableCell>
                      <TableCell>{row.frequencyFilings}</TableCell>
                      <TableCell>Rs. {formatCurrency(row.annualTurnover)}</TableCell>
                      <TableCell>Rs. {formatCurrency(row.taxLiability)}</TableCell>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => openChangeModal(row)}
                          className={`rounded-lg px-2.5 py-1 text-xs font-medium transition hover:opacity-80 cursor-pointer border-2 border-amber-600 ${
                            row.changeType === "Composition to Regular"
                              ? "bg-amber-100 text-amber-700 border-amber-600"
                              : "bg-blue-100 text-blue-700 border-blue-600"
                          }`}
                        >
                          {row.changeType}
                        </button>
                      </TableCell>
                      <TableCell>{row.changeReason}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <Modal
        title="Create Registration Change Entry"
        open={isModalOpen}
        onCancel={closeModal}
        footer={null}
        destroyOnClose
      >
        {selectedRow && (
          <div className="space-y-4">
            <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm">
              <p>
                <span className="font-medium">TIN:</span> {selectedRow.tinNumber}
              </p>
              <p>
                <span className="font-medium">Trade Name:</span> {selectedRow.tradename}
              </p>
              <p>
                <span className="font-medium">Required Change:</span> {selectedRow.changeType}
              </p>
              <p>
                <span className="font-medium">Reason:</span> {selectedRow.changeReason}
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Turnover Last Financial Year
              </label>
              <AntInput
                value={turnoverLastFinancialYear}
                onChange={(event) => setTurnoverLastFinancialYear(event.target.value)}
                placeholder="Enter turnover of last financial year"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Turnover Current Financial Year
              </label>
              <AntInput
                value={turnoverCurrentFinancialYear}
                onChange={(event) => setTurnoverCurrentFinancialYear(event.target.value)}
                placeholder="Enter turnover of current financial year"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Tax Liability
              </label>
              <AntInput
                value={taxLiability}
                onChange={(event) => setTaxLiability(event.target.value)}
                placeholder="Enter tax liability"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Remark
              </label>
              <AntInput.TextArea
                rows={3}
                value={remark}
                onChange={(event) => setRemark(event.target.value)}
                placeholder="Enter remark"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button onClick={closeModal}>Cancel</Button>
              <Button type="primary" loading={isSubmitting} onClick={submitChangeEntry}>
                Add Entry
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </main>
  );
};

export default DealerRegistrationTypeChangePage;