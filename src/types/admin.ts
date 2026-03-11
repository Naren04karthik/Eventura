export interface AdminRequest {
  id: string;
  collegeName: string;
  firstName: string;
  email: string;
  status: string;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  college?: {
    name: string;
  };
}

export interface AdminDashboardUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface OrganizerRequestUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
}

export interface OrganizerRequest {
  id: string;
  organizationName: string;
  website?: string | null;
  contactNumber: string;
  reason: string;
  createdAt: string;
  user: OrganizerRequestUser;
}