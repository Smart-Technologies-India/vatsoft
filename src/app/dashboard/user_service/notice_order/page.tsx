"use client";
import {
  GgInfo,
  MaterialSymbolsClose,
  MdiDownload,
  TablerRefresh,
} from "@/components/icons";
import { Radio, DatePicker } from "antd";

import { Button, Input, InputRef, RadioChangeEvent } from "antd";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useActionState,
  useEffect,
  useOptimistic,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { getCookie } from "cookies-next";
import { Dayjs } from "dayjs";
import { toast } from "react-toastify";
import GetAllNotice from "@/action/notice_order/getallnotice";
import { FormType, order_notice } from "@prisma/client";
import GetUserNotice from "@/action/notice_order/getusernotice";
import { capitalcase, formateDate } from "@/utils/methods";
import Link from "next/link";
const { RangePicker } = DatePicker;

const SupplierDetails = () => {
  const router = useRouter();

  const current_user_id: number = parseInt(getCookie("id") ?? "0");
  const [isLoading, setLoading] = useState<boolean>(true);
  const [isSearch, setSearch] = useState<boolean>(false);

  enum SearchOption {
    TYPE,
    DATE,
  }

  const [searchOption, setSeachOption] = useState<SearchOption>(
    SearchOption.TYPE
  );

  const onChange = (e: RadioChangeEvent) => {
    setSeachOption(e.target.value);
  };

  const typeRef = useRef<InputRef>(null);

  const [searchDate, setSearchDate] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);

  const onChangeDate = (
    dates: [Dayjs | null, Dayjs | null] | null,
    dateStrings: [string, string]
  ) => {
    setSearchDate(dates);
  };
  const init = async () => {
    setLoading(true);

    // const challan_resposne = await GetUserChallan({
    //   userid: id,
    // });
    // if (challan_resposne.data && challan_resposne.data) {
    //   setChallanData(challan_resposne.data);
    // }
    setSearch(false);
    setLoading(false);
  };

  const typesearch = async () => {
    if (
      typeRef.current?.input?.value == undefined ||
      typeRef.current?.input?.value == null ||
      typeRef.current?.input?.value == ""
    ) {
      return toast.error("Enter type");
    }
    // const search_response = await SearchChallan({
    //   userid: id,
    //   cpin: cpinRef.current?.input?.value,
    // });
    // if (search_response.status && search_response.data) {
    //   setChallanData(search_response.data);
    //   setSearch(true);
    // }
  };

  const datesearch = async () => {
    if (searchDate == null || searchDate.length <= 1) {
      return toast.error("Select state date and end date");
    }

    // const search_response = await SearchChallan({
    //   userid: id,
    //   fromdate: searchDate[0]?.toDate(),
    //   todate: searchDate[1]?.toDate(),
    // });
    // if (search_response.status && search_response.data) {
    //   setChallanData(search_response.data);
    //   setSearch(true);
    // }
  };

  const [noticeData, setNoticeData] = useState<order_notice[]>([]);

  useEffect(() => {
    const init = async () => {
      const notice_respone = await GetUserNotice({
        userid: current_user_id,
      });
      if (notice_respone.status && notice_respone.data) {
        setNoticeData(notice_respone.data);
      }
    };
    init();
  }, [current_user_id]);
  const getLink = (type: FormType, id: number): string => {
    switch (type) {
      case FormType.DVAT10:
        return `/dashboard/returns/dvat10?id=${id}`;
      case FormType.DVAT24:
        return `/dashboard/returns/dvat24?id=${id}`;
      case FormType.DVAT24A:
        return `/dashboard/returns/dvat24a?id=${id}`;
      default:
        return `/dashboard/returns/dvat10?id=${id}`;
    }
  };

  return (
    <>
      <div className="p-6">
        <div className="bg-white p-2 shadow mt-4">
          <div className="bg-blue-500 p-2 text-white">Notices and Orders</div>
          <div className="p-2 bg-gray-50 mt-2">
            <Radio.Group
              onChange={onChange}
              value={searchOption}
              className="mt-2"
            >
              <Radio value={SearchOption.TYPE}>Type</Radio>
              <Radio value={SearchOption.DATE}>Period</Radio>
            </Radio.Group>
            <div className="mt-2"></div>
            {(() => {
              switch (searchOption) {
                case SearchOption.TYPE:
                  return (
                    <div className="flex gap-2">
                      <Input
                        className="w-60"
                        ref={typeRef}
                        placeholder={"Enter Type"}
                      />
                      <Button onClick={typesearch} type="primary">
                        Search
                      </Button>
                      {isSearch && (
                        <Button onClick={init} type="primary">
                          Reset
                        </Button>
                      )}
                    </div>
                  );

                case SearchOption.DATE:
                  return (
                    <div className="flex gap-2">
                      <RangePicker onChange={onChangeDate} />
                      <Button type="primary" onClick={datesearch}>
                        Search
                      </Button>
                      {isSearch && (
                        <Button onClick={init} type="primary">
                          Reset
                        </Button>
                      )}
                    </div>
                  );
                default:
                  return null;
              }
            })()}
          </div>
          <p className="text-sm mt-2">
            List of Notices & Orders issued by Authorities
          </p>
          <Table className="border mt-2">
            <TableHeader>
              <TableRow className="bg-gray-100">
                <TableHead className="">Notice/Demand Order Id</TableHead>
                <TableHead className="whitespace-nowrap text-center">
                  Issued By
                </TableHead>
                <TableHead className="text-center">Type</TableHead>
                <TableHead className="text-center">
                  Notice/ Order Description
                </TableHead>
                <TableHead className="text-center">Date of Issuance</TableHead>
                <TableHead className="text-center">Due Date</TableHead>
                <TableHead className="text-center">Amount of Demand</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Download</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {noticeData.map((val: order_notice, index: number) => (
                <TableRow key={index}>
                  <TableCell className="text-center">
                    <Link
                      href={getLink(val.form_type, val.id)}
                      className="text-blue-500"
                    >
                      {val.ref_no.toUpperCase()}
                    </Link>
                  </TableCell>
                  <TableCell className="text-center">
                    System Generated
                  </TableCell>
                  <TableCell className="text-center">
                    {capitalcase(val.notice_order_type)}
                  </TableCell>
                  <TableCell className="text-center">{val.form_type}</TableCell>
                  <TableCell className="text-center">
                    {formateDate(val.issue_date)}
                  </TableCell>
                  <TableCell className="text-center">
                    {formateDate(val.due_date)}
                  </TableCell>
                  <TableCell className="text-center">{val.amount}</TableCell>
                  <TableCell className="text-center">
                    {" "}
                    {capitalcase(val.status)}
                  </TableCell>
                  <TableCell className="text-center text-blue-500">
                    <MdiDownload />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex mt-2 gap-2">
            <div className="grow"></div>
            <Button
              onClick={(e) => {
                e.preventDefault();
                router.back();
              }}
              type="default"
            >
              Back
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SupplierDetails;
