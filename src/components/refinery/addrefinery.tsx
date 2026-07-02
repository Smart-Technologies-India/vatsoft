"use client";

import CreateRefinerySale from "@/action/refinery_sale/createrefinerysale";
import GetAutoRefinerySalePrice from "@/action/refinery_sale/getautorefinerysaleprice";
import GetRefineryDealerPurchasers from "@/action/refinery_sale/getrefinerydealerpurchasers";
import AllCommodityMaster from "@/action/commoditymaster/allcommoditymaster";
import { MultiSelect } from "@/components/forms/inputfields/multiselect";
import { TaxtInput } from "@/components/forms/inputfields/textinput";
import { commodity_master, refinery } from "@prisma/client";
import { Button, Drawer, Radio } from "antd";
import { useEffect, useMemo, useState } from "react";
import {
  FormProvider,
  useFieldArray,
  useForm,
  useWatch,
} from "react-hook-form";
import { toast } from "react-toastify";

type EntryMode = "single" | "multiple";

type RefinerySaleLineItem = {
  selectedCommodityId?: string;
  price: string;
  quantity: string;
};

type RefinerySaleFormValues = {
  entryMode: EntryMode;
  purchaserTin?: string;
  invoiceNumber: string;
  invoiceDate: string;
  entries: RefinerySaleLineItem[];
};

type AddRefineryProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: (saleIds: number[]) => void;
};

const ALLOWED_COMMODITY_IDS = [1, 2, 748, 749];

