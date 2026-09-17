import { handlers } from "@/auth";
import { NextRequest } from "next/server";

export const runtime = 'edge';

export const GET = handlers.GET;
export const POST = handlers.POST;
