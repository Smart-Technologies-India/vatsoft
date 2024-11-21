"use client";

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AccordionContent } from "@radix-ui/react-accordion";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const Page = () => {
  const faqs = [
    {
      question: "What is Value Added Tax (VAT)?",
      answer:
        "VAT is a multi-point tax on value addition which is collected at different stages of sale with a provision for set-off for tax paid at the previous stage/tax paid on inputs.",
    },
    {
      question:
        "Whether it is possible to avail credit for taxes paid on input if goods are sold interstate or are exported?",
      answer:
        "Purchases intended for inter-State Sale as well as exports are eligible for tax credit.",
    },
    {
      question: "When can one claim input Tax Credit?",
      answer:
        "Input tax credit is the credit for tax paid on inputs. Dealer has to pay tax after deducting Input tax which he had paid from total tax collected by him.",
    },
    {
      question: "What proof is required to claim input tax credit?",
      answer:
        'Input tax credit can be claimed only on purchases from VAT Registered Dealers. The original "Tax Invoice" is the proof required to claim input tax credit.',
    },
  ];
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (value: string) => {
    setOpenItems((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };
  return (
    <>
      <main className="bg-gradient-to-l py-4 px-4 rounded-md mt-4 w-full xl:w-5/6 xl:mx-auto">
        <section className="mx-auto md:w-5/6 py-4 px-6 md:px-0 ">
          <h1 className="text-center text-3xl font-semibold text-[#1096b7] mb-8">
            Frequently Asked Questions
          </h1>
          <Accordion
            type="multiple"
            value={openItems}
            onValueChange={setOpenItems}
            className="space-y-4"
          >
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border border-[#1096b7]/20 rounded-lg overflow-hidden transition-all duration-200 ease-in-out hover:border-[#1096b7]/50"
              >
                <AccordionTrigger
                  onClick={() => toggleItem(`item-${index}`)}
                  className="px-6 py-4 text-left text-[#1096b7] hover:text-[#0d7a94] transition-colors duration-200"
                >
                  <span className="text-lg font-medium">{faq.question}</span>
                  {/* <ChevronDown
                  className={`shrink-0 text-[#1096b7] transition-transform duration-200 ${
                    openItems.includes(`item-${index}`) ? "rotate-180" : ""
                  }`}
                /> */}
                </AccordionTrigger>
                <AnimatePresence>
                  {openItems.includes(`item-${index}`) && (
                    <AccordionContent forceMount asChild>
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        <p className="px-6 py-4 text-[#1096b7]/80">
                          {faq.answer}
                        </p>
                      </motion.div>
                    </AccordionContent>
                  )}
                </AnimatePresence>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </main>
    </>
  );
};
export default Page;
