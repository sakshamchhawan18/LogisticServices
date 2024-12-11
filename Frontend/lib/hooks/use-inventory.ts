"use client";

import useSWR from "swr";
import { getInventory } from "@/lib/api";

export function useInventory() {
  const { data, error, mutate } = useSWR("inventory", getInventory);

  return {
    inventory: data?.items ?? [],
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}