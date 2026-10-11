import { jsonError, requireUser, isValidId } from "@/lib/api";
import { mapBill } from "@/lib/billMap";
import { dbConnect } from "@/lib/mongodb";
import { Bill } from "@/models/Bill";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/bills/[id]">,
) {
  const { error } = await requireUser(["admin", "desk"]);
  if (error) return error;

  const { id } = await params;
  if (!isValidId(id)) return jsonError("Bill not found.", 404);
  await dbConnect();
  const bill = await Bill.findById(id);
  if (!bill) return jsonError("Bill not found.", 404);

  return NextResponse.json({ bill: mapBill(bill) });
}
