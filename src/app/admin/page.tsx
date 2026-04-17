import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { verifySession } from "@/lib/session";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ShieldCheck, UserPlus, Users, Trash2 } from "lucide-react";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

// --- Server Actions internas para esta página ---
async function addUser(formData: FormData) {
  "use server";
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const rawPassword = formData.get("password") as string;
  const role = formData.get("role") as "ADMIN" | "USER";

  if (!name || !email || !rawPassword) return;

  const session = await verifySession();
  if (session?.role !== "ADMIN") return;

  const password = await bcrypt.hash(rawPassword, 10);

  await db.insert(users).values({ name, email, password, role }).onConflictDoNothing();
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

  const allUsers = await db.select().from(users);

  return (
    <div className="container mx-auto px-4 max-w-5xl">
      <div className="flex flex-col gap-6 pt-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold flex items-center gap-3">
              <ShieldCheck className="text-amber-500" />
              Painel do Administrador
            </h1>
            <p className="text-muted mt-2">Gerencie os acessos ao sistema FlowTech</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-4">
          <div className="glass p-6 md:col-span-1 rounded-xl h-fit border border-white/5">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
              <UserPlus className="text-primary" />
              Novo Usuário
            </h2>
            <form action={addUser} className="space-y-4">
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
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>
              <button type="submit" className="premium-btn w-full py-2 mt-4 text-sm">Criar Conta</button>
            </form>
          </div>

          <div className="glass p-0 md:col-span-2 rounded-xl overflow-hidden border border-white/5">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Users className="text-primary" />
                Usuários Cadastrados
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-muted">
                <thead className="bg-white/5 text-xs text-white">
                  <tr>
                    <th className="px-6 py-4 font-medium">Nome</th>
                    <th className="px-6 py-4 font-medium">Email</th>
                    <th className="px-6 py-4 font-medium">Permissão</th>
                    <th className="px-6 py-4 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {allUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-white font-medium">{u.name}</td>
                      <td className="px-6 py-4">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${u.role === 'ADMIN' ? 'bg-amber-500/20 text-amber-500' : 'bg-primary/20 text-primary'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {u.id !== session.userId && (
                          <form action={deleteUser} className="inline">
                            <input type="hidden" name="id" value={u.id} />
                            <button type="submit" className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-400/10 transition-colors" title="Excluir usuário">
                              <Trash2 size={16} />
                            </button>
                          </form>
                        )}
                        {u.id === session.userId && (
                          <span className="text-xs text-muted block py-2 px-2">Usuário Atual</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {allUsers.length === 0 && (
                     <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-muted">Nenhum usuário encontrado.</td>
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
