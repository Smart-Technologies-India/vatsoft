"use client";

import GetComposition from "@/action/composition/getcompositon";
import GetUser from "@/action/user/getuser";
import { CompositionDeptProvider } from "@/components/forms/composition/createdeptcomposition";
import { formateDate } from "@/utils/methods";
import { composition, CompositionStatus, Role, user } from "@prisma/client";
import { Button } from "antd";
import { getCookie } from "cookies-next";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const RefundsData = () => {
  const router = useRouter();
  const current_user_id: number = parseInt(getCookie("id") ?? "0");

  const { id } = useParams<{ id: string | string[] }>();
  const compositionid = parseInt(Array.isArray(id) ? id[0] : id);

  const [compostion, setComposition] = useState<composition | null>(null);
  const [user, setUser] = useState<user | null>(null);
  const [curretnuser, setCurrentUser] = useState<user | null>(null);

  useEffect(() => {
    const init = async () => {
      const composition_response = await GetComposition({
        id: compositionid,
      });
      if (composition_response.status && composition_response.data) {
        setComposition(composition_response.data);
        setUser(composition_response.data.createdBy);
      }

      const current_user_respnse = await GetUser({
        id: current_user_id,
      });
      if (current_user_respnse.status && current_user_respnse.data) {
        setCurrentUser(current_user_respnse.data);
      }
    };
    init();
  }, [compositionid, current_user_id]);
  return (
    <>
      <main className="min-h-screen bg-[#f6f7fb] w-full py-2 px-4">
        <div className="bg-white w-full p-4  shadow mt-2 ">
          <div className="flex gap-2">
            <p className="text-lg font-nunito">
              {compostion?.compositionScheme
                ? "Application to Opt for Composition scheme"
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
              <p className="text-sm  font-medium">
                {user?.firstName} - {user?.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm">Email</p>
              <p className="text-sm  font-medium">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm">Mobile</p>
              <p className="text-sm  font-medium">{user?.mobileOne}</p>
            </div>
            <div className="col-span-3">
              <p className="text-sm">Address</p>
              <p className="text-sm  font-medium">{user?.address}</p>
            </div>
          </div>

          <div className="py-1 text-sm font-medium border-y-2 border-gray-300 mt-4">
            Details Of Composition
          </div>

          <div className="p-1 bg-gray-50 grid grid-cols-3 gap-4 justify-between px-4 border mt-1">
            <div>
              <p className="text-sm">Turnover Last Financial Year</p>
              <p className="text-sm  font-medium">
                {compostion?.turnoverLastFinancialYear}
              </p>
            </div>
            <div>
              <p className="text-sm">Turnover Current Financial Year</p>
              <p className="text-sm  font-medium">
                {compostion?.turnoverCurrentFinancialYear}
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
              <div className="col-span-3">
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
                userid={current_user_id}
                composition={true}
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
