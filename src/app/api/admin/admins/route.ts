import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import {
  DEFAULT_ADMIN_PERMISSIONS,
  SUPER_ADMIN_PERMISSIONS,
  requireSuperAdmin,
  type AdminPermissions,
} from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const permissionsSchema = z.object({
  content: z.boolean(),
  images: z.boolean(),
  gallery: z.boolean(),
  events: z.boolean(),
  settings: z.boolean(),
  admins: z.boolean(),
});

const createAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["admin", "super_admin"]).default("admin"),
  permissions: permissionsSchema.default(DEFAULT_ADMIN_PERMISSIONS),
});

const updateAdminSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(["admin", "super_admin"]),
  permissions: permissionsSchema,
});

const deleteAdminSchema = z.object({
  id: z.string().uuid(),
});

export async function GET() {
  await requireSuperAdmin();

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("admin_users")
    .select("id, email, role, permissions, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    admins: data,
  });
}

export async function POST(request: Request) {
  await requireSuperAdmin();

  const body = await request.json();
  const parsed = createAdminSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid admin data." },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  const permissions: AdminPermissions =
    parsed.data.role === "super_admin"
      ? SUPER_ADMIN_PERMISSIONS
      : parsed.data.permissions;

  const { error } = await supabase.from("admin_users").insert({
    email: parsed.data.email.toLowerCase(),
    password_hash: passwordHash,
    role: parsed.data.role,
    permissions,
  });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    message: "Admin created.",
  });
}

export async function PUT(request: Request) {
  const currentAdmin = await requireSuperAdmin();

  const body = await request.json();
  const parsed = updateAdminSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid admin update data." },
      { status: 400 },
    );
  }

  if (
    parsed.data.id === currentAdmin.id &&
    parsed.data.role !== "super_admin"
  ) {
    return NextResponse.json(
      { message: "You cannot remove your own super admin role." },
      { status: 400 },
    );
  }

  const permissions: AdminPermissions =
    parsed.data.role === "super_admin"
      ? SUPER_ADMIN_PERMISSIONS
      : parsed.data.permissions;

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("admin_users")
    .update({
      role: parsed.data.role,
      permissions,
    })
    .eq("id", parsed.data.id);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    message: "Admin updated.",
  });
}

export async function DELETE(request: Request) {
  const currentAdmin = await requireSuperAdmin();

  const body = await request.json();
  const parsed = deleteAdminSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid admin delete data." },
      { status: 400 },
    );
  }

  if (parsed.data.id === currentAdmin.id) {
    return NextResponse.json(
      { message: "You cannot delete your own account." },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("admin_users")
    .delete()
    .eq("id", parsed.data.id);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    message: "Admin deleted.",
  });
}
