import { FormSteps } from "@/components/formstepts";
import { Anx1Provider } from "@/components/forms/user/anx1";
import { cookies } from "next/headers";

const Dvat2Page = ({ params }: { params: { dvatid: string } }) => {
  const current_user_id: number = parseInt(cookies().get("id")?.value ?? "0");

  // const { dvatid } = useParams<{ dvatid: string | string[] }>();
  // const dvat04id = parseInt(Array.isArray(dvatid) ? dvatid[0] : dvatid);

  // const current_user_id: number = parseInt(getCookie("id") ?? "0");

  return (
    <>
      <main className="min-h-screen bg-[#f6f7fb] w-full py-2 px-6">
        <div className="bg-white mx-auto p-4 shadow mt-6">
          <FormSteps
            completedSteps={5}
            labels={[
              "User",
              "DVAT04-1",
              "DVAT04-2",
              "DVAT04-3",
              "ANNEXURE-1",
              "ANNEXURE-2",
              "ANNEXURE-3",
              "Preview",
            ]}
          ></FormSteps>
        </div>
        <div className="bg-white w-full p-4 px-8 shadow mt-2">
          <div className="flex gap-2">
            <p className="text-lg font-nunito">Annexure I</p>
            <div className="grow"></div>
            <p className="text-sm">
              <span className="text-red-500">*</span> Include mandatory fields
            </p>
          </div>

          <Anx1Provider
            userid={current_user_id}
            dvatid={parseInt(params.dvatid)}
          />

          <div className="flex gap-2"></div>
        </div>
      </main>
    </>
  );
};

export default Dvat2Page;
