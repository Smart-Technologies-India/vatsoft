/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import GetByIdDailyPurchase from "@/action/stock/getbyiddailypuchase";
import { EditDailyPurchaseMasterProvider } from "@/components/forms/dailypurchase/editdailypurchase";
import { decryptURLData } from "@/utils/methods";
import {
  commodity_master,
  daily_purchase,
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
  const pidString = Array.isArray(id) ? id[0] : id;

  const pid: number = parseInt(decryptURLData(pidString, router));

  const [isLoading, setLoading] = useState<boolean>(true);

  const [ddata, setDdata] = useState<
    | (daily_purchase & {
        commodity_master: commodity_master;
        seller_tin_number: tin_number_master;
      })
    | null
  >(null);
  useEffect(() => {
    const init = async () => {
      const response = await GetByIdDailyPurchase({
        id: pid,
      });

      if (response.data && response.status) {
        setDdata(response.data);
      } else {
        toast.error(response.message);
        router.back();
      }
      setLoading(false);
    };
    init();
  }, [pid]);

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
              Edit Daily Purchase
            </p>
            <div className="grow"></div>
          </div>
          <EditDailyPurchaseMasterProvider
            id={pid}
            userid={userid}
            data={ddata!}
          />
        </div>
      </div>
    </>
  );
};

export default EditPPage;
