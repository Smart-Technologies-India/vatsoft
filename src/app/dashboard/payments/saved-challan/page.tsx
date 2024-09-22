import { CreateChallanProvider } from "@/components/forms/challan/createchallan";
import { cookies } from "next/headers";

const CreateChallan = () => {
  const current_user_id: number = parseInt(cookies().get("id")?.value ?? "0");
  return (
    <>
      <div className="p-2">
        <div className="bg-white p-2 shadow mt-4">
          <div className="bg-blue-500 p-2 text-white">
            Create Challan Form DVAT 20
          </div>
          <CreateChallanProvider userid={current_user_id} />
        </div>
      </div>
    </>
  );
};

export default CreateChallan;
