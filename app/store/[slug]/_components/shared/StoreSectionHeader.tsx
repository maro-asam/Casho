import React from "react";
import { Button } from "../../../../../components/ui/button";
import Link from "next/link";
import { MousePointer2 } from "lucide-react";

interface StoreSectionHeaderProps {
  title: string;
  btn: string;
  href: string;
}

const StoreSectionHeader = ({ title, btn, href }: StoreSectionHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-xl font-semibold md:text-2xl text-primary">
          {title}
        </h2>
      </div>

      <Button asChild variant={`outline`}>
        <Link href={href}>
          {btn}
          <MousePointer2 />
        </Link>
      </Button>
    </div>
  );
};

export default StoreSectionHeader;
