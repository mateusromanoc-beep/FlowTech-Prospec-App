import { db } from "@/lib/db";
import { users, leads } from "@/lib/schema";
import { verifySession } from "@/lib/session";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ShieldCheck, UserPlus, Users, Trash2, Eye } from "lucide-react";
import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import Link from "next/link";

// --- Server Actions internas para esta página ---
async function updateUserPlan(formData: FormData) {
  "use server";
  const idValue = formData.get("id");
  const plan = formData.get("plan") as "STARTER" | "GROWTH" | "UNLIMITED";
  if (!idValue || !plan) return;
  
  const id = parseInt(idValue.toString(), 10);
  const session = await verifySession();
  if (session?.role !== "ADMIN") return;

  await db.update(users).set({ plan }).where(eq(users.id, id));
  revalidatePath("/admin");
}

async function addUser(formData: FormData) {
  "use server";
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const rawPassword = formData.get("password") as string;
  const role = formData.get("role") as "ADMIN" | "USER" | "USER_PRO";
  const plan = (formData.get("plan") as "STARTER" | "GROWTH" | "UNLIMITED") || "STARTER";

  if (!name || !email || !rawPassword) return;

  const session = await verifySession();
  if (session?.role !== "ADMIN") return;

  const password = await bcrypt.hash(rawPassword, 10);

  await db.insert(users).values({ name, email, password, role, plan }).onConflictDoNothing();
  revalidatePath("/admin");
}

async function deleteUser(formData: FormData) {
  "use server";
  const idValue = formData.get("id");
  if (!idValue) return;
  const id = parseInt(idValue.toString(), 10);

  const session = await verifySession();
  if (session?.role !== "ADMIN") return;

  // Proteção: não se deletar
  if (id === session.userId) return;

  await db.delete(users).where(eq(users.id, id));
  revalidatePath("/admin");
}

export default async function AdminPage() {
  const session = await verifySession();

  // Redundância de segurança na UI
  if (session?.role !== "ADMIN") {
    redirect("/");
  }

  // Buscar todos os usuários com a contagem total de leads capturados
  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      plan: users.plan,
      createdAt: users.createdAt,
      totalLeads: sql<number>`count(${leads.id})`.as("total_leads"),
    })
    .from(users)
    .leftJoin(leads, eq(users.id, leads.userId))
    .groupBy(users.id);

  return (
    <div className="container mx-auto px-4 max-w-5xl">
      <div className="flex flex-col gap-6 pt-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold flex items-center gap-3">
              <ShieldCheck className="text-amber-500" />
              Painel do Administrador
            </h1>
            <p className="text-muted mt-2">Gerencie os acessos e audite as prospecções de cada usuário</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-4">
          <div className="glass p-6 md:col-span-1 rounded-xl h-fit border border-white/5">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
              <UserPlus className="text-primary" />
              Novo Usuário
            </h2>
            <form action={addUser} className="flex flex-col gap-5">
              <div>
                <label className="text-xs text-muted mb-1 block">Nome Completo</label>
                <input name="name" type="text" required className="w-full text-sm p-3 rounded bg-white/5 border border-white/10" placeholder="João Silva" />
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">Email</label>
                <input name="email" type="email" required className="w-full text-sm p-3 rounded bg-white/5 border border-white/10" placeholder="joao@empresa.com" />
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">Senha</label>
                <input name="password" type="text" required className="w-full text-sm p-3 rounded bg-white/5 border border-white/10" placeholder="Senha123" />
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">Tipo de Acesso</label>
                <select name="role" className="w-full text-sm p-3 rounded bg-[#1e1f26] border border-white/10 text-white">
                  <option value="USER">Usuário Comum</option>
                  <option value="USER_PRO">Usuário Pro</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">Plano</label>
                <select name="plan" className="w-full text-sm p-3 rounded bg-[#1e1f26] border border-white/10 text-white">
                  <option value="STARTER">Starter (500 leads)</option>
                  <option value="GROWTH">Growth (1000 leads)</option>
                  <option value="UNLIMITED">Unlimited (Ilimitado)</option>
                </select>
              </div>
              <button type="submit" className="premium-btn w-full py-2 mt-4 text-sm">Criar Conta</button>
            </form>
          </div>

          <div className="glass p-0 md:col-span-2 rounded-xl overflow-hidden border border-white/5">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Users className="text-primary" />
                Usuários Cadastrados
              </h2>
              <Link 
                href="/leads?userId=all" 
                className="text-xs flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-3 py-1.5 rounded-lg transition-colors font-semibold"
              >
                <Eye size={14} /> Ver Todos os Leads do Sistema
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-muted">
                <thead className="bg-white/5 text-xs text-white">
                  <tr>
                    <th className="px-6 py-4 font-medium">Nome</th>
                    <th className="px-6 py-4 font-medium">Email</th>
                    <th className="px-6 py-4 font-medium">Permissão</th>
                    <th className="px-6 py-4 font-medium">Plano</th>
                    <th className="px-6 py-4 font-medium text-center">Leads</th>
                    <th className="px-6 py-4 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {allUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-white font-medium">{u.name}</td>
                      <td className="px-6 py-4">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${u.role === 'ADMIN' ? 'bg-amber-500/20 text-amber-500' : u.role === 'USER_PRO' ? 'bg-purple-500/20 text-purple-400' : 'bg-primary/20 text-primary'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <form action={updateUserPlan} className="inline-flex items-center gap-2">
                          <input type="hidden" name="id" value={u.id} />
                          <select 
                            name="plan" 
                            defaultValue={u.plan} 
                            className="bg-black/20 border border-white/10 rounded px-2 py-1 text-xs text-white/80 outline-none hover:bg-white/5 transition-colors cursor-pointer"
                          >
                            <option value="STARTER">Starter</option>
                            <option value="GROWTH">Growth</option>
                            <option value="UNLIMITED">Unlimited</option>
                          </select>
                          <button type="submit" className="text-[10px] uppercase font-bold bg-white/5 hover:bg-white/10 text-white/70 px-2 py-1 rounded transition-colors border border-white/10">
                            Salvar
                          </button>
                        </form>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-semibold text-white px-2 py-1 rounded bg-white/5 text-xs">
                          {u.totalLeads || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Link 
                            href={`/leads?userId=${u.id}`}
                            className="text-xs bg-primary/15 hover:bg-primary/30 text-primary border border-primary/30 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 font-medium"
                            title={`Ver leads prospectados por ${u.name}`}
                          >
                            <Eye size={13} />
                            Ver Leads
                          </Link>

                          {u.id !== session.userId && (
                            <form action={deleteUser} className="inline">
                              <input type="hidden" name="id" value={u.id} />
                              <button type="submit" className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-400/10 transition-colors" title="Excluir usuário">
                                <Trash2 size={16} />
                              </button>
                            </form>
                          )}
                          {u.id === session.userId && (
                            <span className="text-xs text-muted block py-1 px-1">Você</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {allUsers.length === 0 && (
                     <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-muted">Nenhum usuário encontrado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
