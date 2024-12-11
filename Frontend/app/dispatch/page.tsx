"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";
import { createDispatch } from "@/lib/api";
import { GoogleMap, LoadScript, DirectionsRenderer } from "@react-google-maps/api";

const formSchema = z.object({
  itemId: z.number().positive(),
  quantity: z.number().positive(),
  deliveryPoint: z.string().min(1),
});

const GOOGLE_MAPS_API_KEY = "AIzaSyAnOv5uNrcma62UcjtcOrXKydDOaW3vLj0";

export default function DispatchPage() {
  const { toast } = useToast();
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(
    null
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      itemId: 1,
      quantity: 1,
      deliveryPoint: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const dispatch = await createDispatch({
        items: [{ id: values.itemId, quantity: values.quantity }],
        delivery_points: [values.deliveryPoint],
      });

      // Convert route coordinates to LatLng
      const waypoints = dispatch.route.route.map((coord: string) => {
        const [lat, lng] = coord.split(",").map(Number);
        return new google.maps.LatLng(lat, lng);
      });

      // Create DirectionsService request
      const directionsService = new google.maps.DirectionsService();
      const request = {
        origin: waypoints[0],
        destination: waypoints[waypoints.length - 1],
        waypoints: waypoints.slice(1, -1).map((location : string) => ({
          location,
          stopover: true
        })),
        travelMode: google.maps.TravelMode.DRIVING,
      };

      directionsService.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
          setDirections(result);
        }
      });

      toast({
        title: "Success",
        description: "Dispatch created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create dispatch",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Create Dispatch</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="itemId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item ID</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="deliveryPoint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delivery Point</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Create Dispatch</Button>
            </form>
          </Form>
        </Card>

        <Card className="p-6">
          <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "400px" }}
              center={{ lat: 37.7749, lng: -122.4194 }}
              zoom={12}
            >
              {directions && <DirectionsRenderer directions={directions} />}
            </GoogleMap>
          </LoadScript>
        </Card>
      </div>
    </div>
  );
}