const toDateTimeLocalValue = (date: Date): string => {
  const pad = (value: number) => value.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const generateInvoiceNumber = () => {
  const now = new Date();
  const pad = (value: number) => value.toString().padStart(2, "0");
  const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const random = Math.floor(100 + Math.random() * 900);
  return `RS-${timestamp}-${random}`;
};

const formatCurrency = (value: number) => {
  return Number.isFinite(value) ? value.toFixed(2) : "0.00";
};

const formatToDDMMYYYY = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const AddRefinery = ({ open, onClose, onCreated }: AddRefineryProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [purchaserOptions, setPurchaserOptions] = useState<refinery[]>([]);
  const [commodities, setCommodities] = useState<commodity_master[]>([]);

  const methods = useForm<RefinerySaleFormValues>({
    defaultValues: {
      entryMode: "single",
      purchaserTin: undefined,
      invoiceNumber: generateInvoiceNumber(),
      invoiceDate: toDateTimeLocalValue(new Date()),
      entries: [
        {
          selectedCommodityId: undefined,
          price: "",
          quantity: "1",
        },
      ],
    },
  });

  const { control, handleSubmit, reset, setValue, getValues } = methods;
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "entries",
  });

  const entryMode = useWatch({ control, name: "entryMode" });
  const purchaserTin = useWatch({ control, name: "purchaserTin" });
  const invoiceDate = useWatch({ control, name: "invoiceDate" });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const entries = useWatch({ control, name: "entries" }) || [];

  const selectedCommodityKey = useMemo(() => {
    return entries.map((entry) => entry?.selectedCommodityId || "").join("|");
  }, [entries]);

  const selectedRefinery = useMemo(() => {
    if (!purchaserTin) {
      return undefined;
    }

    return purchaserOptions.find((item) => item.tinNumber === purchaserTin);
  }, [purchaserOptions, purchaserTin]);

  const purchaserSelectOptions = useMemo(() => {
    const uniqueByTin = new Map<string, { value: string; label: string }>();

    purchaserOptions.forEach((refinery) => {
      const tin = refinery.tinNumber?.trim();
      if (!tin || uniqueByTin.has(tin)) {
        return;
      }

      uniqueByTin.set(tin, {
        value: tin,
        label: `${refinery.tradename || refinery.name || "Refinery"} - ${tin}`,
      });
    });

    return Array.from(uniqueByTin.values());
  }, [purchaserOptions]);

  const lineCalculations = useMemo(() => {
    return entries.map((entry) => {
      const selectedCommodityIdNumber = entry?.selectedCommodityId
        ? Number.parseInt(String(entry.selectedCommodityId), 10)
        : undefined;

      const selectedCommodity = commodities.find(
        (commodity) => commodity.id === selectedCommodityIdNumber,
      );

      const itemPrice = Number.parseFloat(entry?.price ?? "0") || 0;
      const quantityInKL = Number.parseFloat(entry?.quantity ?? "1") || 0;
      const quantityInLitres = quantityInKL * 1000;
      const taxPercent =
        Number.parseFloat(selectedCommodity?.taxable_at ?? "0") || 0;
      const totalInvoiceValue = quantityInLitres * itemPrice;
      const taxableValue = totalInvoiceValue / (1 + taxPercent / 100);
      const vatAmount = (taxableValue * taxPercent) / 100;

      return {
        itemPrice,
        quantityInLitres,
        taxPercent,
        taxableValue,
        vatAmount,
        totalInvoiceValue,
      };
    });
  }, [commodities, entries]);

  const getCommodityOptionsForRow = (rowIndex: number) => {
    const selectedInOtherRows = new Set(
      entries
        .map((entry, index) =>
          index === rowIndex ? undefined : entry?.selectedCommodityId,
        )
        .filter((value): value is string => Boolean(value)),
    );

    return commodities
      .filter((commodity) => !selectedInOtherRows.has(commodity.id.toString()))
      .map((commodity) => ({
        value: commodity.id.toString(),
        label: `${commodity.product_name}`,
      }));
  };

  const invoiceTotals = useMemo(() => {
    return lineCalculations.reduce(
      (acc, line) => {
        acc.taxableValue += line.taxableValue;
        acc.vatAmount += line.vatAmount;
        acc.invoiceValue += line.totalInvoiceValue;
        return acc;
      },
      { taxableValue: 0, vatAmount: 0, invoiceValue: 0 },
    );
  }, [lineCalculations]);

  const resetForm = () => {
    reset({
      entryMode: "single",
      purchaserTin: undefined,
      invoiceNumber: generateInvoiceNumber(),
      invoiceDate: toDateTimeLocalValue(new Date()),
      entries: [
        {
          selectedCommodityId: undefined,
          price: "",
          quantity: "1",
        },
      ],
    });
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  useEffect(() => {
    const loadDrawerData = async () => {
      const [purchaserResponse, commodityResponse] = await Promise.all([
        GetRefineryDealerPurchasers(),
        AllCommodityMaster({}),
      ]);

      if (purchaserResponse.status && purchaserResponse.data) {
        setPurchaserOptions(purchaserResponse.data);
      } else {
        setPurchaserOptions([]);
      }

      if (commodityResponse.status && commodityResponse.data) {
        setCommodities(
          commodityResponse.data.filter((val) =>
            ALLOWED_COMMODITY_IDS.includes(val.id),
          ),
        );
      }
    };

    if (open) {
      resetForm();
      void loadDrawerData();
    }
  }, [open, reset]);

  useEffect(() => {
    if (entryMode !== "single") {
      return;
    }

    const currentEntries = getValues("entries") || [];
    if (currentEntries.length <= 1) {
      return;
    }

    replace([currentEntries[0]]);
  }, [entryMode, getValues, replace]);

  useEffect(() => {
    const selectedRefineryId = selectedRefinery?.id;
    const parsedInvoiceDate = new Date(invoiceDate || "");
    const isInvoiceDateValid = !Number.isNaN(parsedInvoiceDate.getTime());
    let isCancelled = false;

    const syncAutoPrices = async () => {
      for (let index = 0; index < entries.length; index += 1) {
        const selectedCommodityId = entries[index]?.selectedCommodityId;
        const parsedCommodityId = selectedCommodityId
          ? Number.parseInt(String(selectedCommodityId), 10)
          : NaN;

        if (
          !selectedRefineryId ||
          !Number.isInteger(parsedCommodityId) ||
          !isInvoiceDateValid
        ) {
          if ((entries[index]?.price ?? "") !== "0") {
            setValue(`entries.${index}.price`, "0", {
              shouldValidate: true,
              shouldDirty: true,
            });
          }
          continue;
        }

        const invoiceDateForLookup = formatToDDMMYYYY(parsedInvoiceDate);

        const response = await GetAutoRefinerySalePrice({
          refineryId: selectedRefineryId,
          commodityMasterId: parsedCommodityId,
          invoiceDate: invoiceDateForLookup,
        });

        if (isCancelled) {
          return;
        }

        const nextPrice =
          response.status &&
          response.data !== null &&
          response.data !== undefined
            ? response.data.toFixed(2)
            : "0";

        if ((entries[index]?.price ?? "") !== nextPrice) {
          setValue(`entries.${index}.price`, nextPrice, {
            shouldValidate: true,
            shouldDirty: true,
          });
        }
      }
    };

    void syncAutoPrices();

    return () => {
      isCancelled = true;
    };
  }, [
    invoiceDate,
    selectedCommodityKey,
    selectedRefinery?.id,
    entries,
    setValue,
  ]);

  const handleCreateSale = async (data: RefinerySaleFormValues) => {
    if (!data.purchaserTin) {
      toast.error("Please select purchaser TIN number.");
      return;
    }

    if (!data.entries || data.entries.length === 0) {
      toast.error("Please add at least one item entry.");
      return;
    }

    const selectedEntries =
      data.entryMode === "single" ? [data.entries[0]] : data.entries;

    if (!selectedEntries[0]) {
      toast.error("Please add at least one item entry.");
      return;
    }

    const parsedInvoiceDate = new Date(data.invoiceDate);
    if (Number.isNaN(parsedInvoiceDate.getTime())) {
      toast.error("Invoice date is invalid.");
      return;
    }

    const normalizedEntries: Array<{
      commodityMasterId: number;
      price: number;
      quantityInLitres: number;
    }> = [];
    const selectedCommodityIds = new Set<number>();

    for (let index = 0; index < selectedEntries.length; index += 1) {
      const entry = selectedEntries[index];
      const commodityValue = String(entry?.selectedCommodityId || "").trim();
      const priceValue = String(entry?.price || "").trim();
      const quantityValue = String(entry?.quantity || "").trim();

      if (!commodityValue) {
        toast.error(`Item details cannot be empty in row ${index + 1}.`);
        return;
      }

      if (!priceValue) {
        toast.error(`Price cannot be empty in row ${index + 1}.`);
        return;
      }

      if (!quantityValue) {
        toast.error(`Quantity cannot be empty in row ${index + 1}.`);
        return;
      }

      const parsedCommodityId = Number.parseInt(commodityValue, 10);
      const parsedPrice = Number.parseFloat(priceValue);
      const parsedQuantityInKL = Number.parseFloat(quantityValue);

      if (!Number.isInteger(parsedCommodityId) || parsedCommodityId <= 0) {
        toast.error(`Invalid item details in row ${index + 1}.`);
        return;
      }

      if (!ALLOWED_COMMODITY_IDS.includes(parsedCommodityId)) {
        toast.error(
          `Only allowed refinery commodities can be selected in row ${index + 1}.`,
        );
        return;
      }

      if (selectedCommodityIds.has(parsedCommodityId)) {
        toast.error(
          `Same item cannot be selected twice. Duplicate found in row ${index + 1}.`,
        );
        return;
      }

      selectedCommodityIds.add(parsedCommodityId);

      if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
        toast.error(`Price must be greater than 0 in row ${index + 1}.`);
        return;
      }

      if (!Number.isFinite(parsedQuantityInKL) || parsedQuantityInKL <= 0) {
        toast.error(
          `Quantity (kL) must be greater than 0 in row ${index + 1}.`,
        );
        return;
      }

      normalizedEntries.push({
        commodityMasterId: parsedCommodityId,
        price: parsedPrice,
        quantityInLitres: parsedQuantityInKL * 1000,
      });
    }

    setIsSubmitting(true);

    try {
      const createdIds: number[] = [];

      for (let index = 0; index < normalizedEntries.length; index += 1) {
        const entry = normalizedEntries[index];
        const response = await CreateRefinerySale({
          purchaser_tin_number: data.purchaserTin,
          invoice_number: data.invoiceNumber,
          invoice_date: parsedInvoiceDate,
          commodity_master_id: entry.commodityMasterId,
          price: entry.price,
          quantity: entry.quantityInLitres,
          allow_existing_invoice: data.entryMode === "multiple" || index > 0,
        });

        if (!response.status || !response.data) {
          toast.error(
            response.message ||
              `Unable to create refinery sale for row ${index + 1}.`,
          );
          return;
        }

        createdIds.push(response.data.id);
      }

      toast.success(
        createdIds.length > 1
          ? `${createdIds.length} refinery sale entries added successfully.`
          : "Refinery sale entry added successfully.",
      );

      handleClose();
      onCreated?.(createdIds);
    } catch {
      toast.error("Unable to create refinery sale entry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer
      title="Add Refinery Sale"
      placement="right"
      open={open}
      onClose={handleClose}
      size={700}
    >
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(handleCreateSale)} className="space-y-3">
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-2">
            <p className="text-xs font-medium text-gray-700 mb-2">Entry Mode</p>
            <Radio.Group
              value={entryMode}
              onChange={(event) =>
                setValue("entryMode", event.target.value as EntryMode, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            >
              <Radio.Button value="single">Single Item</Radio.Button>
              <Radio.Button value="multiple">Multi Item</Radio.Button>
            </Radio.Group>
            <p className="mt-2 text-xs text-gray-600">
              Multiple items use the same invoice number and invoice date.
            </p>
          </div>

          <div className="space-y-1">
            <MultiSelect<RefinerySaleFormValues>
              name="purchaserTin"
              title="Purchaser Refinery"
              placeholder="Select refinery"
              required={true}
              options={purchaserSelectOptions}
            />
          </div>

          <div className="rounded-lg border border-blue-100 bg-blue-50 p-2">
            <p className="text-xs text-blue-700">
              Purchaser TIN is auto-used from selected refinery.
            </p>
          </div>

          <div className="space-y-1">
            <TaxtInput<RefinerySaleFormValues>
              name="invoiceNumber"
              title="Invoice No (Auto Generated)"
              required={true}
              disable={true}
            />
          </div>

          <div className="space-y-1">
            <TaxtInput<RefinerySaleFormValues>
              name="invoiceDate"
              title="Invoice Date (Current Timestamp)"
              required={true}
              disable={true}
            />
          </div>

          <div className="flex items-center justify-between gap-2 border-b border-gray-200 pb-2">
            <p className="text-sm font-medium text-gray-800">Item Entries</p>
          </div>

          {fields.map((field, index) => (
            <div
              key={field.id}
              className="rounded-lg border border-gray-200 p-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-700">
                  Item {index + 1}
                </p>
                {entryMode === "multiple" && fields.length > 1 ? (
                  <Button danger size="small" onClick={() => remove(index)}>
                    Remove
                  </Button>
                ) : null}
              </div>

              <div className="space-y-1">
                <MultiSelect<RefinerySaleFormValues>
                  name={`entries.${index}.selectedCommodityId` as any}
                  title="Item Details"
                  placeholder="Select item"
                  required={true}
                  options={getCommodityOptionsForRow(index)}
                />
              </div>

              <div className="space-y-1">
                <TaxtInput<RefinerySaleFormValues>
                  name={`entries.${index}.price` as any}
                  title="Price (Auto from Price Master)"
                  placeholder="Auto"
                  required={true}
                  disable={true}
                />
              </div>

              <div className="space-y-1">
                <TaxtInput<RefinerySaleFormValues>
                  name={`entries.${index}.quantity` as any}
                  title="Quantity (kL)"
                  placeholder="Enter Quantity in kL"
                  required={true}
                  numdes={true}
                />
              </div>

              <div className="rounded-lg border border-gray-100 bg-gray-50 p-2">
                <p className="text-xs font-medium text-gray-700 mb-2">
                  Calculated Values
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded bg-white px-2 py-1.5">
                    <p className="text-xs font-medium text-gray-600">
                      Item Price
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(lineCalculations[index]?.itemPrice ?? 0)}
                    </p>
                  </div>
                  <div className="rounded bg-white px-2 py-1.5">
                    <p className="text-xs font-medium text-gray-600">
                      Quantity in Liter
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(
                        lineCalculations[index]?.quantityInLitres ?? 0,
                      )}
                    </p>
                  </div>
                  <div className="rounded bg-white px-2 py-1.5">
                    <p className="text-xs font-medium text-gray-600">Tax %</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(lineCalculations[index]?.taxPercent ?? 0)}
                    </p>
                  </div>
                  <div className="rounded bg-white px-2 py-1.5">
                    <p className="text-xs font-medium text-gray-600">
                      Taxable Value
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(
                        lineCalculations[index]?.taxableValue ?? 0,
                      )}
                    </p>
                  </div>
                  <div className="rounded bg-white px-2 py-1.5">
                    <p className="text-xs font-medium text-gray-600">
                      VAT Amount
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(lineCalculations[index]?.vatAmount ?? 0)}
                    </p>
                  </div>
                  <div className="rounded bg-white px-2 py-1.5">
                    <p className="text-xs font-medium text-gray-600">
                      Total Invoice Value
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(
                        lineCalculations[index]?.totalInvoiceValue ?? 0,
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {entryMode === "multiple" ? (
            <div className="flex justify-end">
              <Button
                onClick={() =>
                  append({
                    selectedCommodityId: undefined,
                    price: "",
                    quantity: "1",
                  })
                }
              >
                Add Item
              </Button>
            </div>
          ) : null}

          {entryMode === "multiple" ? (
            <div className="rounded-lg border border-green-100 bg-green-50 p-2">
              <p className="text-xs font-medium text-green-800 mb-2">
                Invoice Totals
              </p>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded bg-white px-2 py-1.5">
                  <p className="text-xs font-medium text-gray-600">
                    Taxable Value
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(invoiceTotals.taxableValue)}
                  </p>
                </div>
                <div className="rounded bg-white px-2 py-1.5">
                  <p className="text-xs font-medium text-gray-600">
                    VAT Amount
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(invoiceTotals.vatAmount)}
                  </p>
                </div>
                <div className="rounded bg-white px-2 py-1.5">
                  <p className="text-xs font-medium text-gray-600">
                    Invoice Value
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(invoiceTotals.invoiceValue)}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="primary" loading={isSubmitting} htmlType="submit">
              Save {entryMode === "multiple" ? "Entries" : "Entry"}
            </Button>
          </div>
        </form>
      </FormProvider>
    </Drawer>
  );
};

export default AddRefinery;
