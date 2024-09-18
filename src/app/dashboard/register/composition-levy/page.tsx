import { cookies } from "next/headers";
import { CompositionProvider } from "@/components/forms/composition/createcomposition";

const Dvat2Page = ({ params }: { params: { dvatid: string } }) => {
  const current_user_id: number = parseInt(cookies().get("id")?.value ?? "0");

  return (
    <>
      <main className="min-h-screen bg-[#f6f7fb] w-full py-2 px-6">
        <div className="bg-white w-full p-4 px-8 shadow mt-2">
          <div className="flex gap-2">
            <p className="text-lg font-nunito">
              Application to Opt for Composition levy
            </p>
            <div className="grow"></div>
            <p className="text-sm">
              <span className="text-red-500">*</span> Include mandatory fields
            </p>
          </div>
          <CompositionProvider userid={current_user_id} composition={true} />
          <div className="flex gap-2"></div>
        </div>
      </main>
    </>
  );
};

export default Dvat2Page;
