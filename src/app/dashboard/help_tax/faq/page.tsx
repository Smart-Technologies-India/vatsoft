"use client";

import { Collapse } from "antd";
import type { CollapseProps } from "antd";

const Page = () => {
  const faqs = [
    {
      key: "1",
      label: "What is Value Added Tax (VAT)?",
      children:
        "VAT is a multi-point tax on value addition which is collected at different stages of sale with a provision for set-off for tax paid at the previous stage/tax paid on inputs.",
    },
    {
      key: "2",
      label:
        "Whether it is possible to avail credit for taxes paid on input if goods are sold interstate or are exported?",
      children:
        "Purchases intended for inter-State Sale as well as exports are eligible for tax credit.",
    },
    {
      key: "3",
      label: "When can one claim input Tax Credit?",
      children:
        "Input tax credit is the credit for tax paid on inputs. Dealer has to pay tax after deducting Input tax which he had paid from total tax collected by him.",
    },
    {
      key: "4",
      label: "What proof is required to claim input tax credit?",
      children:
        'Input tax credit can be claimed only on purchases from VAT Registered Dealers. The original "Tax Invoice" is the proof required to claim input tax credit.',
    },
  ];

  const items: CollapseProps["items"] = faqs.map((faq) => ({
    key: faq.key,
    label: <span className="font-medium text-base">{faq.label}</span>,
    children: <p className="text-gray-700 leading-relaxed">{faq.children}</p>,
  }));

  return (
    <main className="min-h-screen bg-linear-to-br from-gray-50 via-blue-50 to-indigo-50 p-4">
      {/* Header Card */}
      <div className="bg-white rounded-xl shadow border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 bg-linear-to-b from-blue-500 to-indigo-600 rounded-full"></div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Frequently Asked Questions
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Find answers to common questions about VAT and tax credits
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Content Card */}
      <div className="bg-white rounded-xl shadow border border-gray-200 p-4">
        <Collapse
          items={items}
          defaultActiveKey={["1"]}
          className="custom-collapse"
          style={{
            backgroundColor: "transparent",
            border: "none",
          }}
        />
      </div>

      <style jsx>{`
        :global(.custom-collapse .ant-collapse-header) {
          padding: 16px 0 !important;
          padding-right: 16px !important;
          color: #1f2937 !important;
          border-bottom: 1px solid #e5e7eb !important;
        }

        :global(.custom-collapse .ant-collapse-header:hover) {
          color: #1e40af !important;
        }

        :global(.custom-collapse > .ant-collapse-item > .ant-collapse-header) {
          padding-left: 0 !important;
        }

        :global(.custom-collapse .ant-collapse-content) {
          background-color: transparent !important;
          border-bottom: 1px solid #e5e7eb !important;
        }

        :global(.custom-collapse .ant-collapse-content-box) {
          padding: 16px 0 !important;
        }

        :global(.custom-collapse .ant-collapse-item:last-child > .ant-collapse-content) {
          border-bottom: none !important;
        }
      `}</style>
    </main>
  );
};
export default Page;
