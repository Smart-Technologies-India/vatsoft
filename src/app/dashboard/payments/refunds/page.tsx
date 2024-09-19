import { CreateRefundProvider } from "@/components/forms/refund/refund";
import { cookies } from "next/headers";

const Refunds = () => {
  const current_user_id: number = parseInt(cookies().get("id")?.value ?? "0");

  return (
    <main className="p-4">
      <div className="p-2 bg-white shadow">
        <div className="bg-blue-500 p-2 text-white">Refunds</div>
        <CreateRefundProvider userid={current_user_id} />
      </div>
    </main>
  );
};

export default Refunds;
