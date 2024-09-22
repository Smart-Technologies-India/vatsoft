import { Fa6RegularFolderOpen, LucideArrowRight } from "@/components/icons";
import Link from "next/link";

interface CardsProps {
  title: string;
  description: string;
  link: string;
}

const DashboardCards = (props: CardsProps) => {
  return (
    <Link href={props.link} className="block h-full">
      <div className="rounded-sm shadow-sm p-2 transition-all duration-500 h-full hover:shadow-md bg-white">
        <div className="">
          <div className="flex gap-2 items-center">
            <div className="shrink-0 h-10 w-10 bg-blue-500 bg-opacity-30 rounded-sm grid place-items-center text-white">
              <Fa6RegularFolderOpen className="text-blue-500 text-xl" />
            </div>
            <h1 className="text-xs font-semibold font-nunito leading-4">
              {props.title}
            </h1>
          </div>
          <p className="text-xs  leading-3 text-gray-500 mt-2">
            {props.description}
          </p>
          <div className="flex gap-4 mt-2">
            <div className="grow"></div>
            <LucideArrowRight className="cursor-pointer text-blue-400 text-xl" />
          </div>
        </div>
      </div>
    </Link>
  );
};

export default DashboardCards;
