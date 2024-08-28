import { RegistrationProvider } from "@/components/forms/user/registration";

const Register = ({ params }: { params: { dvat04: string } }) => {
  return (
    <main className="min-h-screen bg-[#f6f7fb] w-full py-2 px-4">
      <div className="bg-white w-full p-3 shadow mt-2 ">
        <div className="flex gap-2">
          <p className="text-lg font-nunito">DVAT 04 (1 to 10)</p>
          <div className="grow"></div>
          <p className="text-sm">
            <span className="text-red-500">*</span> Include mandatory fields
          </p>
        </div>
        <RegistrationProvider dvatid={parseInt(params.dvat04)} />
      </div>
    </main>
  );
};

export default Register;
