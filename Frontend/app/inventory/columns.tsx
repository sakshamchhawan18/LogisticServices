"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { InventoryItem } from "@/lib/types";

export const columns: ColumnDef<InventoryItem>[] = [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "stock",
    header: "Stock",
    cell: ({ row }) => {
      const stock = row.getValue("stock") as number;
      const reorderLevel = row.original.reorder_level;
      return (
        <div className="flex items-center gap-2">
          {stock}
          {stock <= reorderLevel && (
            <Badge variant="destructive">Low Stock</Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "reorder_level",
    header: "Reorder Level",
  },
];