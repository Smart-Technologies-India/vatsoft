"use client";

import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import GetComposition from "@/action/composition/getcompositon";
import GetDvat04FromId from "@/action/dvat/getdvatfromid";
import GetUser from "@/action/user/getuser";
import { CompositionDeptProvider } from "@/components/forms/composition/createdeptcomposition";
import { formateDate } from "@/utils/methods";
import {
  composition,
  CompositionStatus,
  dvat04,
  Role,
  user,
} from "@prisma/client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const RefundsData = () => {
  const router = useRouter();
  const [userid, setUserid] = useState<number>(0);

  const { id } = useParams<{ id: string | string[] }>();
  const compositionid = parseInt(Array.isArray(id) ? id[0] : id);

  const [compostion, setComposition] = useState<composition | null>(null);
  const [user, setUser] = useState<user | null>(null);
  const [curretnuser, setCurrentUser] = useState<user | null>(null);
  const [dvatdata, setDvatData] = useState<dvat04 | null>(null);

  useEffect(() => {
    const init = async () => {
      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        return router.push("/");
      }
      setUserid(authResponse.data);

      const composition_response = await GetComposition({
        id: compositionid,
      });
      if (composition_response.status && composition_response.data) {
        setComposition(composition_response.data);
        setUser(composition_response.data.createdBy);
        const dvat_response = await GetDvat04FromId({
          id: composition_response.data.dvatid,
        });
        if (dvat_response.status && dvat_response.data) {
          setDvatData(dvat_response.data);
        }
      }

      const current_user_respnse = await GetUser({
        id: userid,
      });
      if (current_user_respnse.status && current_user_respnse.data) {
        setCurrentUser(current_user_respnse.data);
      }
    };
    init();
  }, [compositionid, userid]);

  const formatCurrency = (value: string | number | null | undefined) => {
    const parsedValue =
      typeof value === "number" ? value : Number.parseFloat(value || "0");

    const safeValue = Number.isFinite(parsedValue) ? parsedValue : 0;

    return new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 0,
    }).format(safeValue);
  };
  return (
    <>
      <main className="min-h-screen bg-[#f6f7fb] w-full py-2 px-4">
        <div className="bg-white w-full p-4  shadow mt-2 ">
          <div className="flex gap-2">
            <p className="text-lg font-nunito">
              {compostion?.compositionScheme
                ? "Application to Opt for Composition/Quarterly scheme"
                : " Application for Withdrawal from Composition scheme"}
            </p>
            <div className="grow"></div>
            <p className="text-sm">
              <span className="text-red-500">*</span> Include mandatory fields
            </p>
          </div>
          <div className="py-1 text-sm font-medium border-y-2 border-gray-300 mt-4">
            Details Of Taxpayer
          </div>
          <div className="p-1 bg-gray-50 grid grid-cols-3 gap-6 justify-between px-4 mt-1 border">
            <div>
              <p className="text-sm">Name</p>
              <p className="text-sm  font-medium">{dvatdata?.tradename}</p>
            </div>
            <div>
              <p className="text-sm">Email</p>
              <p className="text-sm  font-medium">{dvatdata?.email}</p>
            </div>
            <div>
              <p className="text-sm">Mobile</p>
              <p className="text-sm  font-medium">{dvatdata?.contact_one}</p>
            </div>
            <div className="col-span-3">
              <p className="text-sm">Address</p>
              <p className="text-sm  font-medium">{dvatdata?.address}</p>
            </div>
          </div>

          <div className="py-1 text-sm font-medium border-y-2 border-gray-300 mt-4">
            Details Of Composition
          </div>

          <div className="p-1 bg-gray-50 grid grid-cols-4 gap-4 justify-between px-4 border mt-1">
            <div>
              <p className="text-sm">Turnover Last Financial Year</p>
              <p className="text-sm  font-medium">
                {formatCurrency(compostion?.turnoverLastFinancialYear ?? 0)}
              </p>
            </div>
            <div>
              <p className="text-sm">Tax Liability</p>
              <p className="text-sm  font-medium">{formatCurrency(compostion?.taxLiability ?? 0)}</p>
            </div>
            <div>
              <p className="text-sm">Turnover Current Financial Year</p>
              <p className="text-sm  font-medium">
                {formatCurrency(compostion?.turnoverCurrentFinancialYear ?? 0)}
              </p>
            </div>
            <div>
              <p className="text-sm">Composition Date</p>
              <p className="text-sm  font-medium">
                {formateDate(new Date(compostion?.createdAt!))}
              </p>
            </div>
            {compostion?.remark == null ||
            compostion?.remark == undefined ||
            compostion?.remark == "" ? (
              <></>
            ) : (
              <div className="col-span-1">
                <p className="text-sm">Remark</p>
                <p className="text-sm  font-medium">{compostion?.remark!}</p>
              </div>
            )}
          </div>

          {compostion?.status == CompositionStatus.PENDING ? (
            curretnuser?.role == Role.USER ? (
              <div className="flex mt-2">
                {/* <div className="grow"></div>
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    router.back();
                  }}
                >
                  Back
                </Button> */}
              </div>
            ) : (
              <CompositionDeptProvider
                userid={userid}
                // composition={true}
                compositonid={compostion?.id ?? 0}
              />
            )
          ) : (
            <>
              <div className="py-1 text-sm font-medium border-y-2 border-gray-300 mt-4">
                Details Of Officer Composition
              </div>

              <div className="p-1 bg-gray-50 grid grid-cols-3 gap-4 justify-between px-4 border mt-1">
                <div>
                  <p className="text-sm">Officer Date</p>
                  <p className="text-sm  font-medium">
                    {formateDate(new Date(compostion?.officer_date!))}
                  </p>
                </div>
                <div>
                  <p className="text-sm">Remark</p>
                  <p className="text-sm  font-medium">
                    {compostion?.officerremark}
                  </p>
                </div>
                <div>
                  <p className="text-sm">Status</p>
                  <p className="text-sm  font-medium">{compostion?.status}</p>
                </div>
              </div>
              {/* <div className="flex mt-2">
                <div className="grow"></div>
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    router.back();
                  }}
                >
                  Back
                </Button>
              </div> */}
            </>
          )}
        </div>
      </main>
    </>
  );
};

export default RefundsData;
