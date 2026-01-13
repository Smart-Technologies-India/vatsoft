/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { dvat04, registration } from "@prisma/client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { capitalcase, decryptURLData } from "@/utils/methods";
import GetDvat04 from "@/action/register/getdvat04";
import {
  Anx1Page,
  Anx2Page,
  Anx3Page,
  Dvat1Page,
  Dvat2Page,
  Dvat3Page,
  UserRegister,
} from "@/components/preview/returnpreview";

const PreviewPage = () => {
  const { dvatid, userid } = useParams<{
    dvatid: string | string[];
    userid: string | string[];
  }>();

  const router = useRouter();


  const dvatidString = Array.isArray(dvatid) ? dvatid[0] : dvatid;
  const dvat_id: number = parseInt(decryptURLData(dvatidString, router));

  const useridString = Array.isArray(userid) ? userid[0] : userid;
  const user_id: number = parseInt(decryptURLData(useridString, router));

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [dvat04Data, setDvat04Data] = useState<
    dvat04 & { registration: registration[] }
  >();

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);

      const dvat04 = await GetDvat04({ id: dvat_id });

      if (dvat04.status && dvat04.data) {
        setDvat04Data(dvat04.data);
      }

      setIsLoading(false);
    };
    init();
  }, []);

  if (isLoading)
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );

  return (
    <>
      <main className="min-h-screen bg-[#f6f7fb] w-full py-2 px-6" id="mainpdf">
        <div className="bg-white w-full px-4 py-2 shadow-sm font-normal p-1 flex justify-between gap-6 mt-4 border">
          {dvat04Data?.status == "APPROVED" ||
          dvat04Data?.status == "PROVISIONAL" ? (
            <div>
              <p className="text-sm">TIN Number</p>
              <p className="text-sm  font-medium">{dvat04Data?.tinNumber}</p>
            </div>
          ) : (
            <div>
              <p className="text-sm">RR Number</p>
              <p className="text-sm  font-medium">
                {dvat04Data?.tempregistrationnumber}
              </p>
            </div>
          )}

          <div>
            <p className="text-sm">Name</p>
            <p className="text-sm  font-medium">{dvat04Data?.name}</p>
          </div>
          <div>
            <p className="text-sm">Trade Name</p>
            <p className="text-sm  font-medium">{dvat04Data?.tradename}</p>
          </div>
          <div>
            <p className="text-sm">Status</p>
            <p className="text-sm  font-medium">
              {capitalcase(dvat04Data?.status ?? "")}
            </p>
          </div>
        </div>

        <div className="bg-white mx-auto shadow mt-4">
          <UserRegister userid={user_id} />
          <Dvat1Page userid={user_id} dvatid={dvat_id} />
          <Dvat2Page userid={user_id} dvatid={dvat_id} />
          <Dvat3Page userid={user_id} dvatid={dvat_id} />
          <Anx1Page userid={user_id} dvatid={dvat_id} extend={true} />
          <Anx2Page userid={user_id} dvatid={dvat_id} extend={true} />
          <Anx3Page userid={user_id} dvatid={dvat_id} />
        </div>
      </main>
    </>
  );
};

export default PreviewPage;
