"use client";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";
import GetAllNews from "@/action/news/getallnews";
import { NewsMasterProvider } from "@/components/forms/news/news";
import { getCurrentUserRole } from "@/lib/auth";
import { formateDate } from "@/utils/methods";
import { news, Role } from "@prisma/client";
import { Button, Drawer, Pagination } from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const NewsPage = () => {
  const router = useRouter();
  const [userid, setUserid] = useState<number>(0);
  const [role, setRole] = useState<Role>(Role.USER);


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
      const authResponse = await getAuthenticatedUserId();
      if (!authResponse.status || !authResponse.data) {
        toast.error(authResponse.message);
        return router.push("/");
      }
      setUserid(authResponse.data);
      const roleResponse = await getCurrentUserRole();
      if(roleResponse != null && roleResponse != undefined){
        setRole(roleResponse as Role);
      }


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

  const [open, setOpen] = useState(false);

  const [addBox, setAddBox] = useState<boolean>(false);
  const [newsid, setNewsid] = useState<number>();

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
    <>
      <Drawer
        placement="right"
        closeIcon={null}
        onClose={() => {
          setAddBox(false);
        }}
        open={addBox}
      >
        <p className="text-lg text-left">{newsid ? "Update" : "Add"} News</p>
        <NewsMasterProvider
          userid={userid}
          id={newsid}
          setAddBox={setAddBox}
          setNewsid={setNewsid}
          init={init}
        />
      </Drawer>

      <main className="w-full p-4 ">
        <div className="bg-white px-4 py-2 mt-2">
          <div className="flex gap-2">
            <p className="text-lg font-semibold">News</p>
            <div className="grow"></div>
            {role != Role.USER && (
              <Button
                size="small"
                type="primary"
                className="bg-blue-500 hover:bg-blue-500 w-14"
                onClick={() => {
                  setNewsid(undefined);
                  setAddBox(true);
                }}
              >
                Add
              </Button>
            )}
          </div>

          {newsdata.map((val: news, index: number) => (
            <>
              <div
                className="border border-gray-800 rounded py-2 px-3 mt-2 bg-white hover:shadow-md"
                key={index}
              >
                <div className="flex gap-2">
                  <h1 className="text-lg font-medium">{val.title}</h1>
                  <div className="grow"></div>
                  {/* <Button
                    size="small"
                    type="primary"
                    className="bg-blue-500 hover:bg-blue-500 w-14"
                    onClick={() => {
                      showDrawer(val.id);
                    }}
                  >
                    View
                  </Button> */}

                  {role != Role.USER && (
                    <Button
                      size="small"
                      type="primary"
                      className="bg-indigo-500 hover:bg-indigo-500 w-14"
                      onClick={() => {
                        setNewsid(val.id);
                        setAddBox(true);
                      }}
                    >
                      Edit
                    </Button>
                  )}
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

          {/* <Table className="border mt-2">
            <TableHeader>
              <TableRow className="bg-gray-100">
                <TableHead className="whitespace-nowrap border text-center p-2">
                  Sr. NO
                </TableHead>
                <TableHead className="whitespace-nowrap border text-center p-2">
                  Title
                </TableHead>
                <TableHead className="whitespace-nowrap border text-center p-2">
                  Post Date
                </TableHead>
                <TableHead className="whitespace-nowrap border text-center p-2">
                  Topic
                </TableHead>

                <TableHead className="whitespace-nowrap border text-center p-2 w-52">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {newsdata.map((val: news, index: number) => (
                <TableRow key={index}>
                  <TableCell className="p-2 border text-center">
                    {val.id}
                  </TableCell>
                  <TableCell className="p-2 border text-center">
                    {val.title}
                  </TableCell>
                  <TableCell className="p-2 border text-center">
                    {val.topic}
                  </TableCell>
                  <TableCell className="p-2 border text-center">
                    {formateDate(val.postdate)}
                  </TableCell>

                  <TableCell className="p-2 text-center grid grid-cols-3 gap-2">
                    <Button
                      size="small"
                      type="primary"
                      className="bg-blue-500 hover:bg-blue-500 w-14"
                      onClick={() => {
                        showDrawer(val.id);
                      }}
                    >
                      View
                    </Button>
                    <button
                      onClick={() => {
                        setCommid(val.id);
                        setAddBox(true);
                      }}
                      className="bg-indigo-500 hover:bg-indigo-400 w-14 text-white rounded-sm"
                    >
                      Edit
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table> */}
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
      </main>
    </>
  );
};

export default NewsPage;
