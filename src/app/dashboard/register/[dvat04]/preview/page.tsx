/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { dvat04 } from "@prisma/client";
import { useEffect, useState } from "react";
import { getCookie } from "cookies-next";
import { toast } from "react-toastify";
import { useParams, useRouter } from "next/navigation";
import {
  capitalcase,
  decryptURLData,
  encryptURLData,
  generatePDF,
} from "@/utils/methods";
import { Button, Modal } from "antd";
import { customAlphabet } from "nanoid";
import GetDvat04 from "@/action/register/getdvat04";
import AddTempRegNo from "@/action/register/addtempregno";
import {
  Anx1Page,
  Anx2Page,
  Anx3Page,
  Dvat1Page,
  Dvat2Page,
  Dvat3Page,
  UserRegister,
} from "@/components/preview/returnpreview";
import UpdateToPendingProcess from "@/action/register/udpatetopendingprocess";

const nanoid = customAlphabet("1234567890", 12);

const PreviewPage = () => {
  const router = useRouter();
  const { dvat04 } = useParams<{ dvat04: string | string[] }>();
  const dvatidString = Array.isArray(dvat04) ? dvat04[0] : dvat04;

  const dvatid: number = parseInt(decryptURLData(dvatidString, router));

  console.log(dvatid);
  const current_user_id: number = parseInt(getCookie("id") ?? "0");
  const tempregno: string = nanoid();

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [open, setOpen] = useState(false);

  const [dvat04Data, setDvat04Data] = useState<dvat04>();

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);

      const dvat04 = await GetDvat04({ id: dvatid });

      if (dvat04.status && dvat04.data) {
        setDvat04Data(dvat04.data);
      }

      setIsLoading(false);
    };
    init();
  }, [dvatid]);

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
            {capitalcase(dvat04Data?.status ?? "")}
          </div>
        </div>

        <div className="bg-white mx-auto shadow mt-4">
          <UserRegister />
          <Dvat1Page />
          <Dvat2Page />
          <Dvat3Page />
          <Anx1Page dvatid={dvatid} extend={false} />
          <Anx2Page dvatid={dvatid} extend={false} />
          <Anx3Page dvatid={dvatid} />

          <div className="flex p-4 gap-4">
            <div className="grow"></div>
            <Button
              onClick={async () => {
                await generatePDF(
                  `/dashboard/register/pdfview/${encryptURLData(
                    dvatid.toString()
                  )}/${encryptURLData(current_user_id.toString())}?sidebar=no`
                );
              }}
              type="primary"
            >
              Download
            </Button>

            {dvat04Data?.status == "NONE" ? (
              <>
                <Button
                  onClick={async () => {
                    setOpen(true);
                  }}
                  type="primary"
                >
                  Submit
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={async () => {
                    router.push("/dashboard");
                  }}
                  type="primary"
                >
                  Close
                </Button>

                {dvat04Data?.status == "VERIFICATION" ? (
                  <Button
                    onClick={async () => {
                      //  update status to pending process

                      const response = await UpdateToPendingProcess({
                        tempregno: tempregno,
                        id: dvat04Data?.id ?? 0,
                        userid: current_user_id,
                      });
                      if (!response.status && !response.data)
                        return toast.error(response.message);
                      router.push("/dashboard");
                    }}
                    type="primary"
                  >
                    Submit
                  </Button>
                ) : (
                  <Button
                    onClick={async () => {
                      toast.success(
                        `Your DVAT04 has been submitted successfully with ARN number (${dvat04Data?.tempregistrationnumber}). You will get an update soon.`
                      );

                      router.push("/dashboard");
                    }}
                    type="primary"
                  >
                    Submit
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </main>
      <Modal
        title="Registration Number"
        open={open}
        onOk={async () => {
          setOpen(false);

          const response = await AddTempRegNo({
            tempregno: tempregno,
            id: dvat04Data?.id ?? 0,
            userid: current_user_id,
          });
          if (!response.status && !response.data)
            return toast.error(response.message);

          return router.push("/dashboard");
        }}
        onCancel={() => setOpen(false)}
      >
        <p>Your temporary registration number is: {tempregno}</p>
      </Modal>
    </>
  );
};

export default PreviewPage;
