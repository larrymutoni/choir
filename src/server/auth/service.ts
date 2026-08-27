import bcrypt from "bcryptjs";
import { createUserSession } from "@/server/auth/session";
import {
  createUser,
  findUserByEmail,
  isEmailAuthorized,
  listUsers,
  updateUserRole,
  updateUserStatus,
  updateUserProfile as updateUserProfileRecord,
} from "@/server/auth/repository";

export type RegisterInput = {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  phone?: string | null;
};

export async function registerUser(input: RegisterInput) {
  const email = input.email.trim().toLowerCase();

  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    return {
      ok: false as const,
      reason: "already_exists" as const,
    };
  }

  const authorized = await isEmailAuthorized(email);

  const passwordHash = await bcrypt.hash(input.password, 12);
  const status = authorized ? "active" : "pending";
  const id = crypto.randomUUID();

  await createUser({
    id,
    firstname: input.firstname.trim(),
    lastname: input.lastname.trim(),
    email,
    passwordHash,
    phone: input.phone?.trim() || null,
    role: "member",
    status,
  });

  if (status === "active") {
    await createUserSession(id);
  }

  return {
    ok: true as const,
    userId: id,
    status,
  };
}

export async function loginUser(emailInput: string, password: string) {
  const email = emailInput.trim().toLowerCase();

  const user = await findUserByEmail(email);

  if (!user) {
    return {
      ok: false as const,
      reason: "invalid_credentials" as const,
    };
  }

  const passwordValid = await bcrypt.compare(password, user.passwordHash);

  if (!passwordValid) {
    return {
      ok: false as const,
      reason: "invalid_credentials" as const,
    };
  }

  if (user.status === "pending") {
    return {
      ok: false as const,
      reason: "pending" as const,
    };
  }

  if (user.status === "rejected") {
    return {
      ok: false as const,
      reason: "rejected" as const,
    };
  }

  await createUserSession(user.id);

  return {
    ok: true as const,
    user: {
      id: user.id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      role: user.role,
    },
  };
}

export async function getUsersForAdmin() {
  return listUsers();
}

export async function setUserApprovalStatus(
  userId: string,
  status: "active" | "rejected",
) {
  return updateUserStatus(userId, status);
}
export async function setUserRole(
  userId: string,
  role: "member" | "admin" | "super_admin",
) {
  return updateUserRole(userId, role);
}

export async function getMemberProfile(email: string) {
  const user = await findUserByEmail(email);

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    firstname: user.firstname,
    lastname: user.lastname,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
  };
}

export async function updateMemberProfile(
  userId: string,
  input: {
    firstname: string;
    lastname: string;
    phone?: string | null;
  },
) {
  return updateUserProfileRecord(userId, input);
}
