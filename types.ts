import { FeedbackResult } from './services/gemini';
import { CertificateTheme } from './components/Certificate';

export interface CertificateRecord {
  id: string;
  studentName: string;
  activityName: string;
  gradeLevel: string;
  result: FeedbackResult;
  date: string;
  theme: CertificateTheme;
  timestamp: number;
  timeIn?: string;
  timeOut?: string;
}

export interface VisitRecord {
  id?: string;
  libraryId: string;
  studentName: string;
  startTime: string;
  endTime: string;
  date: string;
  timestamp: any;
}
