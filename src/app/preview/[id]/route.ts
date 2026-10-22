import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads, agentProfiles, users } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const url = new URL(req.url);
  const isRaw = url.searchParams.get("raw") === "true";

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
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { background: #0a0e1a; color: #8b92a5; font-family: system-ui, sans-serif; text-align: center; padding-top: 100px; }
              h1 { color: white; font-size: 1.8rem; }
              p { font-size: 1rem; color: #94a3b8; }
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

    let finalHtml = lead.generatedHtml;

    // Se não for modo bruto (raw) e tiver HTML completo, injetamos a Barra Comercial de Apresentação
    if (!isRaw && finalHtml.includes("</body>")) {
      let agencyName = "Flow Prospect";
      if (lead.userId) {
        const profile = await db.select().from(agentProfiles).where(eq(agentProfiles.userId, lead.userId)).get();
        if (profile?.companyName) agencyName = profile.companyName;
      }

      const safeLeadName = lead.name.replace(/"/g, "&quot;");
      const pitchBannerHtml = `
      <!-- BARRA DE APRESENTAÇÃO COMERCIAL FLOW PROSPECT -->
      <div id="flow-commercial-pitch-bar" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        background: linear-gradient(90deg, #090d16 0%, #111827 50%, #090d16 100%);
        border-bottom: 1px solid rgba(255, 255, 255, 0.12);
        color: #ffffff;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 13px;
        padding: 10px 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        z-index: 9999999;
        box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        backdrop-filter: blur(10px);
      ">
        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
          <span style="
            background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%);
            color: #ffffff;
            font-size: 11px;
            font-weight: 700;
            padding: 3px 8px;
            border-radius: 999px;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          ">
            ✨ Demonstração Exclusiva
          </span>
          <span style="color: #e2e8f0;">
            Proposta de Website desenvolvida sob medida para <strong style="color: #38bdf8;">${safeLeadName}</strong> pela equipe da <strong style="color: #ffffff;">${agencyName}</strong>.
          </span>
        </div>
        
        <div style="display: flex; align-items: center; gap: 8px;">
          <button onclick="document.getElementById('flow-commercial-pitch-bar').style.display='none'; document.body.style.marginTop='0px';" style="
            background: rgba(255,255,255,0.08);
            border: 1px solid rgba(255,255,255,0.15);
            color: #94a3b8;
            border-radius: 6px;
            padding: 5px 10px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s;
          " onmouseover="this.style.color='#fff'; this.style.borderColor='#fff'" onmouseout="this.style.color='#94a3b8'; this.style.borderColor='rgba(255,255,255,0.15)'">
            ✕ Fechar barra
          </button>
        </div>
      </div>
      <script>
        (function() {
          var bar = document.getElementById('flow-commercial-pitch-bar');
          if (bar && window.self === window.top) {
            document.body.style.marginTop = '46px';
          } else if (bar && window.self !== window.top) {
            // Embutido em iframe dentro do próprio painel do criador de sites
            bar.style.display = 'none';
          }
        })();
      </script>
      `;

      finalHtml = finalHtml.replace("</body>", `${pitchBannerHtml}</body>`);
    }

    return new Response(finalHtml, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Erro no preview do site:", error);
    return new Response("Erro interno do servidor", { status: 500 });
  }
}
