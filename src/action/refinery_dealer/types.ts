import {
  dvat04,
  Dvat04Commodity,
  refinery_dealer,
  tin_number_master,
} from "@prisma/client";

export type RefineryDealerWithDealer = refinery_dealer & {
  dvat: dvat04 & {
    tin_master: tin_number_master;
  };
};

export type DealerOption = {
  id: number;
  tinNumber: string;
  tradeName: string;
  dealerName: string;
  commodity: Dvat04Commodity | null;
};
