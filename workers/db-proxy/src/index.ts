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

import {
  createCalendarEvent,
  deleteCalendarEvent,
  getCalendarEvent,
  listCalendarEvents,
  splitCalendarSeries,
  truncateCalendarSeries,
  updateCalendarEvent,
  upsertCalendarException,
} from "./calendar";

import { createImportedCalendarEvents } from "./calendar-import";

import {
  approveMemberUser,
  createMember,
  deleteMember,
  importMembers,
  listMembers,
  rejectMemberUser,
  updateMember,
} from "./members";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (!isAuthorized(request, env)) {
      return json(
        {
          error: "Unauthorized",
        },
        401,
      );
    }

    try {
      const url = new URL(request.url);

      if (request.method === "GET" && url.pathname === "/health") {
        const dbResult = await env.DB.prepare("SELECT 1 AS ok").first<{
          ok: number;
        }>();

        await env.PUBLIC_STORAGE.list({
          limit: 1,
        });

        await env.PRIVATE_STORAGE.list({
          limit: 1,
        });

        return json({
          ok: dbResult?.ok === 1,

          services: {
            d1: dbResult?.ok === 1,

            public_storage: true,

            private_storage: true,
          },
        });
      }

      /*
       * MEMBERS
       */

      if (request.method === "GET" && url.pathname === "/v1/members") {
        return listMembers(request, env);
      }

      if (request.method === "POST" && url.pathname === "/v1/members") {
        return createMember(request, env);
      }

      if (request.method === "PATCH" && url.pathname === "/v1/members") {
        return updateMember(request, env);
      }

      if (request.method === "DELETE" && url.pathname === "/v1/members") {
        return deleteMember(request, env);
      }

      if (
        request.method === "POST" &&
        url.pathname === "/v1/members/approve-user"
      ) {
        return approveMemberUser(request, env);
      }

      if (
        request.method === "POST" &&
        url.pathname === "/v1/members/reject-user"
      ) {
        return rejectMemberUser(request, env);
      }

      if (request.method === "POST" && url.pathname === "/v1/members/import") {
        return importMembers(request, env);
      }

      /*
       * CALENDAR
       */

      if (request.method === "GET" && url.pathname === "/v1/calendar-events") {
        return listCalendarEvents(request, env);
      }

      if (
        request.method === "POST" &&
        url.pathname === "/v1/calendar-events/by-id"
      ) {
        return getCalendarEvent(request, env);
      }

      if (request.method === "POST" && url.pathname === "/v1/calendar-events") {
        return createCalendarEvent(request, env);
      }

      if (
        request.method === "POST" &&
        url.pathname === "/v1/calendar-events/import"
      ) {
        return createImportedCalendarEvents(request, env);
      }

      if (
        request.method === "PATCH" &&
        url.pathname === "/v1/calendar-events"
      ) {
        return updateCalendarEvent(request, env);
      }

      if (
        request.method === "DELETE" &&
        url.pathname === "/v1/calendar-events"
      ) {
        return deleteCalendarEvent(request, env);
      }

      if (
        request.method === "POST" &&
        url.pathname === "/v1/calendar-exceptions"
      ) {
        return upsertCalendarException(request, env);
      }

      if (
        request.method === "POST" &&
        url.pathname === "/v1/calendar-events/truncate"
      ) {
        return truncateCalendarSeries(request, env);
      }

      if (
        request.method === "POST" &&
        url.pathname === "/v1/calendar-events/split"
      ) {
        return splitCalendarSeries(request, env);
      }

      /*
       * EMAILS
       */

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

      /*
       * USERS
       */

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

      /*
       * SESSIONS
       */

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

      /*
       * PASSWORD RESET
       */

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

      return json(
        {
          error: "Not found",
        },
        404,
      );
    } catch (error) {
      console.error(error);

      return json(
        {
          error: "Internal server error",
        },
        500,
      );
    }
  },
};
