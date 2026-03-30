export type PredefinedStatus = 'scheduled' | 'arrived' | 'not_arrived';

export interface PredefinedEntry {
  rowKey: string;
  company: string;
  route: string;
  scheduleTime: string;
  plateNumber: string;
  busType?: string;
  stopType?: string;
  customStopCount?: number | null;
  seatingCapacity?: number | null;
  timeWindowLabel: string;
  hourBucket?: number;
  isPrepHourNext?: boolean;
  status: PredefinedStatus;
  notArrivalRemark?: string;
  blockedByOtherSlot?: boolean;
}

export interface DispatchTrip {
  _id: string;
  templateNo: string;
  route: string;
  company: string;
  busType?: string;
  stopType?: string;
  customStopCount?: number | null;
  stopsLabel?: string;
  ticketReferenceNo?: string;
  price?: number;
  seatingCapacity?: number | null;
  parkingEstimation?: string;
  expectedDeparture?: string;
  time: string;
  departureTime?: string;
  status: string;
  displayStatus?: string;
  date?: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
