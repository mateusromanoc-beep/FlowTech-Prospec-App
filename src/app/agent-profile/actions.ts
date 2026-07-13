"use server";

import { db } from "@/lib/db";
import { agentProfiles } from "@/lib/schema";
import { verifySession } from "@/lib/session";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getAgentProfileAction() {
  const session = await verifySession();
  if (!session?.userId) {
    return { error: "Não autorizado" };
  }

  try {
    const profile = await db
      .select()
      .from(agentProfiles)
      .where(eq(agentProfiles.userId, session.userId))
      .get();

    return { profile: profile || null };
  } catch (error) {
    console.error("Erro ao buscar perfil do agente:", error);
    return { error: "Erro interno ao buscar perfil" };
  }
}

export async function saveAgentProfileAction(data: {
  companyName: string;
  businessActivity: string;
  servicesOffered: string;
  targetAudience?: string;
  customTone?: string;
}) {
  const session = await verifySession();
  if (!session?.userId) {
    return { error: "Não autorizado" };
  }

  if (!data.companyName || !data.businessActivity || !data.servicesOffered) {
    return { error: "Nome da empresa, atividade e serviços oferecidos são obrigatórios." };
  }

  try {
    const existing = await db
      .select()
      .from(agentProfiles)
      .where(eq(agentProfiles.userId, session.userId))
      .get();

    if (existing) {
      // Atualiza o existente
      await db
        .update(agentProfiles)
        .set({
          companyName: data.companyName,
          businessActivity: data.businessActivity,
          servicesOffered: data.servicesOffered,
          targetAudience: data.targetAudience || null,
          customTone: data.customTone || "profissional",
        })
        .where(eq(agentProfiles.userId, session.userId));
    } else {
      // Cria um novo
      await db.insert(agentProfiles).values({
        userId: session.userId,
        companyName: data.companyName,
        businessActivity: data.businessActivity,
        servicesOffered: data.servicesOffered,
        targetAudience: data.targetAudience || null,
        customTone: data.customTone || "profissional",
      });
    }

    revalidatePath("/agent-profile");
    revalidatePath("/leads");
    return { success: true };
  } catch (error) {
    console.error("Erro ao salvar perfil do agente:", error);
    return { error: "Erro ao salvar perfil do agente no banco de dados." };
  }
}
