export const dynamic = "force-dynamic";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
export default function Page() {
  return (
    <div className="flex-1 p-4">
      <Link href={"/terrain" as never} className="mb-6 flex items-center gap-2 text-sm font-semibold text-[#1B2A4A]">
        <ArrowLeft className="size-4" /> Retour
      </Link>
      <div className="rounded-2xl border-2 border-dashed border-blue-200 bg-white p-8 text-center">
        <p className="text-4xl mb-3">🚧</p>
        <p className="text-sm font-bold text-[#1B2A4A]">Page en développement</p>
      </div>
    </div>
  );
}
