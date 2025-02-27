// Define all interfaces in a separate file
export interface FacultyItem {
  id: string;
  name: string;
  status: 'ONLINE' | 'OFFLINE';
  numOnQueue: number;
  userType?: string;
}

export interface StudentItem {
  id: string;
  name: string;
  faculty: string;
  concerns: string;
  otherConcern: string;
  ticketNumber: number;
  program: string;
  requestDate: string;
}

export interface CommentItem {
  id: string;
  comment: string;
  timestamp: any;
  duration?: number;
  durationFormatted?: string;
  faculty: string;
  ticketNumber?: string;
  studentName?: string;
  concern?: string;
  otherConcern?: string;
  specificDetails?: string;
}
