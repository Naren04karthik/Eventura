/**
 * Common service response types
 */

export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface EventFilterInput {
  search?: string;
  collegeId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  filter?: string;
}
