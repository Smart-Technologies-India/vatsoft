import { IcBaselineArrowBack } from "@/components/icons";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

const Refund = () => {
  return (
    <div className="w-full bg-white p-4">
      <div className="flex gap-2 items-center my-2">
        <Link href={"/"}>
          <IcBaselineArrowBack className="text-lg" />
        </Link>
        <h1 className="text-xl text-left">News and Updates</h1>
      </div>
      <Separator />
      <h4 className="text-left mt-1 text-sm">Augest 2024</h4>
      <News />
      <News />
      <News />
      <News />
    </div>
  );
};
export default Refund;

const News = () => {
  return (
    <div className="border border-gray-800 rounded py-2 px-3 mt-2 bg-white hover:shadow-md">
      <h1 className="text-lg font-medium">
        Detailed Manual and FAQs on filing of GSTR-1A
      </h1>
      <p className="text-sm">
        As per the directions of the Government vide notification no. 12/2024 dt
        10th July 2024, Form GSTR-1A has been made avallable to the taxpayers
        form July 2024 tax period. GSTR-1A is an optional facility to add, amend
        or rectify any particulars of a supply reported/missed in the current
        Tax period&lsquo;s GSTR-1 before filing of GSTR-3B return of the same
        tax period. GSTR-1A shall be open for the taxpayer after filing of
        GSTR-1 of a tax....
      </p>
      <div className="flex pt-1">
        <p>Jul 28th, 2024</p>
        <div className="grow"></div>
        <p className="rounded-full px-2 text-sm bg-gray-300">RETURNS</p>
      </div>
    </div>
  );
};
