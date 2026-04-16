// Auth simplificado - sem next-auth beta para garantir compatibilidade com Vercel
import { NextRequest, NextResponse } from "next/server";

// Stub do auth para não quebrar as importações existentes
export const auth = async () => null;
export const signIn = async () => {};
export const signOut = async () => {};
export const handlers = {
  GET: () => NextResponse.json({ message: "Auth desabilitado" }),
  POST: () => NextResponse.json({ message: "Auth desabilitado" }),
};
