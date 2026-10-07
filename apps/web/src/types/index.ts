export interface Address {
  id: number;
  street: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Location {
  id: number;
  companyId: number;
  parentId: number | null;
  name: string;
  path: string;
  level: number;
  isActive: boolean;
  address: Address | null;
}

export interface Customer {
  id: number;
  companyId: number;
  locationId: number | null;
  locationName: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  isActive: boolean;
}

export interface CustomerDetail extends Customer {
  address: Address | null;
}

export interface ServiceGroup {
  id: number;
  locationId: number;
  locationName: string;
  name: string;
  isActive: boolean;
  memberCount: number;
}

export interface Contractor {
  id: number;
  name: string;
  taxId: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  address: Address | null;
  averageRating: number | null;
  ratingCount: number;
}

export interface Employee {
  id: number;
  companyId: number | null;
  contractorId: number | null;
  fullName: string;
  loginIdentifier: string;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  averageRating: number | null;
  ratingCount: number;
}

export const DATA_TYPE_LABELS: Record<number, string> = {
  1: 'Liczba', 2: 'Tekst', 3: 'Tak/Nie', 4: 'Data', 5: 'Lista wyboru',
};

export interface MeasurementAttribute {
  id: number;
  name: string;
  dataType: number;
  unit: string | null;
  minValue: number | null;
  maxValue: number | null;
  options: string | null;
  isActive: boolean;
}

export interface ServiceActivity {
  id: number;
  name: string;
  sortOrder: number;
  measurementAttributeId: number | null;
  measurementAttributeName: string | null;
  unit: string | null;
  minValue: number | null;
  maxValue: number | null;
}

export interface ServiceCatalogItem {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  activities: ServiceActivity[];
}

export interface PrintTemplate {
  id: number;
  name: string;
  templateHtml: string;
  isDefault: boolean;
  isActive: boolean;
}

export const REQUEST_STATUS_LABELS: Record<number, string> = {
  1: 'Nowe', 2: 'Przypisane', 3: 'W trakcie', 4: 'Wykonane', 5: 'Anulowane',
};

export const REQUEST_STATUS_COLORS: Record<number, string> = {
  1: '#78716c', 2: '#b7791f', 3: '#2563eb', 4: '#15803d', 5: '#b91c1c',
};

export interface RequestStatusBreakdown {
  status: number;
  statusName: string;
  count: number;
}

export interface RequestMonthlyStat {
  year: number;
  month: number;
  created: number;
  completed: number;
  onTime: number;
  early: number;
  late: number;
}

export interface ContractorAnalytics {
  contractorId: number;
  name: string;
  requestCount: number;
  averageRating: number | null;
  ratingCount: number;
}

export interface EmployeeAnalytics {
  employeeId: number;
  name: string;
  requestCount: number;
  averageRating: number | null;
  ratingCount: number;
}

export interface RequestAnalytics {
  totalRequests: number;
  statusBreakdown: RequestStatusBreakdown[];
  monthly: RequestMonthlyStat[];
  onTimeCount: number;
  earlyCount: number;
  lateCount: number;
  contractorRanking: ContractorAnalytics[];
  employeeRanking: EmployeeAnalytics[];
}

export interface RequestListItem {
  id: number;
  number: string;
  customerName: string;
  scheduledDate: string | null;
  completionDate: string | null;
  status: number;
  statusName: string;
  serviceGroupName: string | null;
  contractorName: string | null;
  employeeName: string | null;
  createdAt: string;
}

export interface RequestActivityTask {
  id: number;
  description: string;
  isDone: boolean;
  sortOrder: number;
  measurementAttributeId: number | null;
  measurementAttributeName: string | null;
  measurementAttributeDataType: number | null;
  unit: string | null;
  minValue: number | null;
  maxValue: number | null;
  options: string | null;
  measuredValueDecimal: number | null;
  measuredValueText: string | null;
  measuredValueBoolean: boolean | null;
  measuredValueDate: string | null;
  measuredAt: string | null;
  measuredBy: string | null;
}

export interface RequestActivityDetail {
  id: number;
  name: string;
  isFinished: boolean;
  tasks: RequestActivityTask[];
}

export interface RequestAttachment {
  id: number;
  fileName: string;
  contentType: string;
  fileSize: number;
  uploadedByName: string;
  createdAt: string;
}

export interface RequestDetail {
  id: number;
  number: string;
  companyId: number;
  customerId: number;
  customerName: string;
  customerPhone: string | null;
  locationId: number | null;
  locationName: string | null;
  address: Address | null;
  description: string | null;
  scheduledDate: string | null;
  completionDate: string | null;
  status: number;
  statusName: string;
  serviceGroupId: number | null;
  serviceGroupName: string | null;
  contractorId: number | null;
  contractorName: string | null;
  employeeId: number | null;
  employeeName: string | null;
  createdAt: string;
  rating: number | null;
  ratingComment: string | null;
  printTemplateId: number | null;
  activities: RequestActivityDetail[];
  attachments: RequestAttachment[];
}
