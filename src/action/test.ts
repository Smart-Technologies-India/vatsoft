"use server";

import { mkdir } from "fs/promises";
import { pipeline, Readable } from "stream";
import { promisify } from "util";
import fs from "fs";

const pump = promisify(pipeline);

const uploadPhoto = async (data: FormData): Promise<boolean> => {
  const formdata = Object.fromEntries(data.entries());

  const file: File = formdata.file as File;

  const filePath = `./public/file/${file.name}`;
  await mkdir("./public/file/", { recursive: true });

  const reader = file.stream().getReader();

  const customReadable = new Readable({
    async read(size) {
      const { done, value } = await reader.read();
      if (done) {
        this.push(null);
      } else {
        this.push(value);
      }
    },
  });

  await pump(customReadable, fs.createWriteStream(filePath));

  return true;
};

export default uploadPhoto;
