export type CustomFieldType =
  | 'text'
  | 'email'
  | 'phone'
  | 'number'
  | 'dropdown'
  | 'checkbox'
  | 'date'
  | 'textarea';

export interface CustomField {
  id: string;
  label: string;
  type: CustomFieldType;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export type RegistrationField = CustomField;
export type FormValue = string | boolean;

export interface EventOrganizer {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  profile?: {
    profilePhoto?: string;
  };
}

export interface EventRegistrationCount {
  registrations: number;
}

export interface EventListItem {
  id: string;
  eventCode?: string;
  title: string;
  description?: string;
  tags?: string;
  date: string;
  venue: string;
  capacity?: number;
  bannerUrl?: string | null;
  isLive?: boolean;
  isPaid?: boolean;
  ticketPrice?: number;
  customRegistrationFields?: string;
  collegeId?: string | null;
  status?: string;
  registrationType?: string;
  teamRequired?: boolean;
  minTeamSize?: number;
  maxTeamSize?: number;
  organiserId?: string;
  organiser?: EventOrganizer;
  _count?: EventRegistrationCount;
}

export interface BrowseEvent extends EventListItem {
  description: string;
  date: string;
  venue: string;
  capacity: number;
  organiser: EventOrganizer;
  _count: EventRegistrationCount;
}

export interface EventDetails extends EventListItem {
  description: string;
  date: string;
  venue: string;
  capacity: number;
  organiser: EventOrganizer;
  _count: EventRegistrationCount;
}

export interface OrganizedEvent extends EventListItem {
  date: string;
  venue: string;
}

export interface AdminEventSummary {
  id: string;
  eventCode?: string;
  title: string;
  status?: string;
  _count: EventRegistrationCount;
}

export interface RegisteredItem {
  id: string;
  status: string;
  event: {
    id: string;
    eventCode?: string;
    title: string;
    date: string;
    venue: string;
    bannerUrl?: string;
    capacity?: number;
  };
}

export interface BookmarkItem {
  id: string;
  event: {
    id: string;
    eventCode?: string;
    title: string;
    description?: string;
    date: string;
    venue: string;
    bannerUrl?: string;
    capacity?: number;
    _count?: {
      registrations?: number;
    };
  };
}

export interface EventCardItem {
  id: string;
  eventCode?: string;
  title: string;
  description?: string;
  date: string;
  venue: string;
  bannerUrl?: string;
  registrationsCount: number;
}