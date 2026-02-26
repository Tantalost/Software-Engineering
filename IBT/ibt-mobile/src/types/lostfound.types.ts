export interface LostItem {
  _id: string;
  trackingNo: string;
  description: string;
  location: string;
  dateTime: string;
  status: 'Claimed' | 'Unclaimed' | 'Archived';
  isArchived: boolean;
}