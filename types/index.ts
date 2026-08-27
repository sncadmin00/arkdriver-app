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
