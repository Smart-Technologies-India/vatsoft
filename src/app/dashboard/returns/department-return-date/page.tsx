"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Button, Drawer, Input, Pagination, Select } from "antd";
import { Quarter, return_due } from "@prisma/client";

import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import GetReturnDues from "@/action/return/getreturndues";
import CreateReturnDue from "@/action/return/createreturndue";
import UpdateReturnDue from "@/action/return/updatereturndue";
import { formateDate } from "@/utils/methods";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ReturnDueFormState {
  id?: number;
  year: number;
  quarter: Quarter;
  month: number;
  payment: number;
  filing: number;
}

const QUARTER_OPTIONS: { value: Quarter; label: string }[] = [
  { value: Quarter.QUARTER1, label: "Q1" },
  { value: Quarter.QUARTER2, label: "Q2" },
  { value: Quarter.QUARTER3, label: "Q3" },
  { value: Quarter.QUARTER4, label: "Q4" },
];

const MONTH_OPTIONS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const getQuarterLabel = (quarter: Quarter): string => {
  const match = QUARTER_OPTIONS.find((item) => item.value === quarter);
  return match?.label ?? quarter;
};

const getMonthLabel = (month: number): string => {
  const match = MONTH_OPTIONS.find((item) => item.value === month);
  return match?.label ?? String(month);
};

const toDisplayDate = (year: number, month: number, day: number): string => {
  return formateDate(new Date(year, month, day));
};

// Edit is allowed only for the previous calendar month, and only before its payment due date.
// toDisplayDate uses new Date(year, month, day) where month is 1-indexed (i.e., month=4 → May).
const getEditAllowed = (row: return_due): boolean => {
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth() + 1; // 1-indexed

  let prevYear = todayYear;
  let prevMonth = todayMonth - 1;
  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear = todayYear - 1;
  }

  if (row.year !== prevYear || row.month !== prevMonth) {
    return false;
  }

  // payment due date uses same convention as toDisplayDate
  const paymentDueDate = new Date(row.year, row.month, row.payment);
  return today < paymentDueDate;
};

const initialFormState: ReturnDueFormState = {
  year: new Date().getFullYear(),
  quarter: Quarter.QUARTER1,
  month: 4,
  payment: 15,
  filing: 28,
};

