"use client";
import GetAllNews from "@/action/news/getallnews";
import { IcBaselineArrowBack } from "@/components/icons";
import { Separator } from "@/components/ui/separator";
import { formateDate } from "@/utils/methods";
import { news } from "@prisma/client";
import { Pagination } from "antd";
import Link from "next/link";
import { useEffect, useState } from "react";

const Refund = () => {
  const [pagination, setPaginatin] = useState<{
    take: number;
    skip: number;
    total: number;
  }>({
    take: 10,
    skip: 0,
    total: 0,
  });

  const [newsdata, setNews] = useState<news[]>([]);
  const [isLoading, setLoading] = useState<boolean>(true);
  const init = async () => {
    setLoading(true);
    const news_resonse = await GetAllNews({
      take: 10,
      skip: 0,
    });

    if (news_resonse.status && news_resonse.data.result) {
      setNews(news_resonse.data.result);
      setPaginatin({
        skip: news_resonse.data.skip,
        take: news_resonse.data.take,
        total: news_resonse.data.total,
      });
    }
    setLoading(false);
  };
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const news_resonse = await GetAllNews({
        take: 10,
        skip: 0,
      });

      if (news_resonse.status && news_resonse.data.result) {
        setNews(news_resonse.data.result);
        setPaginatin({
          skip: news_resonse.data.skip,
          take: news_resonse.data.take,
          total: news_resonse.data.total,
        });
      }
      setLoading(false);
    };
    init();
  }, []);

  const onChangePageCount = async (page: number, pagesize: number) => {
    const news_response = await GetAllNews({
      take: pagesize,
      skip: pagesize * (page - 1),
    });

    if (news_response.status && news_response.data.result) {
      setNews(news_response.data.result);
      setPaginatin({
        skip: news_response.data.skip,
        take: news_response.data.take,
        total: news_response.data.total,
      });
    }
  };

  if (isLoading)
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );
  return (
    <div className="w-full bg-white p-4">
      <div className="flex gap-2 items-center my-2">
        <Link href={"/"}>
          <IcBaselineArrowBack className="text-lg" />
        </Link>
        <h1 className="text-xl text-left">News and Updates</h1>
      </div>
      <Separator />
      <h4 className="text-left mt-1 text-sm">August 2024</h4>
      {newsdata.map((val: news, index: number) => (
        <>
          <div
            className="border border-gray-800 rounded py-2 px-3 mt-2 bg-white hover:shadow-md"
            key={index}
          >
            <div className="flex gap-2">
              <h1 className="text-lg font-medium">{val.title}</h1>
              <div className="grow"></div>
            </div>
            <p className="text-sm">{val.descrilption}</p>
            <div className="flex pt-1">
              <p> {formateDate(val.postdate)}</p>
              <div className="grow"></div>
              <p className="rounded-full px-2 text-sm bg-gray-300">
                {val.topic}
              </p>
            </div>
          </div>
        </>
      ))}
      <div className="mt-2"></div>
      <div className="lg:hidden">
        <Pagination
          align="center"
          defaultCurrent={1}
          onChange={onChangePageCount}
          showSizeChanger
          total={pagination.total}
          showTotal={(total: number) => `Total ${total} items`}
        />
      </div>
      <div className="hidden lg:block">
        <Pagination
          showQuickJumper
          align="center"
          defaultCurrent={1}
          onChange={onChangePageCount}
          showSizeChanger
          pageSizeOptions={[2, 5, 10, 20, 25, 50, 100]}
          total={pagination.total}
          responsive={true}
          showTotal={(total: number, range: number[]) =>
            `${range[0]}-${range[1]} of ${total} items`
          }
        />
      </div>
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
