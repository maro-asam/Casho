import { OrderSource, OrderStatus, type Prisma } from "@prisma/client";
import { readParam, type SearchParamsRecord } from "@/components/saas-page/url-state";

export type OrderFilters = {
  q?: string;
  status?: OrderStatus;
  source?: OrderSource;
};

const isStatus = (v?: string): v is OrderStatus => !!v && v in OrderStatus;
const isSource = (v?: string): v is OrderSource => !!v && v in OrderSource;

/** Validated filters from the orders page URL (invalid values are ignored). */
export function parseOrderFilters(params: SearchParamsRecord | URLSearchParams | undefined): OrderFilters {
  const record: SearchParamsRecord | undefined =
    params instanceof URLSearchParams ? Object.fromEntries(params.entries()) : params;
  const status = readParam(record, "status");
  const source = readParam(record, "source");

  return {
    q: readParam(record, "q"),
    status: isStatus(status) ? status : undefined,
    source: isSource(source) ? source : undefined,
  };
}

/**
 * Prisma `where` for the orders list. Pass `withStatus: false` for the tab
 * counts, which are grouped by status themselves.
 */
export function buildOrderWhere(
  storeId: string,
  { q, status, source }: OrderFilters,
  { withStatus = true }: { withStatus?: boolean } = {},
): Prisma.OrderWhereInput {
  return {
    storeId,
    ...(withStatus && status && { status }),
    ...(source && { source }),
    ...(q && {
      OR: [
        { fullName: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
        { id: { startsWith: q.replace(/^#/, "").toLowerCase() } },
      ],
    }),
  };
}
