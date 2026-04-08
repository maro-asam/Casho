import { cn } from "@/lib/utils";
import Image from "next/image";

type CashoLogoProps = {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  withSubTitle?: boolean;
};

const CashoLogo = ({
  className,
  iconClassName,
  textClassName,
  withSubTitle = true,
}: CashoLogoProps) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground ",
          iconClassName,
        )}
      >
        <Image
          src={`/logo.svg`}
          alt="Casho Logo"
          width={36}
          height={36}
          className="rounded-lg"
        />
      </div>

      <div className={cn("flex flex-col leading-none", textClassName)}>
        <span className="text-sm font-black tracking-tight">Casho</span>

        {withSubTitle ? (
          <span className="text-[11px] text-muted-foreground">
            Ecommerce Platform
          </span>
        ) : null}
      </div>
    </div>
  );
};

export default CashoLogo;
