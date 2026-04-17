"use client";

import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  minDefault?: number;
  maxDefault?: number;
};

const MAX_ALLOWED = 100000;

const PriceRangeFilter = ({ minDefault = 0, maxDefault = 0 }: Props) => {
  const safeMax = maxDefault > 0 ? maxDefault : MAX_ALLOWED;

  const [range, setRange] = useState<[number, number]>([
    Math.max(0, minDefault),
    Math.min(MAX_ALLOWED, safeMax),
  ]);

  return (
    <div className="space-y-4">
      <Label>السعر</Label>

      <Slider
        min={0}
        max={MAX_ALLOWED}
        step={50}
        value={range}
        onValueChange={(value) => setRange([value[0], value[1]])}
      />

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="minPrice">من</Label>
          <Input
            id="minPrice"
            type="number"
            name="minPrice"
            min={0}
            value={range[0]}
            onChange={(e) =>
              setRange([Math.max(0, Number(e.target.value || 0)), range[1]])
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxPrice">إلى</Label>
          <Input
            id="maxPrice"
            type="number"
            name="maxPrice"
            min={0}
            value={range[1]}
            onChange={(e) =>
              setRange([range[0], Math.max(0, Number(e.target.value || 0))])
            }
          />
        </div>
      </div>
    </div>
  );
};

export default PriceRangeFilter;