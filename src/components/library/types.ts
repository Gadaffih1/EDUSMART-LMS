export type LibraryPortalSection = 
  | 'dashboard'
  | 'catalogue'
  | 'books_resources'
  | 'issue_return'
  | 'reservations'
  | 'borrowers'
  | 'overdue'
  | 'fines_charges'
  | 'acquisitions'
  | 'inventory'
  | 'shelves_locations'
  | 'digital_library'
  | 'reading_programme'
  | 'attendance'
  | 'timetable'
  | 'room_booking'
  | 'events_programmes'
  | 'reports_analytics'
  | 'notifications'
  | 'policies'
  | 'settings'
  | 'audit_trail';

export interface SectionCategory {
  title: string;
  items: {
    id: LibraryPortalSection;
    label: string;
    icon: string;
    badge?: number | string;
  }[];
}
