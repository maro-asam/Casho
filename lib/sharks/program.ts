import { prisma } from "@/lib/prisma";
import { DEFAULT_PROGRAM, type ProgramSettings } from "./workflow";

/** Program switches (singleton row; defaults until an admin saves them). */
export async function getSharksProgram(): Promise<ProgramSettings> {
  const row = await prisma.sharksProgram.findUnique({
    where: { id: "default" },
    select: { applicationsOpen: true, benefitsAvailable: true, growthAvailable: true },
  });
  return row ?? DEFAULT_PROGRAM;
}
