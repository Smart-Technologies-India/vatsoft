import { DepartmentCreateDvat24AProvider } from "@/components/forms/department/departmentcreatedvat24a";
import { cookies } from "next/headers";

const CreateDvat24A = () => {
  const current_user_id: number = parseInt(cookies().get("id")?.value ?? "0");
  return (
    <>
      <div className="p-2">
        <div className="bg-white p-2 shadow mt-4">
          <div className="bg-blue-500 p-2 text-white">
            Create DVAT 24A Notice
          </div>
          <DepartmentCreateDvat24AProvider userid={current_user_id} />
        </div>
      </div>
    </>
  );
};

export default CreateDvat24A;
