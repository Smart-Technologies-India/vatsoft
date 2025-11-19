"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";

export default function PolicyPage() {
  const [activeSection, setActiveSection] = useState("terms");

  useEffect(() => {
    const handleScroll = () => {
      const sections = [
        "terms",
        "privacy",
        "disclaimer",
        "usage",
        "copyright",
        "contact",
        "acceptance",
      ];

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 150 && rect.bottom >= 150) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 120;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <>
      <main className="bg-[#f8fafe] min-h-screen">
        {/* Header */}
        <header className="bg-[#05313c] w-full flex gap-2 items-center mx-auto md:w-3/5 px-6 md:px-0">
          <div className="mx-auto hidden md:block">
            <Link
              href="/"
              className="text-white inline-block py-1 px-3 hover:bg-white hover:text-[#0b1e59]"
            >
              Home
            </Link>
            <Link
              href="/contact"
              className="text-white inline-block py-1 px-3 hover:bg-white hover:text-[#0b1e59]"
            >
              Contact
            </Link>
            <Link
              href="https://docs.google.com/forms/d/e/1FAIpQLSf-bLcpu_zAmyzgv4dxahMfDgOAfeNcnI8fg2y1yyfG2k_Org/viewform?usp=sharing"
              className="text-white inline-block py-1 px-3 hover:bg-white hover:text-[#0b1e59]"
            >
              Registration
            </Link>
            <Link
              href="/verify"
              className="text-white inline-block py-1 px-3 hover:bg-white hover:text-[#0b1e59]"
            >
              Verify
            </Link>
          </div>
        </header>

        {/* Mobile Navigation */}
        <div className="mx-auto md:hidden bg-[#05313c] flex justify-center md:w-3/5 py-4 px-6 md:px-0">
          <Link
            href="/"
            className="text-white inline-block py-1 px-3 hover:bg-white hover:text-[#0b1e59]"
          >
            Home
          </Link>
          <Link
            href="/contact"
            className="text-white inline-block py-1 px-3 hover:bg-white hover:text-[#0b1e59]"
          >
            Contact
          </Link>
          <Link
            href="https://docs.google.com/forms/d/e/1FAIpQLSf-bLcpu_zAmyzgv4dxahMfDgOAfeNcnI8fg2y1yyfG2k_Org/viewform?usp=sharing"
            className="text-white inline-block py-1 px-3 hover:bg-white hover:text-[#0b1e59]"
          >
            Registration
          </Link>
          <Link
            href="/verify"
            className="text-white inline-block py-1 px-3 hover:bg-white hover:text-[#0b1e59]"
          >
            Verify
          </Link>
        </div>

        {/* Sticky Navigation Bar */}
        <div className="sticky top-0 z-50 bg-white shadow-md border-b border-gray-200">
          <div className="mx-auto md:w-3/5 px-6 md:px-0">
            <nav className="flex overflow-x-auto py-3 gap-2 scrollbar-hide">
              <button
                onClick={() => scrollToSection("terms")}
                className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  activeSection === "terms"
                    ? "bg-[#1096b7] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Terms & Conditions
              </button>
              <button
                onClick={() => scrollToSection("privacy")}
                className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  activeSection === "privacy"
                    ? "bg-[#1096b7] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Privacy Policy
              </button>
              <button
                onClick={() => scrollToSection("disclaimer")}
                className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  activeSection === "disclaimer"
                    ? "bg-[#1096b7] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Disclaimer
              </button>
              <button
                onClick={() => scrollToSection("usage")}
                className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  activeSection === "usage"
                    ? "bg-[#1096b7] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Usage Policy
              </button>
              <button
                onClick={() => scrollToSection("copyright")}
                className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  activeSection === "copyright"
                    ? "bg-[#1096b7] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Copyright
              </button>
              <button
                onClick={() => scrollToSection("contact")}
                className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  activeSection === "contact"
                    ? "bg-[#1096b7] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Contact
              </button>
              <button
                onClick={() => scrollToSection("acceptance")}
                className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  activeSection === "acceptance"
                    ? "bg-[#1096b7] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Acceptance
              </button>
            </nav>
          </div>
        </div>

        {/* Page Content */}
        <div className="mx-auto md:w-3/5 py-8 px-6 md:px-0">
          {/* Breadcrumb */}
          <div className="flex items-center text-sm text-gray-600 mb-6">
            <Link href="/" className="hover:text-[#1096b7]">
              Home
            </Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="text-[#1096b7] font-medium">Terms & Policies</span>
          </div>

          {/* Page Title */}
          <h1 className="text-4xl font-bold text-[#1096b7] mb-8 text-center">
            Terms & Policies
          </h1>

          {/* Content Sections */}
          <div className="space-y-8">
            {/* Section 1: Terms & Conditions */}
            <section id="terms" className="bg-white rounded-lg shadow-md p-6 scroll-mt-32">
              <h2 className="text-2xl font-bold text-[#05313c] mb-4 border-b-2 border-[#1096b7] pb-2">
                1. TERMS & CONDITIONS
              </h2>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-[#1096b7] mb-2">
                    1.1 Introduction & Acceptance
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    Welcome to the official website of the Value Added Tax (VAT)
                    Department, Union Territory of Dadra & Nagar Haveli and
                    Daman & Diu (&quot;Department&quot;).
                  </p>
                  <p className="text-gray-700 leading-relaxed mt-2">
                    By accessing, using, or browsing this website or its
                    e-services, you acknowledge that you have read, understood,
                    and agree to comply with these Terms & Conditions (&quot;Terms&quot;).
                    If you do not agree with these Terms, you must discontinue
                    the use of this website.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-[#1096b7] mb-2">
                    1.2 Purpose of the Website
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-2">
                    This website provides:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li>
                      Official VAT-related notifications, circulars, rules, and
                      guidance
                    </li>
                    <li>
                      E-services including registration, e-return filing,
                      e-payment
                    </li>
                    <li>
                      Secure portal access for registered dealers and authorized
                      government officials
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-[#1096b7] mb-2">
                    1.3 Eligibility & User Authentication
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-2">
                    Restricted access areas require login credentials issued by
                    the Department.
                  </p>
                  <p className="text-gray-700 leading-relaxed mb-2">
                    Users must:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li>Keep passwords confidential</li>
                    <li>Ensure authorized use only</li>
                    <li>Report suspicious activity immediately</li>
                  </ul>
                  <p className="text-gray-700 leading-relaxed mt-2">
                    Misuse may result in suspension or legal action.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-[#1096b7] mb-2">
                    1.4 User Data & Privacy
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-2">
                    Only essential pre-stored dealer information is used for
                    verification:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li>Dealer name</li>
                    <li>Email address</li>
                    <li>Taxpayer identification (TIN/GSTIN/Dealer ID)</li>
                    <li>Department-issued registration details</li>
                  </ul>
                  <p className="text-gray-700 leading-relaxed mt-3 mb-2">
                    The Department:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li>Does not collect personal data through open forms</li>
                    <li>Does not use cookies or analytics</li>
                    <li>
                      Does not share data with third parties unless legally
                      mandated
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-[#1096b7] mb-2">
                    1.5 Permitted & Prohibited Activities
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-800 mb-2">
                        Permitted
                      </h4>
                      <p className="text-gray-700 mb-2">Users may:</p>
                      <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
                        <li>Access information for lawful purposes</li>
                        <li>Use e-services for VAT compliance</li>
                        <li>Download official documents for reference</li>
                      </ul>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-red-800 mb-2">
                        Prohibited
                      </h4>
                      <p className="text-gray-700 mb-2">Users may not:</p>
                      <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
                        <li>Attempt unauthorized access</li>
                        <li>Upload malware or malicious content</li>
                        <li>Use automated scraping tools</li>
                        <li>Perform hacking or security breaches</li>
                        <li>Modify or manipulate website content</li>
                      </ul>
                    </div>
                  </div>
                  <p className="text-gray-700 leading-relaxed mt-2 text-sm italic">
                    Violation may result in prosecution under applicable laws.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-[#1096b7] mb-2">
                    1.6 Accuracy & Legal Disclaimer
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    The website content is provided for general information
                    purposes only. The Department does not guarantee accuracy,
                    completeness, or currency.
                  </p>
                  <p className="text-gray-700 leading-relaxed mt-2">
                    In case of conflict between website content and official
                    notifications/Acts/Rules, the official documents shall
                    prevail.
                  </p>
                  <p className="text-gray-700 leading-relaxed mt-2">
                    The Department reserves the right to modify or update
                    content without notice.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-[#1096b7] mb-2">
                    1.7 Limitation of Liability
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-2">
                    The Department is not liable for:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li>Errors, omissions, or inaccuracies</li>
                    <li>Service interruptions or downtime</li>
                    <li>Loss or damage arising from website use</li>
                    <li>Unauthorized access or misuse of credentials</li>
                    <li>Technical failures or cyber incidents</li>
                  </ul>
                  <p className="text-gray-700 leading-relaxed mt-2 font-medium">
                    Use of this website is entirely at the user&apos;s own risk.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-[#1096b7] mb-2">
                    1.8 External Links
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    The website currently contains no external links.
                  </p>
                  <p className="text-gray-700 leading-relaxed mt-2">
                    If any external link is added in the future:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li>It will be only for convenience</li>
                    <li>
                      The Department will not be responsible for its content or
                      security
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-[#1096b7] mb-2">
                    1.9 Security
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-2">
                    The Department employs reasonable security practices. Users
                    must:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li>Protect login credentials</li>
                    <li>Avoid sharing passwords</li>
                    <li>Prevent unauthorized system access</li>
                  </ul>
                  <p className="text-gray-700 leading-relaxed mt-2">
                    The Department does not guarantee complete protection from
                    cyber threats.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-[#1096b7] mb-2">
                    1.10 Modification of Terms
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    These Terms may be modified or updated at any time. Updates
                    will be posted on this website.
                  </p>
                  <p className="text-gray-700 leading-relaxed mt-2">
                    Continued use indicates acceptance of updated Terms.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-[#1096b7] mb-2">
                    1.11 Governing Law & Jurisdiction
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-2">
                    These Terms are governed by:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li>
                      Laws applicable to the Union Territory of Dadra & Nagar
                      Haveli and Daman & Diu, and
                    </li>
                    <li>Applicable laws of India</li>
                  </ul>
                  <p className="text-gray-700 leading-relaxed mt-2">
                    Any disputes shall fall under the exclusive jurisdiction of
                    the courts located within the UT of DNH & DD.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 2: Privacy Policy */}
            <section id="privacy" className="bg-white rounded-lg shadow-md p-6 scroll-mt-32">
              <h2 className="text-2xl font-bold text-[#05313c] mb-4 border-b-2 border-[#1096b7] pb-2">
                2. PRIVACY POLICY
              </h2>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-[#1096b7] mb-2">
                    2.1 Scope
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    This policy applies to all registered dealers and authorized
                    officials using the VAT website and e-services.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-[#1096b7] mb-2">
                    2.2 What Information We Collect
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-2">
                    We collect only pre-stored, essential dealer data:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li>Dealer/Business Name</li>
                    <li>Email Address</li>
                    <li>
                      Taxpayer Identification Number (TIN/GSTIN/Dealer ID)
                    </li>
                    <li>Registration and license details</li>
                  </ul>
                  <p className="text-gray-700 leading-relaxed mt-2 italic">
                    No new personal data is collected through public interfaces.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-[#1096b7] mb-2">
                    2.3 What We Do NOT Collect
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-2">
                    The Department does not collect:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li>Cookies</li>
                    <li>Browsing data</li>
                    <li>Analytics/tracking information</li>
                    <li>Personal data through forms</li>
                    <li>Phone numbers unless pre-stored</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-[#1096b7] mb-2">
                    2.4 Use of Information
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-2">
                    Information is used solely for:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li>Verification</li>
                    <li>E-payment, e-return, and compliance functions</li>
                    <li>Delivering departmental services</li>
                    <li>Communication related to VAT activities</li>
                  </ul>
                  <p className="text-gray-700 leading-relaxed mt-2 italic">
                    No information is used for marketing or profiling.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-[#1096b7] mb-2">
                    2.5 Information Sharing
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-2">
                    Data is not shared with external entities except:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li>When legally required</li>
                    <li>When needed for authorized government verification</li>
                  </ul>
                  <p className="text-gray-700 leading-relaxed mt-2">
                    No information is shared with private organizations.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-[#1096b7] mb-2">
                    2.6 Security of Information
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    The Department implements secure protocols. Users must
                    protect their login details.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-[#1096b7] mb-2">
                    2.7 Data Retention
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    The website does not archive old content or public
                    submissions. Dealer data is maintained only within
                    departmental systems.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-[#1096b7] mb-2">
                    2.8 Policy Updates
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    The Department may revise this policy. Updates will be
                    published on this website.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3: Disclaimer */}
            <section id="disclaimer" className="bg-white rounded-lg shadow-md p-6 scroll-mt-32">
              <h2 className="text-2xl font-bold text-[#05313c] mb-4 border-b-2 border-[#1096b7] pb-2">
                3. DISCLAIMER
              </h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                The information on this website is for general guidance only.
              </p>
              <p className="text-gray-700 leading-relaxed mb-2">
                The Department:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                <li>
                  Makes no warranty on accuracy, completeness, or reliability
                </li>
                <li>Is not responsible for errors or omissions</li>
                <li>
                  Is not liable for technical failures, downtime, or cyber
                  incidents
                </li>
                <li>
                  Is not responsible for losses caused by the use of this
                  website
                </li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3 font-medium">
                If any discrepancy exists between website content and official
                publications, the official documents shall apply.
              </p>
            </section>

            {/* Section 4: Website Usage Policy */}
            <section id="usage" className="bg-white rounded-lg shadow-md p-6 scroll-mt-32">
              <h2 className="text-2xl font-bold text-[#05313c] mb-4 border-b-2 border-[#1096b7] pb-2">
                4. WEBSITE USAGE POLICY
              </h2>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-[#1096b7] mb-2">
                    4.1 Acceptable Use
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-2">
                    Users may:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li>Use e-services responsibly</li>
                    <li>
                      Access information for official and business purposes
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-[#1096b7] mb-2">
                    4.2 Prohibited Conduct
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-2">
                    Users shall not:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li>Attempt unauthorized access</li>
                    <li>Upload harmful files</li>
                    <li>Alter website content</li>
                    <li>Perform automated data extraction</li>
                    <li>Impersonate others</li>
                    <li>Engage in hacking or denial-of-service</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-[#1096b7] mb-2">
                    4.3 Login Responsibility
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-2">
                    Users must:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li>Keep passwords secure</li>
                    <li>Avoid sharing login credentials</li>
                    <li>Report misuse immediately</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-[#1096b7] mb-2">
                    4.4 Service Availability
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    The Department does not guarantee uninterrupted service.
                    Maintenance or technical issues may cause downtime.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-[#1096b7] mb-2">
                    4.5 Policy Changes
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    The Department may modify this policy without notice.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 5: Copyright Policy */}
            <section id="copyright" className="bg-white rounded-lg shadow-md p-6 scroll-mt-32">
              <h2 className="text-2xl font-bold text-[#05313c] mb-4 border-b-2 border-[#1096b7] pb-2">
                5. COPYRIGHT POLICY
              </h2>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-[#1096b7] mb-2">
                    5.1 Ownership
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    All website content—including text, images, documents,
                    design, and layout—is the exclusive property of the:
                  </p>
                  <p className="text-gray-700 leading-relaxed mt-2 font-semibold">
                    VAT Department, Union Territory of Dadra & Nagar Haveli and
                    Daman & Diu.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-[#1096b7] mb-2">
                    5.2 Restrictions
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-2">
                    Users may not:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li>Copy or reproduce content</li>
                    <li>Modify or republish materials</li>
                    <li>Use content for commercial purposes</li>
                    <li>Use departmental data without permission</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-[#1096b7] mb-2">
                    5.3 Third-Party Content
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    If any third-party content appears, it remains the property
                    of respective owners. Users must obtain permission from
                    those owners.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-[#1096b7] mb-2">
                    5.4 Permission for Reproduction
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-2">
                    Requests must include:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li>Purpose</li>
                    <li>Specific material required</li>
                    <li>Duration and manner of use</li>
                  </ul>
                  <p className="text-gray-700 leading-relaxed mt-2">
                    Approval is at the Department&apos;s discretion.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-[#1096b7] mb-2">
                    5.5 Enforcement
                  </h3>
                  <p className="text-gray-700 leading-relaxed mb-2">
                    Unauthorized use may lead to:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                    <li>Legal action</li>
                    <li>Penalties under applicable laws</li>
                    <li>Suspension of website access</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 6: Contact Information */}
            <section id="contact" className="bg-white rounded-lg shadow-md p-6 scroll-mt-32">
              <h2 className="text-2xl font-bold text-[#05313c] mb-4 border-b-2 border-[#1096b7] pb-2">
                6. CONTACT INFORMATION
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-xl font-semibold text-[#1096b7] mb-3">
                    6.1 Daman & Diu VAT Office
                  </h3>
                  <div className="space-y-2 text-gray-700">
                    <p className="font-medium">
                      Department of Value Added Tax (VAT)
                    </p>
                    <p>Office of the Assistant Commissioner (VAT)</p>
                    <p>Collectorate Campus, Fort Area</p>
                    <p>Moti Daman – 396220</p>
                    <p className="pt-2">
                      <span className="font-semibold">Phone:</span> 0260-2250002
                      / 0260-2250007
                    </p>
                    <p>
                      <span className="font-semibold">Email:</span>{" "}
                      <a
                        href="mailto:vat-dd@gov.in"
                        className="text-[#1096b7] hover:underline"
                      >
                        vat-dd@gov.in
                      </a>
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-xl font-semibold text-[#1096b7] mb-3">
                    6.2 Dadra & Nagar Haveli VAT Office
                  </h3>
                  <div className="space-y-2 text-gray-700">
                    <p className="font-medium">
                      Tax Department, DNH Administration
                    </p>
                    <p>Secretariat Campus</p>
                    <p>Silvassa – 396230</p>
                    <p className="pt-2">
                      <span className="font-semibold">Phone:</span> 0260-2633008
                    </p>
                    <p>
                      <span className="font-semibold">Email:</span>{" "}
                      <a
                        href="mailto:dirctd-dd@nic.in"
                        className="text-[#1096b7] hover:underline"
                      >
                        dirctd-dd@nic.in
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 7: Acceptance */}
            <section id="acceptance" className="bg-gradient-to-r from-[#1096b7] to-[#05313c] rounded-lg shadow-md p-6 text-white scroll-mt-32">
              <h2 className="text-2xl font-bold mb-4 border-b-2 border-white pb-2">
                7. ACCEPTANCE
              </h2>
              <p className="leading-relaxed mb-3">
                By using this website, you confirm that you have read,
                understood, and agree to this:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Terms & Conditions</li>
                <li>Privacy Policy</li>
                <li>Disclaimer</li>
                <li>Website Usage Policy</li>
                <li>Copyright Policy</li>
              </ul>
              <p className="leading-relaxed mt-4 font-semibold">
                All policies are effective immediately and remain in force
                unless revised or replaced.
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mx-auto md:w-3/5 py-4 px-6 md:px-0 text-center md:flex gap-2 items-center bg-[#05313c] justify-evenly">
        <h1 className="text-gray-300 text-sm">&copy; VAT-DD-DNH</h1>
        <h1 className="text-gray-300 text-sm">
          Site Last Updated on 24-01-2025
        </h1>
        <h1 className="text-gray-300 text-sm">
          Designed & Developed by Smart Technologies
        </h1>
      </footer>
    </>
  );
}
