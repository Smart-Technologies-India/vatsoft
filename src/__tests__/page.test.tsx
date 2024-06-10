import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
// import Page from "../app/pagehome";
import RootLayout from "../app/layout";
import Home from "../app/uploadpage";

describe("some test cases", () => {
  // test("Page", () => {
  //   render(<Page />);
  //   expect(
  //     screen.getByRole("heading", { level: 1, name: "Home" })
  //   ).toBeDefined();
  // });

  test("layout", () => {
    render(
      <RootLayout>
        <></>
      </RootLayout>
    );
  });

  test("upload", () => {
    render(<Home></Home>);
  });
});
