import Image from "next/image";

export default function Loading() {
  return (
    <main
      role="status"
      aria-live="polite"
      aria-label="جاري التحميل"
      className="flex min-h-screen w-full items-center justify-center bg-background px-6"
    >
      <div className="relative flex h-24 w-24 items-center justify-center">
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-muted border-t-primary" />

        <Image
          src="/logo.svg"
          alt="Casho"
          width={56}
          height={56}
          priority
          className="h-14 w-14 rounded-full object-contain"
        />

        <span className="sr-only">جاري التحميل...</span>
      </div>
    </main>
  );
}