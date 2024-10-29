import { DvatChallanPayment } from "@/components/dashboard/dvatchallanpayment";
import { decryptURLData } from "@/utils/methods";

const CreateChallan = ({ params }: { params: { id: string } }) => {
  //   const current_user_id: number = parseInt(cookies().get("id")?.value ?? "0");
  return (
    <>
      <div className="p-2">
        <div className="bg-white p-2 shadow mt-4">
          <div className="bg-blue-500 p-2 text-white">DVAT 16 Challan</div>
          <DvatChallanPayment returnid={params.id.toString()} />
        </div>
      </div>
    </>
  );
};

export default CreateChallan;
