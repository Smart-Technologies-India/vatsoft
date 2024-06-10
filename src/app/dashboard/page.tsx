"use client";

import {
  Fa6RegularFolderOpen,
  LucideArrowBigLeft,
  LucideArrowBigRight,
  LucideArrowRight,
  MaterialSymbolsKeyboardDoubleArrowLeft,
  MaterialSymbolsKeyboardDoubleArrowRight,
} from "@/components/icons";
import Link from "next/link";

const Page = () => {
  return (
    <>
      <main className=""></main>
      <main className="bg-gradient-to-l from-[#0452b8] to-[#4088e9]">
        <div className="mx-auto px-4  w-4/6 py-6">
          <h1
            className={`text-white text-center text-3xl font-nunito font-bold`}
          >
            Welcome To Vat Soft
          </h1>
          <p className="w-96 mx-auto text-xs text-justify text-white mt-2 font-nunito">
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Obcaecati
            similique nobis omnis nostrum voluptate at, assumenda iste vero
            distinctio, eius quidem, quam praesentium ea enim id quasi dolorem
            mollitia harum. Consectetur corrupti excepturi repudiandae illum
            asperiores delectus sed blanditiis, cumque culpa placeat ipsa quis
          </p>
        </div>
      </main>

      <main className="bg-gradient-to-l py-4 bg-white mx-4 rounded-md mt-4">
        <p className="text-center mx-auto text-black text-lg my-2 font-nunito font-bold">
          Lorem ipsum dolor sit amet,
        </p>
        <div className="px-4  grid grid-cols-4 justify-between items-center py-1 gap-2">
          <Cards
            title="E Registration"
            description="Lorem ipsum dolor sit amet consectetur adipisicing elit. Sapiente laborum iure "
          />
          <Cards
            title="E Registration Payment"
            description="Lorem ipsum dolor sit amet consectetur adipisicing elit. Sapiente laborum iure "
          />
          <Cards
            title="E Registration Status"
            description="Lorem ipsum dolor sit amet consectetur adipisicing elit. Sapiente laborum iure "
          />
          <Cards
            title="Some Title"
            description="Lorem ipsum dolor sit amet consectetur adipisicing elit. Sapiente laborum iure "
          />
          <Cards
            title="Some Title"
            description="Lorem ipsum dolor sit amet consectetur adipisicing elit. Sapiente laborum iure "
          />
        </div>
      </main>
    </>
  );
};
export default Page;

interface CardsProps {
  title: string;
  description: string;
}

const Cards = (props: CardsProps) => {
  return (
    <Link href={"/dashboard/registeruser"}>
      <div className="rounded-sm shadow border-l-2 border-[#0452b8] p-2 h-28 overflow-hidden">
        <div className="transition-all duration-500 hover:-translate-y-12">
          <div className="h-10 w-10 bg-blue-600 rounded-sm grid place-items-center text-white">
            <Fa6RegularFolderOpen />
          </div>
          <h1 className="text-sm font-semibold font-nunito leading-5 mt-2">
            {props.title}
          </h1>
          <p className="text-xs  leading-3 text-gray-500">
            {props.description}
          </p>
          <div className="flex gap-4 mt-4">
            <div className="grow"></div>
            <div className="h-6 w-6 bg-blue-500 rounded-sm grid  place-items-center text-white cursor-pointer">
              <LucideArrowRight />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};
