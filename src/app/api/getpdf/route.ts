import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    // Launch a new browser instance
    console.log(`Generating PDF for URL: http://localhost:3001/${url}`);
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    await page.goto(
      `http://localhost:3001/${url}`.replace(/([^:]\/)\/+/g, "$1"),
      {
        waitUntil: "networkidle2",
      },
    );

    await page.waitForSelector("#mainpdf", {
      visible: true,
    });
    await new Promise((resolve) => setTimeout(resolve, 20000));

    // Generate the PDF from the page
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: false,
      headerTemplate: "",
      footerTemplate: "",
      waitForFonts: true,
      margin: {
        top: "20px",
        right: "20px",
        bottom: "20px",
        left: "20px",
      },
    });
    await browser.close();

    const response = new NextResponse(pdf as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=output.pdf",
      },
    });
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 },
    );
  }
}
