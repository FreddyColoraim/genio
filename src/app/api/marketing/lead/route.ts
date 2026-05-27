import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { onLandingPageLead } from "@/lib/brevo";

const schema = z.object({
  email:     z.string().email(),
  firstName: z.string().optional(),
  company:   z.string().optional(),
  sector:    z.string().min(2),
});

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides.", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await onLandingPageLead({
      email:     parsed.data.email,
      sector:    parsed.data.sector,
      firstName: parsed.data.firstName ?? undefined,
      company:   parsed.data.company ?? undefined,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[/api/marketing/lead]", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
