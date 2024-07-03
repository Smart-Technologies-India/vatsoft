"use client";

import Fuse from "fuse.js";
import { useEffect, useRef } from "react";
import { toast } from "react-toastify";

interface Person {
  name: string;
}
const data: Person[] = [
  {
    name: "ekich san",
  },
  {
    name: "analog sombra",
  },
  {
    name: "phoxnix foxwell",
  },
  {
    name: "monika chan",
  },
  {
    name: "soniya",
  },
  {
    name: "aya chan",
  },
  {
    name: "mizuki",
  },
  {
    name: "javla",
  },
  {
    name: "jevla",
  },
  {
    name: "javlu",
  },
  {
    name: "jayesh",
  },
];

const TestSearch = () => {
  const fuse = new Fuse(data, {
    isCaseSensitive: false,
    threshold: 0.5,
    keys: ["name"],
  });
  const searchRef = useRef<HTMLInputElement>(null);
  const search = async () => {
    if (
      searchRef.current?.value == null ||
      searchRef.current?.value == undefined ||
      searchRef.current?.value == ""
    ) {
      return toast.error("enter keywork in order to search");
    }

    console.log(searchRef.current?.value);
    const response = fuse.search(searchRef.current?.value);
    console.log(response);
  };

  return (
    <div>
      <input type="text" ref={searchRef} className="border" />
      <button onClick={search}>Search</button>
    </div>
  );
};
export default TestSearch;
