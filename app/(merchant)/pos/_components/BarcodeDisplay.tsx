"use client";

import { useEffect, useRef } from "react";

type Props = {
  value: string;
  format?: "CODE128" | "EAN13" | "CODE39";
  width?: number;
  height?: number;
  displayValue?: boolean;
  className?: string;
};

export default function BarcodeDisplay({
  value,
  format = "CODE128",
  width = 2,
  height = 60,
  displayValue = true,
  className,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;

    import("jsbarcode").then(({ default: JsBarcode }) => {
      try {
        JsBarcode(svgRef.current!, value, {
          format,
          width,
          height,
          displayValue,
          fontSize: 11,
          margin: 4,
          background: "transparent",
        });
      } catch {
        // Invalid barcode value
      }
    });
  }, [value, format, width, height, displayValue]);

  if (!value) return null;

  return <svg ref={svgRef} className={className} />;
}
