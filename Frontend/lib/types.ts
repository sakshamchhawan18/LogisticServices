export interface InventoryItem {
  id: number;
  name: string;
  stock: number;
  reorder_level: number;
}

export interface DispatchRequest {
  items: { id: number; quantity: number }[];
  delivery_points: string[];
}

export interface RouteResponse {
  route: string[];
  distance: number;
  duration: number;
}

export interface DispatchResponse {
  dispatch_id: number;
  route: RouteResponse;
}