const DepartmentReturnDatePage = () => {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [rows, setRows] = useState<Array<return_due>>([]);
  const [pagination, setPagination] = useState({ take: 10, skip: 0, total: 0 });

  const [searchInput, setSearchInput] = useState("");
  const [searchText, setSearchText] = useState("");
  const [filterYear, setFilterYear] = useState<number | undefined>(undefined);
  const [filterQuarter, setFilterQuarter] = useState<Quarter | undefined>(
    undefined,
  );

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const [addForm, setAddForm] = useState<ReturnDueFormState>(initialFormState);
  const [editForm, setEditForm] =
    useState<ReturnDueFormState>(initialFormState);

  const loadRows = async (
    take: number,
    skip: number,
    year?: number,
    quarter?: Quarter,
    search?: string,
  ) => {
    const response = await GetReturnDues({
      take,
      skip,
      year,
      quarter,
      search,
    });

    if (response.status && response.data.result) {
      setRows(response.data.result);
      setPagination({
        take: response.data.take,
        skip: response.data.skip,
        total: response.data.total,
      });
      return;
    }

    setRows([]);
    setPagination((prev) => ({ ...prev, total: 0, skip, take }));
    if (response.message) {
      toast.error(response.message);
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

      await loadRows(10, 0);
      setIsLoading(false);
    };

    init();
  }, []);

  const reloadCurrent = async () => {
    await loadRows(
      pagination.take,
      pagination.skip,
      filterYear,
      filterQuarter,
      searchText,
    );
  };

  const validateForm = (form: ReturnDueFormState): string | null => {
    if (
      !form.year ||
      Number.isNaN(form.year) ||
      form.year < 2000 ||
      form.year > 2100
    ) {
      return "Enter a valid year.";
    }

    if (form.month < 1 || form.month > 12) {
      return "Select a valid month.";
    }

    if (
      form.payment < 1 ||
      form.payment > 31 ||
      form.filing < 1 ||
      form.filing > 31
    ) {
      return "Payment/Filing day must be between 1 and 31.";
    }

    return null;
  };

  const onAdd = async () => {
    const validationError = validateForm(addForm);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsSaving(true);
    const response = await CreateReturnDue({
      year: addForm.year,
      quarter: addForm.quarter,
      month: addForm.month,
      payment: addForm.payment,
      filing: addForm.filing,
    });
    setIsSaving(false);

    if (!response.status) {
      toast.error(response.message);
      return;
    }

    toast.success(response.message);
    setIsAddOpen(false);
    setAddForm(initialFormState);
    await loadRows(pagination.take, 0, filterYear, filterQuarter, searchText);
  };

  const openEdit = (row: return_due) => {
    setEditForm({
      id: row.id,
      year: row.year,
      quarter: row.quarter,
      month: row.month,
      payment: row.payment,
      filing: row.filing,
    });
    setIsEditOpen(true);
  };

  const onEditSave = async () => {
    if (!editForm.id) {
      toast.error("Invalid row selected.");
      return;
    }

    const validationError = validateForm(editForm);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsSaving(true);
    const response = await UpdateReturnDue({
      id: editForm.id,
      year: editForm.year,
      quarter: editForm.quarter,
      month: editForm.month,
      payment: editForm.payment,
      filing: editForm.filing,
    });
    setIsSaving(false);

    if (!response.status) {
      toast.error(response.message);
      return;
    }

    toast.success(response.message);
    setIsEditOpen(false);
    await reloadCurrent();
  };

  const onSearch = async () => {
    setSearchText(searchInput.trim());
    await loadRows(
      pagination.take,
      0,
      filterYear,
      filterQuarter,
      searchInput.trim(),
    );
  };

  const onClearSearch = async () => {
    setSearchInput("");
    setSearchText("");
    await loadRows(pagination.take, 0, filterYear, filterQuarter, "");
  };

  const onFilterYear = async (value: string) => {
    const parsed = value.trim() === "" ? undefined : Number(value);
    setFilterYear(parsed);
    await loadRows(pagination.take, 0, parsed, filterQuarter, searchText);
  };

  const onFilterQuarter = async (value: Quarter | undefined) => {
    setFilterQuarter(value);
    await loadRows(pagination.take, 0, filterYear, value, searchText);
  };

  const onPageChange = async (page: number, pageSize: number) => {
    const nextSkip = (page - 1) * pageSize;
    await loadRows(pageSize, nextSkip, filterYear, filterQuarter, searchText);
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full grid place-items-center text-2xl text-gray-600 bg-gray-100">
        Loading...
      </div>
    );
  }

  return (
    <main className="p-3 bg-gray-50 min-h-screen">
      <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm mb-3">
        <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
          <div>
            <h1 className="text-lg font-medium text-gray-900">
              Return Date Management
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Manage return due dates from return_due table.
            </p>
          </div>

          <div className="grow" />
{/* 
          <div className="flex flex-wrap gap-2 items-center">
            <Input
              size="small"
              style={{ width: 120 }}
              placeholder="Filter Year"
              value={filterYear ?? ""}
              onChange={(e) => void onFilterYear(e.target.value)}
            />
            <Select
              size="small"
              style={{ width: 140 }}
              value={filterQuarter}
              placeholder="Filter Quarter"
              allowClear
              options={QUARTER_OPTIONS}
              onChange={(value) => void onFilterQuarter(value)}
            />
            <Input.Search
              size="small"
              style={{ width: 230 }}
              placeholder="Search by year/month/day/quarter"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onSearch={() => void onSearch()}
              allowClear
              onClear={() => void onClearSearch()}
            />
            <Button type="primary" onClick={() => setIsAddOpen(true)}>
              Add Return Date
            </Button>
          </div> */}
        </div>
      </div>

      <div className="bg-white rounded shadow-sm border p-3">
        {rows.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 border-b">
                    <TableHead className="text-center p-2 text-xs">
                      Year
                    </TableHead>
                    <TableHead className="text-center p-2 text-xs">
                      Quarter
                    </TableHead>
                    <TableHead className="text-center p-2 text-xs">
                      Month
                    </TableHead>
                    {/* <TableHead className="text-center p-2 text-xs">Payment Day</TableHead> */}
                    {/* <TableHead className="text-center p-2 text-xs">Filing Day</TableHead> */}
                    <TableHead className="text-center p-2 text-xs">
                      Payment Due Date
                    </TableHead>
                    <TableHead className="text-center p-2 text-xs">
                      Filing Due Date
                    </TableHead>
                    {/* <TableHead className="text-center p-2 text-xs">Created On</TableHead> */}
                    <TableHead className="text-center p-2 text-xs">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="border-b hover:bg-gray-50"
                    >
                      <TableCell className="text-center text-xs p-2">
                        {row.year}
                      </TableCell>
                      <TableCell className="text-center text-xs p-2">
                        {getQuarterLabel(row.quarter)}
                      </TableCell>
                      <TableCell className="text-center text-xs p-2">
                        {getMonthLabel(row.month)}
                      </TableCell>
                      {/* <TableCell className="text-center text-xs p-2">{row.payment}</TableCell>
                      <TableCell className="text-center text-xs p-2">{row.filing}</TableCell> */}
                      <TableCell className="text-center text-xs p-2">
                        {toDisplayDate(row.year, row.month, row.payment)}
                      </TableCell>
                      <TableCell className="text-center text-xs p-2">
                        {toDisplayDate(row.year, row.month, row.filing)}
                      </TableCell>
                      {/* <TableCell className="text-center text-xs p-2">{formateDate(row.createdAt)}</TableCell> */}
                      <TableCell className="text-center text-xs p-2">
                        {getEditAllowed(row) && (
                          <Button
                            size="small"
                            type="link"
                            onClick={() => openEdit(row)}
                          >
                            Edit
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="px-3 py-2 border-t bg-gray-50 mt-2">
              <Pagination
                showQuickJumper
                align="center"
                current={Math.floor(pagination.skip / pagination.take) + 1}
                onChange={onPageChange}
                showSizeChanger
                pageSize={pagination.take}
                pageSizeOptions={[5, 10, 20, 50, 100]}
                total={pagination.total}
                responsive
                showTotal={(total: number, range: number[]) =>
                  `${range[0]}-${range[1]} of ${total} items`
                }
              />
            </div>
          </>
        ) : (
          <div className="text-center py-10 text-gray-500 text-sm">
            No return due records found.
          </div>
        )}
      </div>

      <Drawer
        title="Add Return Due Date"
        placement="right"
        open={isAddOpen}
        size={420}
        onClose={() => setIsAddOpen(false)}
      >
        <div className="space-y-3">
          <Input
            type="number"
            min={2000}
            max={2100}
            value={addForm.year}
            onChange={(e) =>
              setAddForm((prev) => ({ ...prev, year: Number(e.target.value) }))
            }
            placeholder="Year"
          />
          <Select
            value={addForm.quarter}
            options={QUARTER_OPTIONS}
            onChange={(value) =>
              setAddForm((prev) => ({ ...prev, quarter: value }))
            }
          />
          <Select
            value={addForm.month}
            options={MONTH_OPTIONS}
            onChange={(value) =>
              setAddForm((prev) => ({ ...prev, month: value }))
            }
          />
          <Input
            type="number"
            min={1}
            max={31}
            value={addForm.payment}
            onChange={(e) =>
              setAddForm((prev) => ({
                ...prev,
                payment: Number(e.target.value),
              }))
            }
            placeholder="Payment Day (1-31)"
          />
          <Input
            type="number"
            min={1}
            max={31}
            value={addForm.filing}
            onChange={(e) =>
              setAddForm((prev) => ({
                ...prev,
                filing: Number(e.target.value),
              }))
            }
            placeholder="Filing Day (1-31)"
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button
              type="primary"
              loading={isSaving}
              onClick={() => void onAdd()}
            >
              Save
            </Button>
          </div>
        </div>
      </Drawer>

      <Drawer
        title="Edit Return Due Date"
        placement="right"
        open={isEditOpen}
        size={420}
        onClose={() => setIsEditOpen(false)}
      >
        <div className="space-y-3">
          <Input
            type="number"
            min={2000}
            max={2100}
            value={editForm.year}
            onChange={(e) =>
              setEditForm((prev) => ({ ...prev, year: Number(e.target.value) }))
            }
            placeholder="Year"
          />
          <Select
            value={editForm.quarter}
            options={QUARTER_OPTIONS}
            onChange={(value) =>
              setEditForm((prev) => ({ ...prev, quarter: value }))
            }
          />
          <Select
            value={editForm.month}
            options={MONTH_OPTIONS}
            onChange={(value) =>
              setEditForm((prev) => ({ ...prev, month: value }))
            }
          />
          <Input
            type="number"
            min={1}
            max={31}
            value={editForm.payment}
            onChange={(e) =>
              setEditForm((prev) => ({
                ...prev,
                payment: Number(e.target.value),
              }))
            }
            placeholder="Payment Day (1-31)"
          />
          <Input
            type="number"
            min={1}
            max={31}
            value={editForm.filing}
            onChange={(e) =>
              setEditForm((prev) => ({
                ...prev,
                filing: Number(e.target.value),
              }))
            }
            placeholder="Filing Day (1-31)"
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button
              type="primary"
              loading={isSaving}
              onClick={() => void onEditSave()}
            >
              Update
            </Button>
          </div>
        </div>
      </Drawer>
    </main>
  );
};

export default DepartmentReturnDatePage;
