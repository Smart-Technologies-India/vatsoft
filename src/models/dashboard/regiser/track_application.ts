import { CompositionStatus, DvatStatus } from "@prisma/client";

export type TrackApplilcationStatusType = {
  id: number;
  compositionScheme: boolean;
  createdAt: Date;
  status: CompositionStatus;
  dept_user: {
    firstName: string | null;
    lastName: string | null;
  };
  dvat?: {
    tinNumber: string | null;
    tradename: string | null;
  };
  arn: string;
};

export type DvatTrackApplicationStatusType = {
  registration: {
    dept_user: {
      firstName: string | null;
      lastName: string | null;
    };
  }[];
  id: number;
  tempregistrationnumber: string | null;
  contact_one: string | null;
  compositionScheme: boolean | null;
  status: DvatStatus;
  createdAt: Date;
  tinNumber?: string | null;
  tradename?: string | null;
  dvat04?: {
    tinNumber: string;
    tradename: string | null;
  };
};
