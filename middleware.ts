import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secretKey = process.env.AUTH_SECRET || "default_super_secret_for_flowtech_123!";
const key = new TextEncoder().encode(secretKey);

// Rotas que não precisam de login
const publicRoutes = ["/login", "/api/sync"];

// Rotas exclusivas para admin
const adminRoutes = ["/admin"];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  
  // Liberar arquivos estáticos e imagens
  if (path.startsWith("/_next") || path.startsWith("/static") || path.match(/\.(png|jpg|jpeg|svg|ico)$/)) {
    return NextResponse.next();
  }

  const isPublicRoute = publicRoutes.some(route => path.startsWith(route));
  const cookie = req.cookies.get("session")?.value;

  let session = null;

  if (cookie) {
    try {
      const { payload } = await jwtVerify(cookie, key, { algorithms: ["HS256"] });
      session = payload;
    } catch (err) {
      // Invalida cookie mal formatado
    }
  }

  // Redireciona usuários deslogados tentando acessar rotas privadas
  if (!isPublicRoute && !session) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  // Redireciona usuários logados tentando acessar login
  if (path === "/login" && session) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  // Protege a rota /admin para garantir que apenas administradores acessem
  const isAdminRoute = adminRoutes.some(route => path.startsWith(route));
  if (isAdminRoute && session?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
