import { Env, isAuthorized, json } from "./http";
import {
  checkAuthorizedEmail,
  createUser,
  findUserByEmail,
  listUsers,
  updateUserProfile,
  updateUserRole,
  updateUserStatus,
} from "./users";
import {
  addAuthorizedEmail,
  deleteAuthorizedEmail,
  listAuthorizedEmails,
} from "./emails";
import { createSession, deleteSession, findSession } from "./sessions";
import {
  consumePasswordResetToken,
  createPasswordResetToken,
  findPasswordResetToken,
} from "./password-resets";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (!isAuthorized(request, env)) {
      return json({ error: "Unauthorized" }, 401);
    }

    try {
      const url = new URL(request.url);

      if (request.method === "GET" && url.pathname === "/health") {
        const dbResult = await env.DB.prepare("SELECT 1 AS ok").first<{
          ok: number;
        }>();

        await env.PUBLIC_STORAGE.list({ limit: 1 });
        await env.PRIVATE_STORAGE.list({ limit: 1 });

        return json({
          ok: dbResult?.ok === 1,
          services: {
            d1: dbResult?.ok === 1,
            public_storage: true,
            private_storage: true,
          },
        });
      }

      if (
        request.method === "POST" &&
        url.pathname === "/v1/emails/authorized"
      ) {
        return checkAuthorizedEmail(request, env);
      }

      if (request.method === "GET" && url.pathname === "/v1/emails") {
        return listAuthorizedEmails(request, env);
      }

      if (request.method === "POST" && url.pathname === "/v1/emails") {
        return addAuthorizedEmail(request, env);
      }

      if (request.method === "DELETE" && url.pathname === "/v1/emails") {
        return deleteAuthorizedEmail(request, env);
      }

      if (request.method === "POST" && url.pathname === "/v1/users/by-email") {
        return findUserByEmail(request, env);
      }

      if (request.method === "GET" && url.pathname === "/v1/users") {
        return listUsers(request, env);
      }

      if (request.method === "POST" && url.pathname === "/v1/users") {
        return createUser(request, env);
      }

      if (request.method === "PATCH" && url.pathname === "/v1/users/status") {
        return updateUserStatus(request, env);
      }

      if (request.method === "PATCH" && url.pathname === "/v1/users/role") {
        return updateUserRole(request, env);
      }

      if (request.method === "PATCH" && url.pathname === "/v1/users/profile") {
        return updateUserProfile(request, env);
      }

      if (request.method === "POST" && url.pathname === "/v1/sessions") {
        return createSession(request, env);
      }

      if (
        request.method === "POST" &&
        url.pathname === "/v1/sessions/by-token"
      ) {
        return findSession(request, env);
      }

      if (request.method === "DELETE" && url.pathname === "/v1/sessions") {
        return deleteSession(request, env);
      }

      if (request.method === "POST" && url.pathname === "/v1/password-resets") {
        return createPasswordResetToken(request, env);
      }

      if (
        request.method === "POST" &&
        url.pathname === "/v1/password-resets/by-token"
      ) {
        return findPasswordResetToken(request, env);
      }

      if (
        request.method === "POST" &&
        url.pathname === "/v1/password-resets/consume"
      ) {
        return consumePasswordResetToken(request, env);
      }

      return json({ error: "Not found" }, 404);
    } catch (error) {
      console.error(error);

      return json({ error: "Internal server error" }, 500);
    }
  },
};
