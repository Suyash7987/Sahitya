import { redirect } from "next/navigation";

export default async function BillDetailRedirectPage({
  params,
}: PageProps<"/desk/bills/[id]">) {
  const { id } = await params;
  redirect(`/desk/history/${id}`);
}
