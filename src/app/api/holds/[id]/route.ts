import { NextResponse } from "next/server";
import { isValidId, jsonError, requireUser } from "@/lib/api";
import { mapHoldOrder } from "@/lib/heldOrders";
import { dbConnect } from "@/lib/mongodb";
import { HoldOrder } from "@/models/HoldOrder";

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/holds/[id]">,
) {
  const { error } = await requireUser(["admin", "desk"]);
  if (error) return error;

  const { id } = await params;
  if (!isValidId(id)) return jsonError("Held order not found.", 404);

  await dbConnect();
  const hold = await HoldOrder.findById(id);
  if (!hold) return jsonError("Held order not found.", 404);
  return NextResponse.json({ hold: mapHoldOrder(hold) });
}

export async function DELETE(
  _request: Request,
  { params }: RouteContext<"/api/holds/[id]">,
) {
  const { error } = await requireUser(["admin", "desk"]);
  if (error) return error;

  const { id } = await params;
  if (!isValidId(id)) return jsonError("Held order not found.", 404);

  await dbConnect();
  const hold = await HoldOrder.findByIdAndDelete(id);
  if (!hold) return jsonError("Held order not found.", 404);
  return NextResponse.json({ ok: true, hold: mapHoldOrder(hold) });
}
