"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/session";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email e senha são obrigatórios" };
  }

  // Busca o usuário no banco de dados
  const userList = await db.select().from(users).where(eq(users.email, email));
  const user = userList[0];

  if (!user) {
    return { error: "Credenciais inválidas" };
  }

  // Verifica a senha via bcrypt
  const isValid = await bcrypt.compare(password, user.password);

  if (!isValid) {
    return { error: "Credenciais inválidas" };
  }

  // Cria a sessão se estiver tudo certo
  await createSession(user.id, user.role, user.name);
  
  redirect("/");
}
