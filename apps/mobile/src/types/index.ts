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

export const DATA_TYPE_LABELS: Record<number, string> = {
  1: 'Liczba', 2: 'Tekst', 3: 'Tak/Nie', 4: 'Data', 5: 'Lista wyboru',
};

export const REQUEST_STATUS_LABELS: Record<number, string> = {
  1: 'Nowe', 2: 'Przypisane', 3: 'W trakcie', 4: 'Wykonane', 5: 'Anulowane',
};

export const REQUEST_STATUS_COLORS: Record<number, string> = {
  1: '#78716c', 2: '#b7791f', 3: '#2563eb', 4: '#15803d', 5: '#b91c1c',
};

export interface RequestListItem {
  id: number;
  number: string;
  customerName: string;
  customerPhone: string | null;
  address: Address | null;
  scheduledDate: string | null;
  completionDate: string | null;
  status: number;
  statusName: string;
  serviceGroupName: string | null;
  contractorName: string | null;
  employeeName: string | null;
  createdAt: string;
  isMine: boolean;
  canClaim: boolean;
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
  activities: RequestActivityDetail[];
  attachments: RequestAttachment[];
}

export interface Session {
  token: string;
  employeeId: number;
  fullName: string;
  role: string;
  companyId: number | null;
  contractorId: number | null;
}
