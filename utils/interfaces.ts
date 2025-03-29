// Define all interfaces in a separate file

// Add this interface for the schedule data structure
export interface ScheduleData {
  monday: { 
    am: { start: string; end: string }; 
    pm: { start: string; end: string }; 
  };
  tuesday: { 
    am: { start: string; end: string }; 
    pm: { start: string; end: string }; 
  };
  wednesday: { 
    am: { start: string; end: string }; 
    pm: { start: string; end: string }; 
  };
  thursday: { 
    am: { start: string; end: string }; 
    pm: { start: string; end: string }; 
  };
  friday: { 
    am: { start: string; end: string }; 
    pm: { start: string; end: string }; 
  };
  saturday: { 
    am: { start: string; end: string }; 
    pm: { start: string; end: string }; 
  };
  sunday: { 
    am: { start: string; end: string }; 
    pm: { start: string; end: string }; 
  };
}

export interface FacultyItem {
  id: string;
  name: string;
  status: 'AVAILABLE' | 'UNAVAILABLE';
  numOnQueue: number;
  userType?: string;
  schedule?: ScheduleData;
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
