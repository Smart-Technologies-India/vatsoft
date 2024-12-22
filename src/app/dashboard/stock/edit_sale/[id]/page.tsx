/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import GetByIdDailySale from "@/action/stock/getbyiddailysale";
import { EditDailySaleProvider } from "@/components/forms/dailysale/editdailysale";
import { decryptURLData } from "@/utils/methods";
import {
  commodity_master,
  daily_sale,
  tin_number_master,
} from "@prisma/client";
import { getCookie } from "cookies-next";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const EditPPage = () => {
  const userid: number = parseInt(getCookie("id") ?? "0");

  const router = useRouter();
  const { id } = useParams<{ id: string | string[] }>();
  const sidString = Array.isArray(id) ? id[0] : id;

  const sid: number = parseInt(decryptURLData(sidString, router));

  const [isLoading, setLoading] = useState<boolean>(true);

  const [sdata, setSdata] = useState<
    | (daily_sale & {
        commodity_master: commodity_master;
        seller_tin_number: tin_number_master;
      })
    | null
  >(null);
  useEffect(() => {
    const init = async () => {
      const response = await GetByIdDailySale({
        id: sid,
      });

      if (response.data && response.status) {
        setSdata(response.data);
      } else {
        toast.error(response.message);
        router.back();
      }
      setLoading(false);
    };
    init();
  }, [sid]);

  if (isLoading)
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );

  return (
    <>
      <div className="p-2 mt-4">
        <div className="bg-white p-2 shadow mt-2">
          <div className="flex gap-2">
            <p className="text-lg font-semibold items-center">
              Edit Daily Sale
            </p>
            <div className="grow"></div>
          </div>
          <EditDailySaleProvider id={sid} userid={userid} data={sdata!} />
        </div>
      </div>
    </>
  );
};

export default EditPPage;
