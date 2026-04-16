import { db } from "../src/lib/db";
import { leads } from "../src/lib/schema";
import { sql } from "drizzle-orm";

async function clearLeads() {
  console.log("Iniciando limpeza total de leads...");
  try {
    const result = await db.delete(leads);
    console.log("Banco de dados resetado com sucesso!");
  } catch (error) {
    console.error("Erro ao limpar banco de dados:", error);
    process.exit(1);
  }
}

clearLeads();
