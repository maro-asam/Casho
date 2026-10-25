import Image from "next/image";

/** The code arriving, as an iPhone lock-screen notification on glass. */
export function VerifyEmailAside() {
  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <h2 className="text-[40px] leading-[1.2] font-bold text-balance">
          <span className="text-muted-foreground">خطوة واحدة،</span>
          <br />
          وتبدأ تبيع.
        </h2>
        <p className="text-[17px] leading-7 text-muted-foreground">
          تأكيد الإيميل بيضمن إن إشعارات الطلبات واسترجاع حسابك يوصلوا ليك إنت بس.
        </p>
      </div>

      <div className="rounded-[22px] bg-white/10 p-4 shadow-[0_8px_32px_rgba(0,0,0,.25),inset_0_1px_0_rgba(255,255,255,.18)] backdrop-blur-2xl backdrop-saturate-150">
        <div className="flex items-start gap-3">
          <Image src="/logo.svg" alt="" width={38} height={38} className="rounded-[9px]" />
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[15px] font-semibold">كاشو</p>
              <p className="text-[13px] text-muted-foreground">دلوقتي</p>
            </div>
            <p className="text-[15px] font-semibold">أكّد إيميلك</p>
            <p className="text-[15px] leading-5 text-muted-foreground">
              <span dir="ltr" className="font-semibold text-foreground tabular-nums">
                482 917
              </span>{" "}
              هو كود تأكيد إيميلك على كاشو.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
