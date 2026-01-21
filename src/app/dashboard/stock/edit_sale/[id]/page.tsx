/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import GetByIdDailySale from "@/action/stock/getbyiddailysale";
import { EditDailySaleProvider } from "@/components/forms/dailysale/editdailysale";
import { decryptURLData } from "@/utils/methods";
import {
  commodity_master,
  daily_sale,
  tin_number_master,
} from "@prisma/client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const EditPPage = () => {
  const [userid, setUserid] = useState<number>(0);

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
      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        return router.push("/");
      }
      setUserid(authResponse.data);
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
      <main className="p-3 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm">
            <div className="mb-3 pb-2 border-b">
              <h1 className="text-lg font-medium text-gray-900">
                Edit Daily Sale
              </h1>
            </div>
            <EditDailySaleProvider id={sid} userid={userid} data={sdata!} />
          </div>
        </div>
      </main>
    </>
  );
};

export default EditPPage;
