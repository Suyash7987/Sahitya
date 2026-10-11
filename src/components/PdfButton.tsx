"use client";

import { Button } from "@/components/Button";
import { downloadBillPdf } from "@/lib/pdf";
import type { BillRecord } from "@/types";

export function PdfButton({ bill }: { bill: BillRecord }) {
  return (
    <Button className="w-full sm:w-auto" onClick={() => downloadBillPdf(bill)}>
      Generate bill
    </Button>
  );
}
