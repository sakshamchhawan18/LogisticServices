"use client";

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
import { useDispatch } from "@/lib/hooks/use-dispatch";
import { useToast } from "@/components/ui/use-toast";

const formSchema = z.object({
  itemId: z.number().positive(),
  quantity: z.number().positive(),
  deliveryPoint: z.string().min(1),
});

type FormData = z.infer<typeof formSchema>;

interface DispatchFormProps {
  onSuccess: (directions: google.maps.DirectionsResult) => void;
}

export function DispatchForm({ onSuccess }: DispatchFormProps) {
  const { dispatch, isLoading } = useDispatch();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      itemId: 1,
      quantity: 1,
      deliveryPoint: "",
    },
  });

  async function onSubmit(values: FormData) {
    try {
      const result = await dispatch({
        items: [{ id: values.itemId, quantity: values.quantity }],
        delivery_points: [values.deliveryPoint],
      });

      if (result) {
        const directionsService = new google.maps.DirectionsService();
        const waypoints = result.route.route.map((coord: string) => {
          const [lat, lng] = coord.split(",").map(Number);
          return new google.maps.LatLng(lat, lng);
        });

        const request = {
          origin: waypoints[0],
          destination: waypoints[waypoints.length - 1],
          waypoints: waypoints.slice(1, -1).map(location => ({
            location,
            stopover: true
          })),
          travelMode: google.maps.TravelMode.DRIVING,
        };

        directionsService.route(request, (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            onSuccess(result);
            toast({
              title: "Success",
              description: "Dispatch created successfully",
            });
          }
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create dispatch",
        variant: "destructive",
      });
    }
  }

  return (
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
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Dispatch"}
        </Button>
      </form>
    </Form>
  );
}