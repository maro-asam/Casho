import { readFileSync, writeFileSync } from "node:fs";

function read(path) {
  return readFileSync(path, "utf8");
}

function write(path, content) {
  writeFileSync(path, content, "utf8");
}

function replaceRequired(content, pattern, replacement, label) {
  if (!pattern.test(content)) {
    throw new Error(`Could not find section to patch: ${label}`);
  }
  pattern.lastIndex = 0;
  return content.replace(pattern, replacement);
}

function replaceOptional(content, pattern, replacement, label) {
  if (!pattern.test(content)) {
    console.log(`[skip] ${label} already patched or section not found`);
    return content;
  }
  pattern.lastIndex = 0;
  console.log(`[ok] ${label}`);
  return content.replace(pattern, replacement);
}

const inAppPath = "lib/notifications/in-app.ts";
let inApp = read(inAppPath);

const patchedCreateNotification = `export async function createNotification(
  input: CreateNotificationInput,
  db: NotificationDb = prisma,
) {
  if (!input.userId && !input.storeId) {
    return null;
  }

  try {
    let resolvedUserId = input.userId ?? null;

    if (!resolvedUserId && input.storeId) {
      const storeOwner = await db.store.findUnique({
        where: { id: input.storeId },
        select: { userId: true },
      });

      resolvedUserId = storeOwner?.userId ?? null;
    }

    return await db.notification.create({
      data: {
        userId: resolvedUserId,
        storeId: input.storeId ?? null,
        type: input.type,
        title: input.title,
        message: input.message,
        href: input.href ?? null,
        ...(input.data === undefined || input.data === null
          ? {}
          : { data: input.data }),
      },
      select: {
        id: true,
      },
    });
  } catch (error) {
    console.error("createNotification Error:", {
      type: input.type,
      userId: input.userId ?? null,
      storeId: input.storeId ?? null,
      error,
    });

    return null;
  }
}

`;

if (!inApp.includes("let resolvedUserId = input.userId ?? null")) {
  inApp = replaceRequired(
    inApp,
    /export async function createNotification\([\s\S]*?\n}\s*\n\s*export async function createStoreNotification/,
    `${patchedCreateNotification}export async function createStoreNotification`,
    "lib/notifications/in-app.ts createNotification",
  );
  write(inAppPath, inApp);
  console.log(`[write] ${inAppPath}`);
} else {
  console.log(`[skip] ${inAppPath} already patched`);
}

const ordersPath = "actions/store/orders.actions.ts";
let orders = read(ordersPath);

if (!/select:\s*{\s*id:\s*true,\s*userId:\s*true,/.test(orders)) {
  orders = replaceRequired(
    orders,
    /(select:\s*{\s*id:\s*true,)/,
    `$1\n      userId: true,`,
    "orders store select userId",
  );
  console.log("[ok] orders store select userId");
} else {
  console.log("[skip] orders store select userId already patched");
}

orders = replaceOptional(
  orders,
  /(await createNotification\(\{\s*storeId:\s*store\.id,)(\s*type:\s*NotificationType\.NEW_ORDER,)/,
  `$1\n    userId: store.userId,$2`,
  "new order notification userId",
);

orders = replaceOptional(
  orders,
  /(await createNotification\(\{\s*storeId,)(\s*type:\s*NotificationType\.ORDER_STATUS_CHANGED,)/,
  `$1\n      userId,$2`,
  "order status notification userId",
);

write(ordersPath, orders);
console.log(`[write] ${ordersPath}`);

const bellPath = "app/(merchant)/_components/notifications/NotificationsBell.tsx";
let bell = read(bellPath);

const patchedRefreshAndEffect = `const refresh = useCallback(async () => {
    try {
      const result = await GetNotificationsAction(10);

      setNotifications(result.notifications);

      setUnreadCount(result.unreadCount);
    } catch (error) {
      console.error("GetNotificationsAction Error:", error);
    }
  }, []);

  useEffect(() => {
    void refresh();

    const id = window.setInterval(() => {
      void refresh();
    }, pollEveryMs);

    const handleFocus = () => {
      void refresh();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        void refresh();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [pollEveryMs, refresh]);`;

if (!bell.includes("GetNotificationsAction Error")) {
  bell = replaceRequired(
    bell,
    /const refresh = useCallback\(async \(\) => \{[\s\S]*?\}, \[\]\);\s*\n\s*useEffect\(\(\) => \{[\s\S]*?\}, \[pollEveryMs, refresh\]\);/,
    patchedRefreshAndEffect,
    "NotificationsBell refresh/effect",
  );
  write(bellPath, bell);
  console.log(`[write] ${bellPath}`);
} else {
  console.log(`[skip] ${bellPath} already patched`);
}

console.log("Done. Now run: npx prisma generate && npx prisma db push && npm run build");
