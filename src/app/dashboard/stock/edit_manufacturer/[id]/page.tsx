/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import GetByIdManufacturerPurchase from "@/action/stock/getbyidmanufacturerpurchase";
import GetManufacturerPurchase from "@/action/stock/getmanufacturerpurchase";
import { CreateStockProvider } from "@/components/forms/createstock/createstock";
import { EditStockProvider } from "@/components/forms/createstock/editstock";
import { decryptURLData } from "@/utils/methods";
import {
  commodity_master,
  manufacturer_purchase,
  tin_number_master,
} from "@prisma/client";
import { getCookie } from "cookies-next";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const EditMPage = () => {
  const userid: number = parseInt(getCookie("id") ?? "0");

  const router = useRouter();
  const { id } = useParams<{ id: string | string[] }>();
  const midString = Array.isArray(id) ? id[0] : id;

  const mid: number = parseInt(decryptURLData(midString, router));

  const [isLoading, setLoading] = useState<boolean>(true);

  const [mdata, setMdata] = useState<
    | (manufacturer_purchase & {
        commodity_master: commodity_master;
      })
    | null
  >(null);
  useEffect(() => {
    const init = async () => {
      const response = await GetByIdManufacturerPurchase({
        id: mid,
      });

      if (response.data && response.status) {
        setMdata(response.data);
      } else {
        toast.error(response.message);
        router.back();
      }
      setLoading(false);
    };
    init();
  }, [mid]);

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
              Edit Manufacturer Purchase
            </p>
            <div className="grow"></div>
          </div>
          <EditStockProvider id={mid} userid={userid} data={mdata!} />
        </div>
      </div>
    </>
  );
};

export default EditMPage;
