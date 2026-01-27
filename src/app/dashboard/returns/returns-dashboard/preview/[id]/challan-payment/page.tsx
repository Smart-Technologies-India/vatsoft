"use client";

import { useParams, useRouter } from "next/navigation";
import { DvatChallanPayment } from "@/components/dashboard/dvatchallanpayment";
import { decryptURLData } from "@/utils/methods";

const CreateChallan = () => {
  const router = useRouter();
  const { id } = useParams<{ id: string | string[] }>();
  const returnid: number = parseInt(
    decryptURLData(Array.isArray(id) ? id[0] : id, router),
  );

  return (
    <>
      <div className="p-2">
        <div className="bg-white p-2 shadow mt-4">
          <div className="bg-blue-500 p-2 text-white">DVAT 16 Challan</div>
          <DvatChallanPayment returnid={returnid.toString()} />
        </div>
      </div>
    </>
  );
};

export default CreateChallan;
