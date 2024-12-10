"use client";
import GetUserDvat04 from "@/action/dvat/getuserdvat";
import ConvertDvat31 from "@/action/stock/convertdvat31";
import GetUserDailySale from "@/action/stock/getuserdailysale";
import { DailySaleProvider } from "@/components/forms/dailysale/dailysale";
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
  commodity_master,
  daily_sale,
  dvat04,
  tin_number_master,
} from "@prisma/client";
import { Button, Drawer, Modal, Pagination } from "antd";
import { getCookie } from "cookies-next";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const DocumentWiseDetails = () => {
  const [isLoading, setLoading] = useState<boolean>(true);

  const [pagination, setPaginatin] = useState<{
    take: number;
    skip: number;
    total: number;
  }>({
    take: 10,
    skip: 0,
    total: 0,
  });

  const [dvatdata, setDvatData] = useState<dvat04>();

  const [dailySale, setDailySale] = useState<
    Array<
      daily_sale & {
        commodity_master: commodity_master;
        seller_tin_number: tin_number_master;
      }
    >
  >([]);

  //   const [name, setName] = useState<string>("");

  const userid: number = parseInt(getCookie("id") ?? "0");

  const init = async () => {
    // setLoading(true);

    const dvat_response = await GetUserDvat04({
      userid: userid,
    });

    if (dvat_response.status && dvat_response.data) {
      setDvatData(dvat_response.data);
      const daily_sale_response = await GetUserDailySale({
        dvatid: dvat_response.data.id,
        skip: 0,
        take: 10,
      });

      if (daily_sale_response.status && daily_sale_response.data.result) {
        setPaginatin({
          skip: daily_sale_response.data.skip,
          take: daily_sale_response.data.take,
          total: daily_sale_response.data.total,
        });
        setDailySale(daily_sale_response.data.result);
      }
    }
    // setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);

      const dvat_response = await GetUserDvat04({
        userid: userid,
      });

      if (dvat_response.status && dvat_response.data) {
        setDvatData(dvat_response.data);
        const daily_sale_response = await GetUserDailySale({
          dvatid: dvat_response.data.id,
          skip: 0,
          take: 10,
        });

        if (daily_sale_response.status && daily_sale_response.data.result) {
          setPaginatin({
            skip: daily_sale_response.data.skip,
            take: daily_sale_response.data.take,
            total: daily_sale_response.data.total,
          });
          setDailySale(daily_sale_response.data.result);
        }
      }
      setLoading(false);
    };
    init();
  }, [userid]);

  const onChangePageCount = async (page: number, pagesize: number) => {
    const daily_sale_response = await GetUserDailySale({
      dvatid: dvatdata!.id,
      take: pagesize,
      skip: pagesize * (page - 1),
    });

    if (daily_sale_response.status && daily_sale_response.data.result) {
      setDailySale(daily_sale_response.data.result);
      setPaginatin({
        skip: daily_sale_response.data.skip,
        take: daily_sale_response.data.take,
        total: daily_sale_response.data.total,
      });
    }
  };
  const [addBox, setAddBox] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const Convertto31 = async () => {
    if (!dvatdata) {
      return toast.error("DVAT not found.");
    }
    const response = await ConvertDvat31({
      createdById: userid,
      dvatid: dvatdata.id,
    });

    if (response.status && response.data) {
      toast.success(response.message);
      setIsModalOpen(false);
      await init();
    } else {
      toast.error(response.message);
    }
  };

  if (isLoading)
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );

  return (
    <>
      <Modal
        title="Convert to"
        open={isModalOpen}
        onOk={Convertto31}
        onCancel={() => {
          setIsModalOpen(false);
        }}
      >
        <p>Are you sure you want to convert to DVAT 31 A</p>
      </Modal>
      <Drawer
        placement="right"
        closeIcon={null}
        onClose={() => {
          setAddBox(false);
        }}
        open={addBox}
      >
        <p className="text-lg text-left">Sale Invoice</p>
        <DailySaleProvider userid={userid} setAddBox={setAddBox} init={init} />
      </Drawer>
      <div className="p-2 mt-4">
        <div className="bg-white p-2 shadow mt-2">
          <div className="flex gap-2">
            <p className="text-lg font-semibold items-center">Daily Sale</p>
            <div className="grow"></div>
            <Button
              size="small"
              type="primary"
              className="bg-blue-500 hover:bg-blue-500 w-14"
              onClick={() => {
                setAddBox(true);
              }}
            >
              Add
            </Button>
            <Button
              size="small"
              type="primary"
              className="bg-blue-500 hover:bg-blue-500 px-2"
              onClick={() => {
                setIsModalOpen(true);
              }}
            >
              Convert to
            </Button>
          </div>

          {dailySale.length > 0 ? (
            <>
              <Table className="border mt-2">
                <TableHeader>
                  <TableRow className="bg-gray-100">
                    <TableHead className="border text-center">
                      TIN Number
                    </TableHead>
                    <TableHead className="border text-center">
                      Trade Name
                    </TableHead>
                    <TableHead className="w-64 border text-center">
                      Product Name
                    </TableHead>
                    <TableHead className="w-20 border text-center">
                      Quantity
                    </TableHead>
                    <TableHead className="border text-center">
                      Invoice no.
                    </TableHead>
                    <TableHead className="border whitespace-nowrap text-center">
                      Invoice Date
                    </TableHead>
                    <TableHead className="border text-center">
                      Invoice value (&#x20b9;)
                    </TableHead>
                    <TableHead className="border text-center">
                      Total taxable percentage
                    </TableHead>
                    <TableHead className="border text-center">
                      Vat Amount
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailySale.map(
                    (
                      val: daily_sale & {
                        commodity_master: commodity_master;
                        seller_tin_number: tin_number_master;
                      },
                      index: number
                    ) => (
                      <TableRow key={index}>
                        <TableCell className="p-2 border text-center">
                          {val.seller_tin_number.tin_number}
                        </TableCell>
                        <TableCell className="p-2 border text-center">
                          {val.seller_tin_number.name_of_dealer}
                        </TableCell>
                        <TableCell className="p-2 border text-center">
                          {val.commodity_master.product_name}
                        </TableCell>
                        <TableCell className="p-2 border text-center">
                          {val.quantity}
                        </TableCell>
                        <TableCell className="p-2 border text-center">
                          {val.invoice_number}
                        </TableCell>
                        <TableCell className="p-2 border text-center">
                          {formateDate(val.invoice_date)}
                        </TableCell>
                        <TableCell className="p-2 border text-center">
                          {val.amount}
                        </TableCell>
                        <TableCell className="p-2 border text-center">
                          {val.tax_percent}%
                        </TableCell>
                        <TableCell className="p-2 border text-center">
                          {val.vatamount}
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
              <div className="mt-2"></div>
              <div className="lg:hidden">
                <Pagination
                  align="center"
                  defaultCurrent={1}
                  onChange={onChangePageCount}
                  showSizeChanger
                  total={pagination.total}
                  showTotal={(total: number) => `Total ${total} items`}
                />
              </div>
              <div className="hidden lg:block">
                <Pagination
                  showQuickJumper
                  align="center"
                  defaultCurrent={1}
                  onChange={onChangePageCount}
                  showSizeChanger
                  pageSizeOptions={[2, 5, 10, 20, 25, 50, 100]}
                  total={pagination.total}
                  responsive={true}
                  showTotal={(total: number, range: number[]) =>
                    `${range[0]}-${range[1]} of ${total} items`
                  }
                />
              </div>
            </>
          ) : (
            <>
              <p className="bg-rose-500 bg-opacity-10 rounded text-rose-500 mt-2 px-2 py-1 border border-rose-500">
                There is no daily sale
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default DocumentWiseDetails;
