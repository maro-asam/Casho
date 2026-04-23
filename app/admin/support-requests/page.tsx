import { prisma } from "@/lib/prisma";

export default async function AdminSupportPage() {
  const requests = await prisma.supportRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      store: true,
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">طلبات الدعم</h1>

      {requests.map((item) => (
        <div key={item.id} className="border rounded-xl p-4">
          <h2 className="font-bold">{item.title}</h2>
          <p>{item.message}</p>
          <p className="text-sm text-muted-foreground">{item.store?.name}</p>
        </div>
      ))}
    </div>
  );
}
