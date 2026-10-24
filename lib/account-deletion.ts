import { SupportRequestStatus } from "@prisma/client";

// A merchant's "delete my account" request is a support ticket with this exact
// title: the admin reviews it on /admin/support-requests and deletes the account
// from /admin/users/[id] (which checks for money history first). Closing or
// resolving the ticket ends the request.
export const ACCOUNT_DELETION_TITLE = "طلب حذف الحساب";

/** Ticket statuses that mean the request is still waiting on the admin. */
export const OPEN_DELETION_STATUSES: SupportRequestStatus[] = [SupportRequestStatus.PENDING, SupportRequestStatus.OPENED];

export function isAccountDeletionRequest(title: string) {
  return title === ACCOUNT_DELETION_TITLE;
}
