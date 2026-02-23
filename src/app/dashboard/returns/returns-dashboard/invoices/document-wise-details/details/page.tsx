"use client";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import GetUserDvat04 from "@/action/dvat/getuserdvat";
import getPdfReturn from "@/action/return/getpdfreturn";
import RemoveReturn from "@/action/return/removereturn";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formateDate } from "@/utils/methods";
import {
  dvat04,
  DvatType,
  returns_01,
  returns_entry,
  tin_number_master,
} from "@prisma/client";
import { Alert, Modal, Popover } from "antd";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const DocumentWiseDetails = () => {
  const router = useRouter();

  const [openPopovers, setOpenPopovers] = useState<{ [key: number]: boolean }>(
    {}
  );
  const handleOpenChange = (newOpen: boolean, index: number) => {
    setOpenPopovers((prev) => ({
      ...prev,
      [index]: newOpen,
    }));
  };

  const handelClose = (index: number) => {
    setOpenPopovers((prev) => ({
      ...prev,
      [index]: false,
    }));
  };

  const searchParams = useSearchParams();

  const [dvatdata, setDvatData] = useState<dvat04>();

  const [return01, setReturn01] = useState<returns_01 | null>();
  const [returns_entryData, serReturns_entryData] =
    useState<Array<returns_entry & { seller_tin_number: tin_number_master }>>();

  const [name, setName] = useState<string>("");

  const [userid, setUserid] = useState<number>(0);

  useEffect(() => {
    const init = async () => {
      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        return router.push("/");
      }
      setUserid(authResponse.data);

      const dvat_response = await GetUserDvat04();

      if (dvat_response.status && dvat_response.data) {
        setDvatData(dvat_response.data);
      }
      const year: string = searchParams.get("year") ?? "";
      const month: string = searchParams.get("month") ?? "";

      const returnformsresponse = await getPdfReturn({
        year: year,
        month: month,
        userid: userid,
      });

      if (returnformsresponse.status && returnformsresponse.data) {
        setReturn01(returnformsresponse.data.returns_01);
        serReturns_entryData(returnformsresponse.data.returns_entry);

        returnformsresponse.data.returns_entry.map(
          (val: returns_entry & { seller_tin_number: tin_number_master }) => {
            if (
              val.seller_tin_number.tin_number.toString() ==
              searchParams.get("sellertin")
            ) {
              setName(val.seller_tin_number.name_of_dealer);
            }
          }
        );
      } else {
        setReturn01(null);
        serReturns_entryData([]);
      }
    };
    init();
  }, [searchParams, userid]);

  const payment_complted = () => {
    return (
      return01 != null &&
      return01.rr_number != "" &&
      return01.rr_number != undefined &&
      return01.rr_number != null
    );
  };

  const getDueDate = () => {
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

    const year: number = parseInt(searchParams.get("year")!);
    const month: string = searchParams.get("month")!;
    const day = 11;

    return formateDate(new Date(year, monthNames.indexOf(month) + 1, day));
  };

  const getTaxPerios = (): string => {
    if (dvatdata?.compositionScheme) {
      switch (searchParams.get("month") ?? "") {
        case "June":
          return "April - June";
        case "September":
          return "July - September";
        case "December":
          return "October - December";
        case "March":
          return "January - March";
        default:
          return "April - June";
      }
    } else {
      return searchParams.get("month") ?? "";
    }
  };

  const getDvatData = (): returns_entry[] => {
    switch (searchParams.get("form")) {
      case "30":
        return (returns_entryData ?? []).filter(
          (val: returns_entry & { seller_tin_number: tin_number_master }) =>
            val.dvat_type == DvatType.DVAT_30 &&
            val.seller_tin_number.tin_number.toString() ==
              searchParams.get("sellertin")
        );
      case "30A":
        return (returns_entryData ?? []).filter(
          (val: returns_entry & { seller_tin_number: tin_number_master }) =>
            val.dvat_type == DvatType.DVAT_30_A &&
            val.seller_tin_number.tin_number.toString() ==
              searchParams.get("sellertin")
        );
      case "31":
        return (returns_entryData ?? []).filter(
          (val: returns_entry & { seller_tin_number: tin_number_master }) =>
            val.dvat_type == DvatType.DVAT_31 &&
            val.seller_tin_number.tin_number.toString() ==
              searchParams.get("sellertin")
        );
      case "31A":
        return (returns_entryData ?? []).filter(
          (val: returns_entry & { seller_tin_number: tin_number_master }) =>
            val.dvat_type == DvatType.DVAT_31_A &&
            val.seller_tin_number.tin_number.toString() ==
              searchParams.get("sellertin")
        );
      default:
        return [];
    }
  };

  const [deletebox, setDeleteBox] = useState<boolean>(false);
  const delete_return_entry = async (id: number) => {
    const response = await RemoveReturn({
      id: id,
    });
    if (response.data && response.status) {
      toast.success(response.message);
    } else {
      toast.error(response.message);
    }
  };

  const getUrl = (id: number): string => {
    const formType = searchParams.get("form");
    switch (formType) {
      case "30":
        return `/dashboard/returns/returns-dashboard/inward-supplies/add-record-30/update?form=${searchParams.get(
          "form"
        )}&year=${searchParams.get("year")}&quarter=${searchParams.get(
          "quarter"
        )}&month=${searchParams.get("month")}&id=${id}`;

      case "30A":
        return `/dashboard/returns/returns-dashboard/inward-supplies/add-record-30A/update?form=${searchParams.get(
          "form"
        )}&year=${searchParams.get("year")}&quarter=${searchParams.get(
          "quarter"
        )}&month=${searchParams.get("month")}&id=${id}`;

      case "31":
        return `/dashboard/returns/returns-dashboard/outward-supplies/add-record-31/update?form=${searchParams.get(
          "form"
        )}&year=${searchParams.get("year")}&quarter=${searchParams.get(
          "quarter"
        )}&month=${searchParams.get("month")}&id=${id}`;

      case "31A":
        return `/dashboard/returns/returns-dashboard/outward-supplies/add-record-31A/update?form=${searchParams.get(
          "form"
        )}&year=${searchParams.get("year")}&quarter=${searchParams.get(
          "quarter"
        )}&month=${searchParams.get("month")}&id=${id}`;

      default:
        return "";
    }
  };

  const ispayment = (): boolean => {
    return !(
      return01?.rr_number == null ||
      return01?.rr_number == undefined ||
      return01?.rr_number == ""
    );
  };

  return (
    <>
      <div className="p-2 mt-4">
        <div className="bg-white p-4 flex text-xs justify-between">
          <div>
            <p>VAT No. - {dvatdata?.tinNumber}</p>
            <p>FY - {searchParams.get("year")}</p>
          </div>
          <div>
            <p>Legal Name - {dvatdata?.name}</p>
            <p>Tax Period - {getTaxPerios()}</p>
          </div>
          <div>
            <p>Trade Name - {dvatdata?.tradename}</p>
            <p>Status - {payment_complted() ? "Filed" : "Not Filed"} </p>
          </div>
          <div>
            <p>Indicates Mandatory Fields</p>
            <p>Due Date - {getDueDate()}</p>
          </div>
        </div>
        <div className="bg-white p-2 shadow mt-2">
          <div className="bg-blue-500 p-2 text-white">
            Invoice No. - {searchParams.get("invoice_no")}
          </div>

          <p className="text-[#162e57] text-sm mt-2">Processed Records</p>
          <div className="flex gap-2 mt-2">
            <div className="bg-gray-200 text-sm text-black rounded-full px-2 py-1">
              {searchParams.get("sellertin")}
            </div>
            <div className="bg-gray-200 text-sm text-black rounded-full px-2 py-1">
              {name}
            </div>
          </div>

          {getDvatData().filter(
            (val) =>
              val.invoice_number.toString() === searchParams.get("invoice_no")
          ).length > 0 ? (
            <Table className="border mt-2">
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead className="w-64 border text-center">
                    Product Name
                  </TableHead>
                  <TableHead className="w-20 border text-center">
                    Quantity
                  </TableHead>
                  <TableHead className="border text-center">
                    Invoice no.
                  </TableHead>
                  <TableHead className="border text-center">
                    Invoice Date
                  </TableHead>
                  <TableHead className="border text-center">
                    Total invoice value (&#x20b9;)
                  </TableHead>
                  <TableHead className="border text-center">
                    Total taxable value
                  </TableHead>
                  <TableHead className="border text-center">
                    VAT Amount
                  </TableHead>

                  {!ispayment() && (
                    <TableHead className="w-28 border text-center">
                      Actions
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {getDvatData()
                  .filter(
                    (val) =>
                      val.invoice_number.toString() ===
                      searchParams.get("invoice_no")
                  )
                  .map((val: returns_entry, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="p-2 border text-center">
                        {val.description_of_goods}
                      </TableCell>
                      <TableCell className="p-2 border text-center">
                        {val.quantity}
                      </TableCell>
                      <TableCell className="p-2 border text-center">
                        {val.invoice_number}
                      </TableCell>
                      <TableCell className="p-2 border text-center">
                        {formateDate(val.createdAt)}
                      </TableCell>
                      <TableCell className="p-2 border text-center">
                        {val.total_invoice_number}
                      </TableCell>
                      <TableCell className="p-2 border text-center">
                        {val.amount}
                      </TableCell>
                      <TableCell className="p-2 border text-center">
                        {val.vatamount}
                      </TableCell>
                      {!ispayment() && (
                        <TableCell className="p-2 border text-center">
                          <Popover
                            content={
                              <div className="flex flex-col gap-2">
                                <button
                                  onClick={() => {
                                    setDeleteBox(true);
                                    handelClose(index);
                                  }}
                                  className="text-sm bg-white border hover:border-rose-500 hover:text-rose-500 text-[#172e57] py-1 px-4"
                                >
                                  Delete
                                </button>
                                <button
                                  onClick={() => {
                                    router.push(getUrl(val.id));
                                  }}
                                  className="text-sm bg-white border hover:border-blue-500 hover:text-blue-500 text-[#172e57] py-1 px-4"
                                >
                                  Update
                                </button>
                              </div>
                            }
                            title="Actions"
                            trigger="click"
                            open={!!openPopovers[index]} // Open state for each row
                            onOpenChange={(newOpen) =>
                              handleOpenChange(newOpen, index)
                            }
                          >
                            <button className="text-sm bg-white border hover:border-blue-500 hover:text-blue-500 text-[#172e57] py-1 px-4">
                              Actions
                            </button>
                          </Popover>
                          <Modal
                            title="Confirmation"
                            open={deletebox}
                            footer={null}
                            closeIcon={false}
                          >
                            <div>
                              <p>
                                Are you sure you want to delete this return
                                entry
                              </p>
                            </div>
                            <div className="flex  gap-2 mt-2">
                              <div className="grow"></div>
                              <button
                                className="py-1 rounded-md border px-4 text-sm text-gray-600"
                                onClick={() => {
                                  setDeleteBox(false);
                                }}
                              >
                                Close
                              </button>
                              <button
                                onClick={() => delete_return_entry(val.id)}
                                className="py-1 rounded-md bg-rose-500 px-4 text-sm text-white"
                              >
                                Delete
                              </button>
                            </div>
                          </Modal>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          ) : (
            <>
              <Alert
                style={{
                  marginTop: "10px",
                  padding: "8px",
                }}
                type="error"
                showIcon
                description="There is no record"
              />
            </>
          )}

          {/* <div className="flex mt-2 gap-2">
            <div className="grow"></div>
            <Button type="default" onClick={() => route.back()}>
              Back
            </Button>
          </div> */}
        </div>
      </div>
    </>
  );
};

export default DocumentWiseDetails;
