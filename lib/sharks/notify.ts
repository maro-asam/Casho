import type { SharksApplicationStatus } from "@prisma/client";
import { isMailConfigured } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications/in-app";
import { dashboardUrl, deliver, inBackground } from "@/lib/notifications/email/deliver";
import { esc, notice, renderEmail } from "@/lib/notifications/email/layout";
import { APPLICATION_STATUS } from "./catalog";

// Tells the applicant what happened: an in-app notification (always) and an
// email to the store owner when Brevo is configured. Never throws.

const HREF = "/dashboard/sharks";

type Kind = "submitted" | "info_requested" | "status";

const COPY: Record<Kind, (status: SharksApplicationStatus) => { title: string; message: string }> = {
  submitted: () => ({
    title: "طلبك لـ Casho Sharks وصل",
    message: "فريق كاشو هيراجع الطلب، وهتلاقي أي تحديث هنا. التقديم مش معناه اختيار مضمون.",
  }),
  info_requested: () => ({
    title: "Casho Sharks: محتاجين معلومات زيادة",
    message: "فريق المراجعة سألك سؤال على طلبك. رد من صفحة البرنامج عشان المراجعة تكمل.",
  }),
  status: (status) => ({
    title: "تحديث على طلبك لـ Casho Sharks",
    message: `حالة طلبك بقت «${APPLICATION_STATUS[status].ar}».`,
  }),
};

export async function notifyApplicant(input: { applicationId: string; storeId: string; kind: Kind; status: SharksApplicationStatus; detail?: string | null }) {
  const copy = COPY[input.kind](input.status);
  await createNotification({
    storeId: input.storeId,
    type: input.kind === "submitted" ? "SHARKS_APPLICATION_SUBMITTED" : "SHARKS_APPLICATION_UPDATED",
    title: copy.title,
    message: copy.message,
    href: HREF,
    data: { sharksApplicationId: input.applicationId, status: input.status },
  });

  if (!isMailConfigured()) return;
  inBackground(async () => {
    const store = await prisma.store.findUnique({ where: { id: input.storeId }, select: { user: { select: { email: true, name: true } } } });
    const to = store?.user.email;
    if (!to) return;
    const appUrl = process.env.APP_URL ?? "https://casho.store";
    const html = renderEmail({
      brand: { name: "Casho Sharks", logo: null, accent: "#1447e6", url: appUrl },
      preheader: copy.message,
      heading: copy.title,
      intro: copy.message,
      // The info request is the team's own question — safe to show, still escaped.
      body: input.kind === "info_requested" && input.detail ? notice(esc(input.detail), "warning") : undefined,
      cta: { label: "افتح الطلب", href: dashboardUrl("/sharks") },
      footer: "الإيميل ده وصلك لأنك قدّمت على برنامج Casho Sharks من حساب كاشو بتاعك.",
    });
    const text = [copy.title, copy.message, input.kind === "info_requested" ? input.detail : null, dashboardUrl("/sharks")].filter(Boolean).join("\n\n");
    await deliver({ to, subject: copy.title, html, text, fromName: "Casho Sharks" },{ kind: "SHARKS_APPLICATION", storeId: input.storeId, refId: input.applicationId });
  });
}
