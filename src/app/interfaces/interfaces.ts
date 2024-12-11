export interface ATM {
  id: string;
  name: string;
  address: {
    street_name: string;
    street_number: string;
    city: string;
    state: string;
    zip: string;
  };
  latitude: number;
  longitude: number;
  distance: number;
}
