"use client";

import { dvat04, refunds, Role, user } from "@prisma/client";
import { getCookie } from "cookies-next";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToWords } from "to-words";
import {
  capitalcase,
  decryptURLData,
  encryptURLData,
  formatDateTime,
  formateDate,
  generatePDF,
  onFormError,
} from "@/utils/methods";
import { Separator } from "@/components/ui/separator";
import { FieldErrors, useForm } from "react-hook-form";
import {
  SubmitPaymentForm,
  SubmitPaymentSchema,
} from "@/schema/subtmitpayment";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { toast } from "react-toastify";
import GetUserDvat04 from "@/action/dvat/getuserdvat";
import { Button } from "antd";
import GetRefunds from "@/action/refund/getrefunds";
import AddRefundsPayment from "@/action/refund/addrefundspayment";
import GetUser from "@/action/user/getuser";

const CFROM = () => {
  const router = useRouter();
  //   const { id } = useParams<{ id: string | string[] }>();
  //   const refundsid = parseInt(
  //     decryptURLData(Array.isArray(id) ? id[0] : id, router)
  //   );
  const current_user_id: number = parseInt(getCookie("id") ?? "0");
  const [isLoading, setLoading] = useState<boolean>(true);

  const [user, setUser] = useState<user | null>(null);
  const [dvat, setDvat] = useState<dvat04 | null>(null);

  const toWords = new ToWords();

  const [currentUser, setCurrentUser] = useState<user | null>();

  useEffect(() => {
    const init = async () => {
      setLoading(true);

      //   const refunds_resposne = await GetRefunds({
      //     id: refundsid,
      //   });
      //   if (refunds_resposne.data && refunds_resposne.data) {
      //     setRefundsData(refunds_resposne.data);
      //     setUser(refunds_resposne.data.createdBy);

      //     const dvat_response = await GetUserDvat04({
      //       userid: refunds_resposne.data.createdBy.id,
      //     });
      //     if (dvat_response.data && dvat_response.status) {
      //       setDvat(dvat_response.data);
      //     }
      //   }

      //   const current_user_response = await GetUser({
      //     id: current_user_id,
      //   });

      //   if (current_user_response.status && current_user_response.data) {
      //     setCurrentUser(current_user_response.data);
      //   }

      setLoading(false);
    };
    init();
    //   }, [refundsid, current_user_id]);
  }, [current_user_id]);

  const [refundsData, setRefundsData] = useState<refunds | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<SubmitPaymentForm>({
    resolver: valibotResolver(SubmitPaymentSchema),
  });

  const onSubmit = async (data: SubmitPaymentForm) => {
    if (!refundsData || refundsData == null) {
      return toast.error("There is no refunds data.");
    }
    const response = await AddRefundsPayment({
      id: refundsData.id,
      userid: current_user_id,
      bank_name: data.bank_name,
      track_id: data.track_id,
      transaction_id: data.transaction_id,
    });

    if (!response.status) return toast.error(response.message);

    toast.success(response.message);
    router.back();
  };

  if (isLoading)
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );

  return (
    <>
      <div className="mainpdf" id="mainpdf">
        <div className="bg-white p-8 shadow h-[1123px] w-[794px] mx-auto">
          <div className="border border-black p-2 h-full w-full">
            <div className="p-4 text-center text-sm">Original</div>
            <div className="text-center text-sm font-medium">
              THE CENTRAL SALES TAX
            </div>
            <div className="text-center text-sm font-medium">
              (REGISTRATION AND TURN OVER) RULES 1957
            </div>
            <div className="text-center text-sm font-medium">
              FORM &lsquo;C&lsquo;
            </div>
            <div className="text-center text-xs font-medium mt-4">
              Form of declaration
            </div>
            <div className="text-center text-xs font-normal mt-2">
              ________________[See Rule 12(1)]________________
            </div>

            <table border={1} className="w-5/6 mx-auto mt-6">
              <tbody className="w-full">
                <tr className="w-full">
                  <td className="px-2 leading-4 py-1  text-sm w-[50%]">
                    Office of Issue
                  </td>
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">
                    Dept. of VAT – Dadra and Nagar Haveli
                  </td>
                </tr>
                <tr className="w-full">
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">
                    Date of Issue :
                  </td>
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">
                    24/11/2014
                    {/* {formateDate(new Date(return01?.createdAt!))} */}
                  </td>
                </tr>
              </tbody>
            </table>
            <table border={1} className="w-5/6 mx-auto mt-4">
              <tbody className="w-full">
                <tr className="w-full">
                  <td className="px-2 leading-4 py-1  text-sm w-[50%]">
                    Name of the purchasing dealer
                  </td>
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">
                    PRATHMESH AGENCIES
                  </td>
                </tr>
                <tr className="w-full">
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">
                    to whom issued along with his RC NO
                  </td>
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">
                    26001000552
                  </td>
                </tr>
                <tr className="w-full">
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">
                    Date from which registration is valid
                  </td>
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">
                    04/11/2004
                  </td>
                </tr>
                <tr className="w-full">
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">
                    Serial No
                  </td>
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">
                    DNH/C/1512671
                  </td>
                </tr>
                <tr className="w-full">
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">To</td>
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">
                    HINDUSTAN PETROLIUM CORPORATION LTD. (#Seller)
                  </td>
                </tr>
                <tr className="w-full">
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">
                    Seller Tin No
                  </td>
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">
                    27960000002
                  </td>
                </tr>
              </tbody>
            </table>

            <p className="w-5/6 mx-auto my-6 text-sm text-justify">
              [Certified that the goods ordered for in our purchase order
              No.............dated.........................as stated below*] are
              for **resale......use in manufacture/processing of goods for sale
              .........in the telecommunication network.... use in mining
              .....................................use in
              generation/distribution of
              power..................................................... packing
              of goods for sale/resale
              .............................................and are covered by
              my/our registration certificate
              No....................dated...................issued under the
              Central Sales Tax Act,1956.[It is further certified that I/We
              am/are not registered under section 7 of the said Act,in the State
              of.................................... in which the goods covered
              by this Form are/will be delivered.]
            </p>

            <p className="text-left w-5/6 mx-auto mt-4 text-sm">
              Name and address of the purchasing dealer in full:PRATHMESH
              AGENCIES,SRY.NO.693/2/2/2,VAD FALIA,SILVASSA,NAROLI
            </p>
            <p className="text-left w-5/6 mx-auto text-sm">
              Date .............
            </p>
            <p className="text-left w-5/6 mx-auto text-sm">
              [The above statements are true to the best of my knowledge and
              belief.
            </p>
            <p className="text-right mt-4 text-sm">
              (Signature)...................................................
            </p>
            <p className="text-right text-sm">
              (Name of the person signing the certificate)
            </p>
            <p className="text-right text-sm">
              (Status of the person signing the certificate in relation to the
              dealer)].
            </p>
            <p className="text-left mt-4 text-sm">
              [*Particulars of Bill/Cash Memo[/Challan]
            </p>
            <p className="text-left text-sm">
              Date...............No..................Amount: Rs.296778491.84
            </p>
            <p className="text-left text-sm">
              Name and Address of the seller with name of the State:HINDUSTAN
              PETROLIUM CORPORATION LTD,VA
              <br />
              &nbsp;&nbsp;SHI,MAHARASTRA
            </p>
            <p className="text-left text-sm">
              **Strike out whichever is not applicable.
            </p>
            <p className="text-left text-xs">
              Note 1. To be furnished to the prescribed authority.)
            </p>
          </div>
        </div>

        <div className="bg-white p-8 shadow h-[1123px] w-[794px] mx-auto">
          <div className="border border-black p-2 h-full w-full">
            <table border={1} className="w-5/6 mx-auto mt-6">
              <tbody className="w-full">
                <tr className="w-full">
                  <td className="px-2 leading-4 py-1  text-sm w-[50%]">
                    Office of Issue
                  </td>
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">
                    Dept. of VAT – Dadra and Nagar Haveli
                  </td>
                </tr>
                <tr className="w-full">
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">
                    Date of Issue :
                  </td>
                  <td className="px-2 leading-4 py-1 text-sm w-[50%]">
                    24/11/2014
                    {/* {formateDate(new Date(return01?.createdAt!))} */}
                  </td>
                </tr>
              </tbody>
            </table>
            <table border={1} className="w-5/6 mx-auto mt-6">
              <thead>
                <tr>
                  <td
                    className="border border-black text-sm text-center"
                    colSpan={7}
                  >
                    INVOICE DETAILS
                  </td>
                </tr>
              </thead>
              <tbody className="w-full">
                <tr className="w-full">
                  <td className="px-2 leading-4 py-1 border border-black  text-sm w-[14%]">
                    SI.No
                  </td>
                  <td className="px-2 leading-4 py-1 border border-black text-sm w-[14%]">
                    Inv. No
                  </td>
                  <td className="px-2 leading-4 py-1 border border-black text-sm w-[14%]">
                    Inv.Date
                  </td>
                  <td className="px-2 leading-4 py-1 border border-black text-sm w-[15%]">
                    Commodity Desc.
                  </td>
                  <td className="px-2 leading-4 py-1 border border-black text-sm w-[14%]">
                    Inv. Valuse(Rs)
                  </td>
                  <td className="px-2 leading-4 py-1 border border-black text-sm w-[14%]">
                    Purpose
                  </td>
                  <td className="px-2 leading-4 py-1 border border-black text-sm w-[15%]">
                    Pur.Ord.No./Date
                  </td>
                </tr>
                {[
                  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18,
                  19, 20, 21, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34,
                  35,
                ].map((val) => (
                  <tr key={val} className="w-full">
                    <td className="px-2 leading-4 py-1 border border-black  text-sm w-[14%]">
                      A
                    </td>
                    <td className="px-2 leading-4 py-1 border border-black text-sm w-[14%]">
                      B
                    </td>
                    <td className="px-2 leading-4 py-1 border border-black text-sm w-[14%]">
                      C
                    </td>
                    <td className="px-2 leading-4 py-1 border border-black text-sm w-[15%]">
                      D
                    </td>
                    <td className="px-2 leading-4 py-1 border border-black text-sm w-[14%]">
                      E
                    </td>
                    <td className="px-2 leading-4 py-1 border border-black text-sm w-[14%]">
                      F
                    </td>
                    <td className="px-2 leading-4 py-1 border border-black text-sm w-[15%]">
                      G
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <Button
          className="hidden-print"
          type="primary"
          onClick={async (e) => {
            await generatePDF(`/dashboard/cform?sidebar=no`);
          }}
        >
          Download Challan
        </Button>
      </div>
    </>
  );
};

export default CFROM;
