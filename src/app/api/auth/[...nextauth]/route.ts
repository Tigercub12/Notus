import { handlers } from "@/auth";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { NextRequest } from "next/server";

export const runtime = 'edge';

const wrapHandler = (handler: any) => {
  return async (req: NextRequest, ctx: any) => {
    const cfCtx = getRequestContext();
    if (cfCtx && cfCtx.env) {
      if (typeof process === 'undefined') {
        (globalThis as any).process = { env: {} };
      } else if (!process.env) {
        process.env = {} as any;
      }
      if (cfCtx.env.AUTH_SECRET) process.env.AUTH_SECRET = cfCtx.env.AUTH_SECRET as string;
      if (cfCtx.env.GOOGLE_CLIENT_ID) process.env.GOOGLE_CLIENT_ID = cfCtx.env.GOOGLE_CLIENT_ID as string;
      if (cfCtx.env.GOOGLE_CLIENT_SECRET) process.env.GOOGLE_CLIENT_SECRET = cfCtx.env.GOOGLE_CLIENT_SECRET as string;
      if (cfCtx.env.AUTH_URL) process.env.AUTH_URL = cfCtx.env.AUTH_URL as string;
    }
    return handler(req, ctx);
  };
};

export const GET = wrapHandler(handlers.GET);
export const POST = wrapHandler(handlers.POST);
