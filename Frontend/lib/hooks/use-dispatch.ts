"use client";

import { useState } from "react";
import { createDispatch } from "@/lib/api";
import type { DispatchRequest, DispatchResponse } from "@/lib/types";

export function useDispatch() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const dispatch = async (request: DispatchRequest): Promise<DispatchResponse | null> => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await createDispatch(request);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create dispatch'));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    dispatch,
    isLoading,
    error,
  };
}