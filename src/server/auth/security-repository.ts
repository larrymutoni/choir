import { dbRequest } from "@/server/db/client";

export type TwoFactorPurpose =
  | "login"
  | "enable"
  | "disable";

export type TrustedDevice = {
  id: string;
  device_label: string;
  expires_at: string;
  last_used_at: string;
  created_at: string;
};

export type SecurityState = {
  twoFactorEnabled: boolean;
  trustedDevices: TrustedDevice[];
};

export type TwoFactorChallenge = {
  id: string;
  user_id: string;
  purpose: TwoFactorPurpose;
  code_hash: string;
  expires_at: string;
  used_at: string | null;
  attempts: number;
  created_at: string;
  email: string;
  firstname: string;
  status: string;
  two_factor_enabled: number;
};

export async function getSecurityState(
  userId: string,
) {
  return dbRequest<SecurityState>(
    `/v1/security?userId=${encodeURIComponent(userId)}`,
    {
      method: "GET",
    },
  );
}

export async function createTwoFactorChallengeRecord(
  input: {
    id: string;
    userId: string;
    purpose: TwoFactorPurpose;
    codeHash: string;
    expiresAt: string;
  },
) {
  return dbRequest<{ ok: true }>(
    "/v1/security/challenges",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export async function getTwoFactorChallengeRecord(
  id: string,
) {
  const result =
    await dbRequest<{
      challenge:
        | TwoFactorChallenge
        | null;
    }>(
      "/v1/security/challenges/get",
      {
        method: "POST",
        body: JSON.stringify({ id }),
      },
    );

  return result.challenge;
}

export async function failTwoFactorChallengeRecord(
  id: string,
) {
  return dbRequest<{ ok: true }>(
    "/v1/security/challenges/fail",
    {
      method: "PATCH",
      body: JSON.stringify({ id }),
    },
  );
}

export async function consumeTwoFactorChallengeRecord(
  input: {
    id: string;
    userId: string;
    purpose: TwoFactorPurpose;
  },
) {
  return dbRequest<{ ok: boolean }>(
    "/v1/security/challenges/consume",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export async function updateTwoFactorStateRecord(
  userId: string,
  enabled: boolean,
) {
  return dbRequest<{ ok: true }>(
    "/v1/security/two-factor",
    {
      method: "PATCH",
      body: JSON.stringify({
        userId,
        enabled,
      }),
    },
  );
}

export async function createTrustedDeviceRecord(
  input: {
    id: string;
    userId: string;
    tokenHash: string;
    deviceLabel: string;
    expiresAt: string;
  },
) {
  return dbRequest<{ ok: true }>(
    "/v1/security/trusted-devices",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export async function findTrustedDeviceRecord(
  userId: string,
  tokenHash: string,
) {
  const result =
    await dbRequest<{
      device:
        | TrustedDevice
        | null;
    }>(
      "/v1/security/trusted-devices/by-token",
      {
        method: "POST",
        body: JSON.stringify({
          userId,
          tokenHash,
        }),
      },
    );

  return result.device;
}

export async function revokeTrustedDeviceRecord(
  userId: string,
  id: string,
) {
  return dbRequest<{ ok: true }>(
    "/v1/security/trusted-devices",
    {
      method: "DELETE",
      body: JSON.stringify({
        userId,
        id,
      }),
    },
  );
}

export async function revokeAllTrustedDevicesRecord(
  userId: string,
) {
  return dbRequest<{ ok: true }>(
    "/v1/security/trusted-devices",
    {
      method: "DELETE",
      body: JSON.stringify({
        userId,
        all: true,
      }),
    },
  );
}
