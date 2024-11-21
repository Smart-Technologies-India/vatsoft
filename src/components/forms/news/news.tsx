/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import { FormProvider, useForm, useFormContext } from "react-hook-form";

import { TaxtInput } from "../inputfields/textinput";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { TaxtAreaInput } from "../inputfields/textareainput";
import { toast } from "react-toastify";
import { onFormError } from "@/utils/methods";
import { getCookie } from "cookies-next";
import { NewsForm, NewsSchema } from "@/schema/news";
import { DateSelect } from "../inputfields/dateselect";
import CreateNews from "@/action/news/createnews";
import GetNews from "@/action/news/getnews";
import UpdateNews from "@/action/news/updatenews";

type NewsProviderProps = {
  userid: number;
  id?: number;
  setAddBox: Dispatch<SetStateAction<boolean>>;
  setNewsid: Dispatch<SetStateAction<number | undefined>>;
  init: () => Promise<void>;
};

export const NewsMasterProvider = (props: NewsProviderProps) => {
  const methods = useForm<NewsForm>({
    resolver: valibotResolver(NewsSchema),
  });

  return (
    <FormProvider {...methods}>
      <NewsMaster
        userid={props.userid}
        id={props.id}
        setAddBox={props.setAddBox}
        setNewsid={props.setNewsid}
        init={props.init}
      />
    </FormProvider>
  );
};

const NewsMaster = (props: NewsProviderProps) => {
  const userid: number = parseFloat(getCookie("id") ?? "0");

  const {
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useFormContext<NewsForm>();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    reset({
      title: "",
      description: "",
      postdate: "",
      topic: "",
    });
    const init = async () => {
      if (props.id) {
        const news_response = await GetNews({
          id: props.id,
        });
        if (news_response.status && news_response.data) {
          reset({
            description: news_response.data.descrilption,
            postdate: news_response.data.postdate.toISOString(),
            title: news_response.data.title,
            topic: news_response.data.topic,
          });
        }
      }
      setIsLoading(false);
    };
    init();
  }, [props.id]);

  const onSubmit = async (data: NewsForm) => {
    if (props.id) {
      const update_response = await UpdateNews({
        id: props.id,
        updatedby: userid,
        title: data.title,
        description: data.description,
        postdate: new Date(data.postdate),
        topic: data.topic,
      });
      if (update_response.status) {
        toast.success(update_response.message);
      } else {
        toast.error(update_response.message);
      }
    } else {
      const news_response = await CreateNews({
        createdby: userid,
        title: data.title,
        topic: data.topic,
        description: data.description,
        postdate: new Date(data.postdate),
      });
      if (news_response.status) {
        toast.success(news_response.message);
      } else {
        toast.error(news_response.message);
      }
    }
    await props.init();
    props.setAddBox(false);
    props.setNewsid(undefined);
  };

  if (isLoading)
    return (
      <div className="h-screen w-full grid place-items-center text-3xl text-gray-600 bg-gray-200">
        Loading...
      </div>
    );

  return (
    <form onSubmit={handleSubmit(onSubmit, onFormError)}>
      <div className="mt-2">
        <TaxtInput<NewsForm>
          placeholder="Enter Title"
          name="title"
          required={true}
          title="Title"
        />
      </div>
      <div className="mt-2">
        <TaxtInput<NewsForm>
          title="Topic"
          required={true}
          name="topic"
          placeholder="Enter topic"
        />
      </div>
      <div className="mt-2">
        <DateSelect<NewsForm>
          title="Post Date"
          required={true}
          name="postdate"
          placeholder="Selete Date"
        />
      </div>
      <div className="mt-2">
        <TaxtAreaInput<NewsForm>
          title="Description"
          required={true}
          name="description"
          placeholder="Enter Description"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="reset"
          onClick={(e) => {
            e.preventDefault();
            props.setAddBox(false);
            props.setNewsid(undefined);
          }}
          className="py-1 rounded-md bg-rose-500 px-4 text-sm text-white mt-2 cursor-pointer"
        >
          Close
        </button>
        {props.id ? (
          <></>
        ) : (
          <input
            type="reset"
            onClick={(e) => {
              e.preventDefault();
              reset({
                title: "",
                description: "",
                postdate: "",
                topic: "",
              });
            }}
            value={"Reset"}
            className="py-1 rounded-md bg-blue-500 px-4 text-sm text-white mt-2 cursor-pointer"
          />
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="py-1 rounded-md bg-blue-500 px-4 text-sm text-white mt-2 cursor-pointer"
        >
          {isSubmitting ? "Loading...." : props.id ? "Update" : "Submit"}
        </button>
      </div>
    </form>
  );
};
