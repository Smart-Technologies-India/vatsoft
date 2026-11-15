import { useState } from "react";
import { GroupedDailySale } from "@/action/stock/getuserdailysale";

interface PostPaymentAddItemState {
  isDrawerOpen: boolean;
  selectedGroup: GroupedDailySale | null;
  isSubmitting: boolean;
  walletBalance: number;
}

interface PostPaymentAddItemActions {
  setIsDrawerOpen: (value: boolean) => void;
  setSelectedGroup: (value: GroupedDailySale | null) => void;
  setIsSubmitting: (value: boolean) => void;
  setWalletBalance: (value: number) => void;
  openDrawerForGroup: (group: GroupedDailySale, balance: number) => void;
  closeDrawer: () => void;
}

export const usePostPaymentAddItem = (): PostPaymentAddItemState &
  PostPaymentAddItemActions => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] =
    useState<GroupedDailySale | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);

  const openDrawerForGroup = (group: GroupedDailySale, balance: number) => {
    setSelectedGroup(group);
    setWalletBalance(balance);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedGroup(null);
    setIsSubmitting(false);
  };

  return {
    isDrawerOpen,
    selectedGroup,
    isSubmitting,
    walletBalance,
    setIsDrawerOpen,
    setSelectedGroup,
    setIsSubmitting,
    setWalletBalance,
    openDrawerForGroup,
    closeDrawer,
  };
};
