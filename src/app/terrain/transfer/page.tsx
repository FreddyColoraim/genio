export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getNomadeContacts } from "@/app/(dashboard)/nomade/actions";
import type { NomadeContact } from "@/app/(dashboard)/nomade/actions";
import { TransferClient } from "@/components/nomade-rh/transfer-client";

export default async function TransferPage() {
  const contacts = await getNomadeContacts().catch(() => [] as NomadeContact[]);
  const pendingCount = contacts.filter((c) => !c.briefSent).length;

  return (
    <div className="flex flex-col pb-24">
      {/* Header */}
      <div className="bg-[#1B2A4A] px-4 pt-12 pb-6">
        <div className="flex items-center gap-3">
          <Link href={"/terrain" as never} className="text-white/70 hover:text-white">
            <ArrowLeft className="size-5" />
          </Link>
          <div>
            <h1 className="text-white font-bold text-xl">Transfert Nexo RH</h1>
            <p className="text-white/60 text-xs mt-0.5">
              {pendingCount} contact{pendingCount !== 1 ? "s" : ""} en attente
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <TransferClient contacts={contacts} />
      </div>
    </div>
  );
}
