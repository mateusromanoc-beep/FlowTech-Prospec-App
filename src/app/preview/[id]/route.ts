import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const leadId = parseInt(params.id);
    if (isNaN(leadId)) {
      return new Response("ID de lead inválido", { status: 400 });
    }

    const lead = await db.select().from(leads).where(eq(leads.id, leadId)).get();
    if (!lead || !lead.generatedHtml) {
      return new Response(
        `<html>
          <head>
            <title>Site não encontrado</title>
            <style>
              body { background: #0a0e1a; color: #8b92a5; font-family: sans-serif; text-align: center; padding-top: 100px; }
              h1 { color: white; }
            </style>
          </head>
          <body>
            <h1>Preview indisponível</h1>
            <p>Este site ainda não foi gerado ou o lead não foi encontrado.</p>
          </body>
        </html>`,
        { 
          status: 404,
          headers: { "Content-Type": "text/html; charset=utf-8" } 
        }
      );
    }

    return new Response(lead.generatedHtml, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        // Permitir que o site carregue recursos se necessário, sem restrições rígidas de X-Frame-Options no preview externo
      },
    });
  } catch (error) {
    console.error("Erro no preview do site:", error);
    return new Response("Erro interno do servidor", { status: 500 });
  }
}
