import { db } from "./src/lib/db";
import { users, leads } from "./src/lib/schema";

async function seed() {
  console.log("Seeding database...");

  // Criar usuário Admin padrão
  await db.insert(users).values({
    name: "Admin User",
    email: "admin@prospeccao.com",
    password: "admin", // Em produção, usar hash
    role: "ADMIN",
  }).onConflictDoNothing();

  // Criar alguns leads de exemplo
  await db.insert(leads).values([
    {
      name: "Mecânica Precision",
      phone: "(11) 99999-0001",
      website: "https://precisionmecanica.com.br",
      address: "Rua das Oficinas, 123 - Americana",
      type: "Mecânica",
      rating: "4.8",
      place_id: "place_01",
      review_summary: "Ótimo atendimento, especialistas em motores.",
    },
    {
      name: "Auto Peças Central",
      phone: "(11) 98888-0002",
      website: "https://autopecascentral.com",
      address: "Av. do Varejo, 456 - Americana",
      type: "Varejo Autopeças",
      rating: "4.2",
      place_id: "place_02",
      review_summary: "Estoque completo mas preço acima da média.",
    }
  ]).onConflictDoNothing();

  console.log("Seed concluído com sucesso!");
}

seed().catch(console.error);
