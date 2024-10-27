import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";

export async function POST(req: NextRequest, res: NextResponse) {
  try {
    const { url } = await req.json();
    // Launch a new browser instance
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Navigate to your desired page

    await page.goto(`http://localhost:3000/${url}`, {
      waitUntil: "networkidle2",
    });

    await page.waitForSelector("#mainpdf", {
      visible: true,
    });
    await new Promise((resolve) => setTimeout(resolve, 10000));

    // Generate the PDF from the page
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: false,
      headerTemplate: "",
      footerTemplate: "",
      waitForFonts: true,
    });

    await browser.close();

    const response = new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=output.pdf",
      },
    });
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
