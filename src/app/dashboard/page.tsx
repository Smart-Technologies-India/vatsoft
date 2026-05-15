"use client";

import { useEffect, useRef, useState } from "react";
import { Drawer } from "antd";
import Lottie from "lottie-react";
import { dvat04, user } from "@prisma/client";
import OfficerDashboardPage from "@/components/dashboard/officerdashboard";
import RefineryDashboard from "@/components/dashboard/refinerydashboard";
import UserDashboard from "@/components/dashboard/userdashboard";
import GetUserDvat04Anx from "@/action/dvat/getuserdvatanx";
import GetUser from "@/action/user/getuser";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { getAuthenticatedUserId } from "@/action/auth/getuserid";

const Page = () => {
  const router = useRouter();

  const [user, setUser] = useState<user | null>(null);
  const [dvat, setDvat] = useState<dvat04 | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [chatAnimationData, setChatAnimationData] = useState<any>(null);
  const [isHelpDrawerOpen, setIsHelpDrawerOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<
    Array<{ id: number; role: "bot" | "user"; text: string }>
  >([
    {
      id: 1,
      role: "bot",
      text: "Welcome to Dashboard Help. Ask a question related to your current registration status.",
    },
  ]);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const messageIdRef = useRef(1);
  const typingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const thinkingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatListRef = useRef<HTMLDivElement | null>(null);

  const normalizedStatus = (dvat?.status ?? "").toUpperCase();
  const canShowStatusChatbot =
    user?.role === "USER" &&
    ["PENDINGPROCESSING", "PENDINGPROCESS", "VERIFICATION"].includes(
      normalizedStatus,
    );

  const dashboardChatOptions =
    normalizedStatus === "VERIFICATION"
      ? [
          {
            question: "Why am I seeing Action Required on this page?",
            answer:
              "Your registration is in verification stage and needs completion. Use the Complete Registration button on this page to continue pending details.",
          },
          {
            question: "Where should I continue my registration from dashboard?",
            answer:
              "Click Complete Registration Now in the status card. You will be redirected to your registration form flow for the pending section.",
          },
          {
            question: "Can I access all portal features right now?",
            answer:
              "Not yet. Full access is enabled after your registration details are completed and approved.",
          },
          {
            question: "How do I proceed if registration data is not loading?",
            answer:
              "Refresh once and try Complete Registration again. If the issue persists, contact the helpline with your TIN and mention dashboard verification flow.",
          },
        ]
      : [
          {
            question: "What does Add Stock mean on this page?",
            answer:
              "Your registration has been submitted. You may add stock now.",
          },
          {
            question: "Why is Opening Stock step shown here?",
            answer:
              "Opening stock is required before final approval. If Add Stock is visible, complete that step from this dashboard to move ahead.",
          },
          {
            question: "When will my dashboard be fully unlocked?",
            answer:
              "After verification and required setup steps are completed, your profile status updates and full dashboard features become available.",
          },
          {
            question: "Who should I contact for pending processing delay?",
            answer:
              "Please contact VAT support or helpline and share your TIN. They can verify current processing stage and next action.",
          },
        ];

  useEffect(() => {
    const init = async () => {
      try {
        const authResponse = await getAuthenticatedUserId();
        if (!authResponse.status || !authResponse.data) {
          toast.error(authResponse.message);
          router.push("/");
          return;
        }

        const userresponse = await GetUser({ id: authResponse.data });
        if (userresponse.status) setUser(userresponse.data!);

        const dvatdata = await GetUserDvat04Anx({});
        if (dvatdata.status && dvatdata.data) {
          setDvat(dvatdata.data);
        }
      } finally {
        setIsInitializing(false);
      }
    };

    init();
  }, [router]);

  useEffect(() => {
    let mounted = true;

    const loadChatAnimation = async () => {
      try {
        const response = await fetch("/cs.json");
        if (!response.ok) return;

        const data = await response.json();
        if (mounted) {
          setChatAnimationData(data);
        }
      } catch {
        // Keep fallback text if animation cannot be loaded.
      }
    };

    loadChatAnimation();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) {
        clearInterval(typingTimerRef.current);
      }
      if (thinkingTimerRef.current) {
        clearTimeout(thinkingTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!chatListRef.current) return;
    if (!shouldAutoScroll) return;
    chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
  }, [chatMessages, isBotTyping, shouldAutoScroll]);

  useEffect(() => {
    if (!canShowStatusChatbot) return;

    const welcomeText =
      normalizedStatus === "VERIFICATION"
        ? "Your registration needs action. Ask me about the verification steps on this dashboard."
        : "Your registration is under processing. Ask me about the pending steps shown on this dashboard.";

    setChatMessages([{ id: 1, role: "bot", text: welcomeText }]);
    messageIdRef.current = 1;
    setIsBotTyping(false);
    setShouldAutoScroll(true);
  }, [canShowStatusChatbot, normalizedStatus]);

  const handleChatScroll = () => {
    if (!chatListRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = chatListRef.current;
    const isNearBottom = scrollHeight - (scrollTop + clientHeight) < 48;

    setShouldAutoScroll(isNearBottom);
  };

  const appendTypedBotMessage = (answer: string) => {
    if (typingTimerRef.current) {
      clearInterval(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    if (thinkingTimerRef.current) {
      clearTimeout(thinkingTimerRef.current);
      thinkingTimerRef.current = null;
    }

    setIsBotTyping(true);
    const botMessageId = messageIdRef.current + 1;
    messageIdRef.current = botMessageId;

    setChatMessages((prev) => [
      ...prev,
      {
        id: botMessageId,
        role: "bot",
        text: "",
      },
    ]);

    const thinkingDelay = 900 + Math.floor(Math.random() * 600);
    thinkingTimerRef.current = setTimeout(() => {
      let index = 0;
      typingTimerRef.current = setInterval(() => {
        index += 1;
        const nextText = answer.slice(0, index);

        setChatMessages((prev) =>
          prev.map((message) =>
            message.id === botMessageId
              ? {
                  ...message,
                  text: nextText,
                }
              : message,
          ),
        );

        if (index >= answer.length) {
          if (typingTimerRef.current) {
            clearInterval(typingTimerRef.current);
            typingTimerRef.current = null;
          }
          setIsBotTyping(false);
        }
      }, 16);
    }, thinkingDelay);
  };

  const onSelectChatOption = (question: string, answer: string) => {
    if (isBotTyping) return;

    const userMessageId = messageIdRef.current + 1;
    messageIdRef.current = userMessageId;

    setChatMessages((prev) => [
      ...prev,
      { id: userMessageId, role: "user", text: question },
    ]);

    setShouldAutoScroll(true);
    appendTypedBotMessage(answer);
  };

  if (isInitializing) {
    return null;
  }

  return (
    <>
      {user?.role == "USER" ? (
        <>
          <UserDashboard />
          {canShowStatusChatbot && (
            <>
              <button
                type="button"
                aria-label="Open help chat"
                onClick={() => setIsHelpDrawerOpen(true)}
                className="fixed right-5 bottom-5 z-60 flex flex-col items-center hover:scale-105 transition-transform"
              >
                <span className="h-32 w-32 overflow-hidden">
                  {chatAnimationData ? (
                    <Lottie
                      animationData={chatAnimationData}
                      loop
                      autoplay
                      className="h-full w-full"
                    />
                  ) : (
                    <span className="h-full w-full grid place-items-center text-[#0f2f67] text-xs font-semibold">
                      Help
                    </span>
                  )}
                </span>
                <span className="-translate-y-4 text-lg font-semibold text-[#0f2f67] bg-white/90 px-2 rounded-full border-blue-800 border-2">
                  Need Help
                </span>
              </button>

              <Drawer
                title={
                  <span className="text-slate-800 font-semibold">
                    Dashboard Help
                  </span>
                }
                placement="right"
                size={380}
                open={isHelpDrawerOpen}
                onClose={() => setIsHelpDrawerOpen(false)}
              >
                <div className="h-full flex flex-col gap-3">
                  <div
                    ref={chatListRef}
                    onScroll={handleChatScroll}
                    className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 h-[62vh] overflow-y-auto flex flex-col gap-2"
                  >
                    <div className="grow" />
                    {chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex items-end gap-2 ${
                          message.role === "user"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        {message.role === "bot" && (
                          <span className="h-8 w-8 rounded-full bg-slate-700 text-white text-xs font-semibold flex items-center justify-center shrink-0">
                            H
                          </span>
                        )}

                        <div
                          className={`w-fit max-w-[82%] px-2.5 py-1.5 text-sm ${
                            message.role === "bot"
                              ? "bg-white border border-slate-200 text-slate-700 rounded-br-lg rounded-tl-lg rounded-tr-lg"
                              : "bg-slate-700 text-white rounded-bl-lg rounded-tl-lg rounded-tr-lg"
                          }`}
                        >
                          <p
                            className={`text-[11px] font-semibold mb-1 ${
                              message.role === "bot"
                                ? "text-slate-700"
                                : "text-slate-200"
                            }`}
                          >
                            {message.role === "bot" ? "Maya" : "You"}
                          </p>

                          {message.text || (
                            <span className="inline-flex items-center gap-1.5 text-slate-500">
                              <span className="text-xs text-slate-500 mr-1">
                                Thinking
                              </span>
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulse"></span>
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulse [animation-delay:120ms]"></span>
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulse [animation-delay:240ms]"></span>
                            </span>
                          )}
                        </div>

                        {message.role === "user" && (
                          <span className="h-8 w-8 rounded-full bg-amber-600 text-white text-xs font-semibold flex items-center justify-center shrink-0">
                            U
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {!isBotTyping && (
                    <div className="bg-white border border-slate-200 rounded-lg p-2 flex flex-wrap gap-2">
                      {dashboardChatOptions.map((option) => (
                        <button
                          key={option.question}
                          type="button"
                          onClick={() =>
                            onSelectChatOption(option.question, option.answer)
                          }
                          className="text-left text-sm px-3 py-1.5 border border-slate-200 text-slate-700 rounded-full hover:bg-slate-50 transition-colors"
                        >
                          {option.question}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </Drawer>
            </>
          )}
        </>
      ) : user?.role == "REFINERY_MANAGER" ? (
        <RefineryDashboard />
      ) : (
        <>
          <OfficerDashboardPage />
        </>
      )}
    </>
  );
};
export default Page;
