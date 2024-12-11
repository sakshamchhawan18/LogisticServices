from fastapi import FastAPI, HTTPException, Request, Depends
from pydantic import BaseModel, Field
from typing import List
import requests
import logging
from fastapi.middleware.cors import CORSMiddleware

# Initialize FastAPI app
app = FastAPI()

# Allow requests from Next.js frontend (http://localhost:3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Allows requests from Next.js frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Configuration ---
GOOGLE_MAPS_API_KEY = "AIzaSyAnOv5uNrcma62UcjtcOrXKydDOaW3vLj0"
if not GOOGLE_MAPS_API_KEY:
    raise ValueError("Google Maps API key is not set")

# --- Database Simulation ---
inventory_db = []
dispatch_db = []

# --- Models ---
class InventoryItem(BaseModel):
    id: int = Field(..., gt=0, description="Unique positive ID for the item")
    name: str = Field(..., min_length=1, description="Item name cannot be empty")
    stock: int = Field(..., ge=0, description="Stock must be a non-negative integer")
    reorder_level: int = Field(..., ge=0, description="Reorder level must be a non-negative integer")

class DispatchRequest(BaseModel):
    items: List[dict] = Field(..., description="List of items to dispatch")
    delivery_points: List[str] = Field(..., min_items=1, description="At least one delivery point is required")

class RouteRequest(BaseModel):
    start: str = Field(..., description="Starting location for the route")
    points: List[str] = Field(..., min_items=1, description="Points to optimize route for")

# --- Logging ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Incoming request: {request.method} {request.url}")
    response = await call_next(request)
    logger.info(f"Response status: {response.status_code}")
    return response

# --- Helper Functions ---
def geocode_address(address: str):
    """
    Converts an address into latitude,longitude format using Google Geocoding API.
    """
    geocode_url = f"https://maps.googleapis.com/maps/api/geocode/json?address={address}&key={GOOGLE_MAPS_API_KEY}"
    response = requests.get(geocode_url)
    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="Failed to geocode address")

    data = response.json()
    if data.get("status") != "OK" or not data.get("results"):
        raise HTTPException(status_code=500, detail=f"Geocoding failed for address: {address}")

    location = data["results"][0]["geometry"]["location"]
    return f"{location['lat']},{location['lng']}"  # Return lat,lng as a string

def optimize_route(start: str, points: List[str]):
    """
    Optimizes a route using Google Maps Directions API and returns lat,lng coordinates for all waypoints.
    """
    # Geocode start and waypoints
    start_coords = geocode_address(start)
    waypoint_coords = [geocode_address(point) for point in points]
    waypoints = "|".join(waypoint_coords)

    # Call Google Directions API
    url = f"https://maps.googleapis.com/maps/api/directions/json?origin={start_coords}&destination={start_coords}&waypoints={waypoints}&key={GOOGLE_MAPS_API_KEY}"
    response = requests.get(url)

    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="Failed to fetch route from Google Maps API")

    data = response.json()
    logger.info(f"Google Maps API Response: {data}")  # Log the API response for debugging

    if data["status"] != "OK":
        raise HTTPException(status_code=500, detail=f"Error from Google Maps API: {data['status']}")

    # Extract lat,lng coordinates for all route points
    try:
        legs = data["routes"][0]["legs"]
        route_coords = []
        for leg in legs:
            start_loc = leg["start_location"]
            route_coords.append(f"{start_loc['lat']},{start_loc['lng']}")
        end_loc = legs[-1]["end_location"]
        route_coords.append(f"{end_loc['lat']},{end_loc['lng']}")  # Add final destination

        route = {
            "route": route_coords,
            "distance": sum(leg["distance"]["value"] for leg in legs) // 1000,  # Total distance in km
            "duration": sum(leg["duration"]["value"] for leg in legs) // 3600,  # Total time in hours
        }
        return route
    except (KeyError, IndexError):
        raise HTTPException(status_code=500, detail="Unexpected response structure from Google Maps API")

# --- Routes ---
@app.get("/api/inventory", summary="Get Inventory", description="Fetch the list of inventory items.")
def get_inventory():
    return {"items": inventory_db}

@app.post("/api/inventory", summary="Add Inventory", description="Add a new inventory item.")
def add_inventory(item: InventoryItem):
    for existing_item in inventory_db:
        if existing_item["id"] == item.id:
            raise HTTPException(status_code=400, detail="Item with this ID already exists")

    inventory_db.append(item.dict())
    return {"message": "Item added successfully", "item": item}

@app.post("/api/dispatch", summary="Create a Dispatch", description="Dispatch items to delivery points and optimize routes using Google Maps.")
def create_dispatch(dispatch: DispatchRequest):
    for req_item in dispatch.items:
        item = next((i for i in inventory_db if i["id"] == req_item["id"]), None)
        if not item:
            raise HTTPException(status_code=404, detail=f"Item with ID {req_item['id']} not found")
        if item["stock"] < req_item["quantity"]:
            raise HTTPException(status_code=400, detail=f"Not enough stock for item ID {req_item['id']}")
        item["stock"] -= req_item["quantity"]

    route = optimize_route("1600 Amphitheatre Parkway, Mountain View, CA", dispatch.delivery_points)
    dispatch_id = len(dispatch_db) + 1
    dispatch_db.append({"id": dispatch_id, "route": route})
    return {"dispatch_id": dispatch_id, "route": route}

@app.post("/api/routes/optimize", summary="Optimize Routes", description="Optimize delivery routes based on starting point and waypoints.")
def optimize_routes(request: RouteRequest):
    return optimize_route(request.start, request.points)

# --- Start Backend ---
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
