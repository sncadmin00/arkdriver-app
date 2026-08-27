export interface Driver {
  id: string;
  email: string;
  name: string;
  assigned_truck_id?: string;
}

export interface Load {
  id: string;
  load_number: string;
  pickup_location: string;
  delivery_location: string;
  distance: number;
  pay_rate: number;
  due_date: string;
  status: 'available' | 'accepted' | 'in_transit' | 'at_pickup' | 'at_delivery' | 'delivered';
}

export interface ChatMessage {
  id: string;
  thread_id: string;
  message_text: string;
  sender_type: 'driver' | 'dispatcher';
  created_at: string;
}
