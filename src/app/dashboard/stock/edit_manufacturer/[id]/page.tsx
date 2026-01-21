/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import GetByIdManufacturerPurchase from "@/action/stock/getbyidmanufacturerpurchase";
import { EditStockProvider } from "@/components/forms/createstock/editstock";
import { decryptURLData } from "@/utils/methods";
import {
  commodity_master,
  manufacturer_purchase,
  tin_number_master,
} from "@prisma/client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const EditMPage = () => {
  const [userid, setUserid] = useState<number>(0);

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
      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        return router.push("/");
      }
      setUserid(authResponse.data);
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
      <main className="p-3 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm">
            <div className="mb-3 pb-2 border-b">
              <h1 className="text-lg font-medium text-gray-900">
                Edit Manufacturer Purchase
              </h1>
            </div>
            <EditStockProvider id={mid} userid={userid} data={mdata!} />
          </div>
        </div>
      </main>
    </>
  );
};

export default EditMPage;
