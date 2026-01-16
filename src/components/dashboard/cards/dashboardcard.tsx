import { Fa6RegularFolderOpen, LucideArrowRight } from "@/components/icons";
import Link from "next/link";

interface CardsProps {
  title: string;
  description: string;
  link: string;
}

const DashboardCards = (props: CardsProps) => {
  return (
    <Link href={props.link} className="block h-full group">
      <div className="rounded-lg border border-gray-200 shadow-sm p-4 transition-all duration-300 h-full hover:shadow-lg hover:border-blue-400 hover:-translate-y-1 bg-white">
        <div className="flex flex-col h-full">
          <div className="flex gap-3 items-start mb-3">
            <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
              <Fa6RegularFolderOpen className="text-blue-500 text-lg" />
            </div>
            <div className="flex-1">
              <h1 className="text-sm font-bold font-nunito leading-5 text-gray-800 group-hover:text-blue-600 transition-colors">
                {props.title}
              </h1>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-gray-600 mb-4 flex-1">
            {props.description}
          </p>
          <div className="flex items-center justify-end pt-2 border-t border-gray-100">
            <span className="text-xs font-medium text-blue-500 group-hover:text-blue-600 mr-2 transition-colors">
              View Details
            </span>
            <LucideArrowRight className="text-blue-500 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-300" />
          </div>
        </div>
      </div>
    </Link>
  );
};

export default DashboardCards;
