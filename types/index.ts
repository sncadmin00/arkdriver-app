export interface DriverProfile {
  driver: {
    companyId: string;
    driverRef: string;
    driverName: string;
    email: string;
    status: string;
    readyAt?: string;
  };
  truck?: {
    id: string;
    unit: string;
    vin: string;
  };
}

export interface Load {
  id: string;
  reference?: string;
  origin?: string;
  destination?: string;
  miles?: number;
  status?: string;
  pickupAt?: string;
  pickupTime?: string;
  deliverAt?: string;
  deliverTime?: string;
  commodity?: string;
  weightLbs?: number;
  [key: string]: any;
}
export interface MaintenanceRecord {
  id: string;
  companyId: string;
  unitId: string;
  driverId: string;
  type: 'maintenance' | 'repair';
  serviceType: string;
  status: 'open' | 'closed';
  isEmergency?: boolean;
  serviceDate: string;
  mileageAtService: number;
  cost: number;
  description?: string;
  issuesFound?: string[];
  invoiceUrl?: string;
  nextServiceMileage?: number;
  intervalMiles?: number;
  paidBy?: 'company' | 'driver_owner';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceInvoice {
  id: string;
  maintenanceId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
}

export interface MaintenanceYTDSummary {
  units: Array<{
    unitId: string;
    spent: number;
    breakdown: Record<string, number>;
  }>;
  total: number;
}
