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
  compositionScheme: boolean | null;
  status: DvatStatus;
  createdAt: Date;
};
