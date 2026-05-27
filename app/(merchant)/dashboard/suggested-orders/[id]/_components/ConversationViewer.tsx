import { cn } from "@/lib/utils";
import { Store, User } from "lucide-react";

type Message = {
  id: string;
  isFromBusiness: boolean;
  content: string | null;
  messageType: string;
  sentAt: Date;
};

type Props = {
  messages: Message[];
  customerName?: string | null;
};

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
    day: "numeric",
    month: "short",
  }).format(new Date(date));
}

export function ConversationViewer({ messages, customerName }: Props) {
  const textMessages = messages.filter((m) => m.content);

  if (textMessages.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        لا توجد رسائل نصية في هذه المحادثة
      </div>
    );
  }

  return (
    <div className="flex max-h-[420px] flex-col gap-3 overflow-y-auto p-1">
      {textMessages.map((msg) => (
        <div
          key={msg.id}
          className={cn(
            "flex gap-2",
            msg.isFromBusiness ? "flex-row-reverse" : "flex-row",
          )}
        >
          {/* Avatar */}
          <div
            className={cn(
              "mt-0.5 grid size-7 shrink-0 place-items-center rounded-full text-xs",
              msg.isFromBusiness
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground",
            )}
          >
            {msg.isFromBusiness ? (
              <Store className="size-3.5" />
            ) : (
              <User className="size-3.5" />
            )}
          </div>

          {/* Bubble */}
          <div
            className={cn(
              "max-w-[75%] rounded-2xl px-3.5 py-2.5",
              msg.isFromBusiness
                ? "rounded-tr-sm bg-primary text-primary-foreground"
                : "rounded-tl-sm bg-muted text-foreground",
            )}
          >
            <p className="text-sm leading-5">{msg.content}</p>
            <p
              className={cn(
                "mt-1 text-[10px]",
                msg.isFromBusiness
                  ? "text-primary-foreground/70"
                  : "text-muted-foreground",
              )}
            >
              {msg.isFromBusiness ? "التاجر" : (customerName ?? "العميل")} •{" "}
              {formatTime(msg.sentAt)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
