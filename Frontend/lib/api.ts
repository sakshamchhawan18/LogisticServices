const API_BASE_URL = 'http://localhost:8000/api';

export async function getInventory() {
  const response = await fetch(`${API_BASE_URL}/inventory`);
  if (!response.ok) throw new Error('Failed to fetch inventory');
  return response.json();
}

export async function addInventoryItem(item: {
  id: number;
  name: string;
  stock: number;
  reorder_level: number;
}) {
  const response = await fetch(`${API_BASE_URL}/inventory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  if (!response.ok) throw new Error('Failed to add inventory item');
  return response.json();
}

export async function createDispatch(dispatch: {
  items: { id: number; quantity: number }[];
  delivery_points: string[];
}) {
  const response = await fetch(`${API_BASE_URL}/dispatch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dispatch),
  });
  if (!response.ok) throw new Error('Failed to create dispatch');
  return response.json();
}

export async function optimizeRoute(request: {
  start: string;
  points: string[];
}) {
  const response = await fetch(`${API_BASE_URL}/routes/optimize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!response.ok) throw new Error('Failed to optimize route');
  return response.json();
}