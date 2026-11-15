import { useState } from "react";

interface PaymentState {
  isPayVatLoading: boolean;
  isWalletPaymentLoading: boolean;
  walletBalance: number;
  isWalletConfirmModalOpen: boolean;
  isPaid: boolean;
}

interface PaymentActions {
  setIsPayVatLoading: (value: boolean) => void;
  setIsWalletPaymentLoading: (value: boolean) => void;
  setWalletBalance: (value: number) => void;
  setIsWalletConfirmModalOpen: (value: boolean) => void;
  setIsPaid: (value: boolean) => void;
}

export const usePaymentState = (): PaymentState & PaymentActions => {
  const [isPayVatLoading, setIsPayVatLoading] = useState(false);
  const [isWalletPaymentLoading, setIsWalletPaymentLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isWalletConfirmModalOpen, setIsWalletConfirmModalOpen] =
    useState(false);
  const [isPaid, setIsPaid] = useState(false);

  return {
    isPayVatLoading,
    isWalletPaymentLoading,
    walletBalance,
    isWalletConfirmModalOpen,
    isPaid,
    setIsPayVatLoading,
    setIsWalletPaymentLoading,
    setWalletBalance,
    setIsWalletConfirmModalOpen,
    setIsPaid,
  };
};
