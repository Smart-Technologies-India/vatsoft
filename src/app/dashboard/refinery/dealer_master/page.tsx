"use client";

import CreateRefineryDealer from "@/action/refinery_dealer/createrefinerydealer";
import GetRefineryDealerOptions from "@/action/refinery_dealer/getdealermasteroptions";
import GetUserRefineryDealer from "@/action/refinery_dealer/getuserrefinerydealer";
import {
  DealerOption,
  RefineryDealerWithDealer,
} from "@/action/refinery_dealer/types";
import UpdateRefineryDealer from "@/action/refinery_dealer/updaterefinerydealer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MultiSelect } from "@/components/forms/inputfields/multiselect";
import { TaxtInput } from "@/components/forms/inputfields/textinput";
import {
  RefineryDealerForm,
  RefineryDealerSchema,
} from "@/schema/refinery_dealer";
import { onFormError } from "@/utils/methods";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { Button, Drawer, Pagination, Spin } from "antd";
import { FormProvider, useForm } from "react-hook-form";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

const EMPTY_FORM: RefineryDealerForm = {
  dealerId: "",
  tanker_1: "",
  tanker_2: "",
  tanker_3: "",
  tanker_4: "",
  tanker_5: "",
};

const getConfiguredTankerCount = (entry: RefineryDealerWithDealer): number => {
  const tankers = [
    entry.tanker_1,
    entry.tanker_2,
    entry.tanker_3,
    entry.tanker_4,
    entry.tanker_5,
  ];

  return tankers.filter((value) => (value || "").trim().length > 0).length;
};

const tankerLabel = (value: string | null): string => {
  const cleaned = (value || "").trim();
  return cleaned || "-";
};

const DealerMasterPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | undefined>(undefined);
  const [entries, setEntries] = useState<RefineryDealerWithDealer[]>([]);
  const [dealerOptions, setDealerOptions] = useState<DealerOption[]>([]);

  const methods = useForm<RefineryDealerForm>({
    resolver: valibotResolver(RefineryDealerSchema),
    defaultValues: EMPTY_FORM,
  });

  const { handleSubmit, reset } = methods;

  const [pagination, setPagination] = useState({
    take: 10,
    skip: 0,
    total: 0,
  });

  const pagedEntries = useMemo(
    () => entries.slice(pagination.skip, pagination.skip + pagination.take),
    [entries, pagination],
  );

  const summary = useMemo(() => {
    const configuredTankers = entries.reduce(
      (sum, entry) => sum + getConfiguredTankerCount(entry),
      0,
    );

    return {
      totalDealers: entries.length,
      configuredTankers,
      averageTankers:
        entries.length > 0
          ? (configuredTankers / entries.length).toFixed(2)
          : "0.00",
    };
  }, [entries]);

  const refreshData = async () => {
    setIsLoading(true);

    try {
      const [entriesResponse, optionsResponse] = await Promise.all([
        GetUserRefineryDealer(),
        GetRefineryDealerOptions(),
      ]);

      if (optionsResponse.status && optionsResponse.data) {
        setDealerOptions(
          optionsResponse.data.filter((val) => val.commodity == "FUEL"),
        );
      } else {
        setDealerOptions([]);
      }

      const responseEntries = entriesResponse.data;
      if (entriesResponse.status && responseEntries !== null) {
        setEntries(responseEntries);
        setPagination((prev) => ({
          ...prev,
          skip: 0,
          total: responseEntries.length,
        }));
      } else {
        setEntries([]);
        setPagination((prev) => ({
          ...prev,
          skip: 0,
          total: 0,
        }));
        toast.info(entriesResponse.message || "No dealer entries found.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refreshData();
  }, []);

  const onPageChange = (page: number, pageSize: number) => {
    setPagination((prev) => ({
      ...prev,
      take: pageSize,
      skip: (page - 1) * pageSize,
    }));
  };

  const openAddDrawer = () => {
    setEditingId(undefined);
    reset(EMPTY_FORM);
    setDrawerOpen(true);
  };

  const openEditDrawer = (entry: RefineryDealerWithDealer) => {
    setEditingId(entry.id);
    reset({
      dealerId: String(entry.dealerId),
      tanker_1: entry.tanker_1 || "",
      tanker_2: entry.tanker_2 || "",
      tanker_3: entry.tanker_3 || "",
      tanker_4: entry.tanker_4 || "",
      tanker_5: entry.tanker_5 || "",
    });
    setDrawerOpen(true);
  };

  const handleSave = async (data: RefineryDealerForm) => {
    const parsedDealerId = Number.parseInt(data.dealerId, 10);
    if (!Number.isInteger(parsedDealerId) || parsedDealerId <= 0) {
      toast.error("Please select valid dealer.");
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        dealerId: parsedDealerId,
        tanker_1: data.tanker_1,
        tanker_2: data.tanker_2,
        tanker_3: data.tanker_3,
        tanker_4: data.tanker_4,
        tanker_5: data.tanker_5,
      };

      const response = editingId
        ? await UpdateRefineryDealer({
            id: editingId,
            ...payload,
          })
        : await CreateRefineryDealer(payload);

      if (!response.status || !response.data) {
        toast.error(response.message || "Unable to save entry.");
        return;
      }

      toast.success(response.message || "Saved successfully.");
      setDrawerOpen(false);
      setEditingId(undefined);
      reset(EMPTY_FORM);
      await refreshData();
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spin />
      </div>
    );
  }

  return (
    <main className="bg-gray-50 min-h-screen p-3">
      <div className="mx-auto max-w-7xl space-y-3">
        <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-lg font-medium text-gray-900">
                Refinery Dealer Master
              </h1>
              <p className="text-xs text-gray-500">
                Manage dealer mapping and tanker numbers for current refinery.
              </p>
            </div>
            <div className="grow" />
            <Button type="primary" onClick={openAddDrawer}>
              Add Dealer
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 border-b">
                  <TableHead className="p-2 text-center text-xs">
                    Dealer TIN
                  </TableHead>
                  <TableHead className="p-2 text-center text-xs">
                    Dealer Name
                  </TableHead>
                  <TableHead className="p-2 text-center text-xs">
                    Trade Name
                  </TableHead>
                  <TableHead className="p-2 text-center text-xs">
                    Tanker 1
                  </TableHead>
                  <TableHead className="p-2 text-center text-xs">
                    Tanker 2
                  </TableHead>
                  <TableHead className="p-2 text-center text-xs">
                    Tanker 3
                  </TableHead>
                  <TableHead className="p-2 text-center text-xs">
                    Tanker 4
                  </TableHead>
                  <TableHead className="p-2 text-center text-xs">
                    Tanker 5
                  </TableHead>
                  <TableHead className="p-2 text-center text-xs">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedEntries.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="p-6 text-center text-sm text-gray-500"
                    >
                      No refinery dealer entries found.
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedEntries.map((entry) => (
                    <TableRow
                      key={entry.id}
                      className="border-b hover:bg-gray-50"
                    >
                      <TableCell className="p-2 text-center text-xs">
                        {entry.dvat.tin_master.tin_number}
                      </TableCell>
                      <TableCell className="p-2 text-center text-xs">
                        {entry.dvat.name || "-"}
                      </TableCell>
                      <TableCell className="p-2 text-center text-xs">
                        {entry.dvat.tradename || "-"}
                      </TableCell>
                      <TableCell className="p-2 text-center text-xs">
                        {tankerLabel(entry.tanker_1)}
                      </TableCell>
                      <TableCell className="p-2 text-center text-xs">
                        {tankerLabel(entry.tanker_2)}
                      </TableCell>
                      <TableCell className="p-2 text-center text-xs">
                        {tankerLabel(entry.tanker_3)}
                      </TableCell>
                      <TableCell className="p-2 text-center text-xs">
                        {tankerLabel(entry.tanker_4)}
                      </TableCell>
                      <TableCell className="p-2 text-center text-xs">
                        {tankerLabel(entry.tanker_5)}
                      </TableCell>
                      <TableCell className="p-2 text-center text-xs">
                        <Button
                          size="small"
                          onClick={() => openEditDrawer(entry)}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="border-t bg-gray-50 px-3 py-2">
            <Pagination
              align="center"
              current={Math.floor(pagination.skip / pagination.take) + 1}
              pageSize={pagination.take}
              total={pagination.total}
              onChange={onPageChange}
              showSizeChanger
              showTotal={(total) => `Total ${total} entries`}
            />
          </div>
        </div>

        <Drawer
          title={editingId ? "Edit Refinery Dealer" : "Add Refinery Dealer"}
          placement="right"
          open={drawerOpen}
          onClose={() => {
            setDrawerOpen(false);
            setEditingId(undefined);
            reset(EMPTY_FORM);
          }}
          width={520}
        >
          <FormProvider {...methods}>
            <form
              onSubmit={handleSubmit(handleSave, onFormError)}
              className="space-y-3"
            >
              <div className="space-y-1">
                <MultiSelect<RefineryDealerForm>
                  name="dealerId"
                  title="Dealer"
                  placeholder="Search and select dealer"
                  required={true}
                  options={dealerOptions.map((item) => ({
                    value: String(item.id),
                    label: `${item.tinNumber} - ${item.tradeName || item.dealerName || "NA"}`,
                  }))}
                />
              </div>

              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <div className="space-y-1">
                  <TaxtInput<RefineryDealerForm>
                    name="tanker_1"
                    title="Tanker 1"
                    placeholder="Enter tanker number"
                  />
                </div>
                <div className="space-y-1">
                  <TaxtInput<RefineryDealerForm>
                    name="tanker_2"
                    title="Tanker 2"
                    placeholder="Enter tanker number"
                  />
                </div>
                <div className="space-y-1">
                  <TaxtInput<RefineryDealerForm>
                    name="tanker_3"
                    title="Tanker 3"
                    placeholder="Enter tanker number"
                  />
                </div>
                <div className="space-y-1">
                  <TaxtInput<RefineryDealerForm>
                    name="tanker_4"
                    title="Tanker 4"
                    placeholder="Enter tanker number"
                  />
                </div>
                <div className="space-y-1">
                  <TaxtInput<RefineryDealerForm>
                    name="tanker_5"
                    title="Tanker 5"
                    placeholder="Enter tanker number"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  onClick={() => {
                    setDrawerOpen(false);
                    setEditingId(undefined);
                    reset(EMPTY_FORM);
                  }}
                >
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit" loading={isSaving}>
                  {editingId ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </FormProvider>
        </Drawer>
      </div>
    </main>
  );
};

export default DealerMasterPage;
