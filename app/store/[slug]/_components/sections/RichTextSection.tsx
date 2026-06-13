import type { RichTextSettings } from "@/types/store-theme.types";
import { cn } from "@/lib/utils";

interface Props {
  content?: RichTextSettings;
}

const WIDTH_CLASSES: Record<NonNullable<RichTextSettings["width"]>, string> = {
  narrow: "max-w-xl",
  normal: "max-w-3xl",
  wide:   "max-w-5xl",
  full:   "max-w-none",
};

export default function RichTextSection({ content }: Props) {
  const {
    heading,
    paragraph,
    width = "normal",
    textAlign = "center",
    backgroundColor,
  } = content ?? {};

  if (!heading && !paragraph) return null;

  return (
    <section
      className="w-full py-16 px-6"
      style={backgroundColor ? { backgroundColor } : undefined}
    >
      <div
        className={cn(
          "mx-auto space-y-4",
          WIDTH_CLASSES[width] ?? WIDTH_CLASSES.normal,
          textAlign === "center" && "text-center",
          textAlign === "left"   && "text-left",
          textAlign === "right"  && "text-right",
        )}
      >
        {heading && (
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">
            {heading}
          </h2>
        )}

        {paragraph && (
          <p className="whitespace-pre-wrap text-base leading-relaxed text-muted-foreground md:text-lg">
            {paragraph}
          </p>
        )}
      </div>
    </section>
  );
}
