import "server-only";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

import {
  consumeTwoFactorChallengeRecord,
  createTrustedDeviceRecord,
  createTwoFactorChallengeRecord,
  failTwoFactorChallengeRecord,
  findTrustedDeviceRecord,
  getTwoFactorChallengeRecord,
  revokeAllTrustedDevicesRecord,
  revokeTrustedDeviceRecord,
  type TwoFactorPurpose,
} from "@/server/auth/security-repository";

import {
  sendTwoFactorCodeEmail,
} from "@/server/email/auth";

const TWO_FACTOR_DURATION_MS =
  15 * 60 * 1000;

const TRUSTED_DEVICE_DURATION_MS =
  30 * 24 * 60 * 60 * 1000;

const TRUSTED_DEVICE_COOKIE =
  "chorale_trusted_device";

function randomHex(
  length: number,
) {
  const bytes =
    new Uint8Array(length);

  crypto.getRandomValues(bytes);

  return Array.from(
    bytes,
    (byte) =>
      byte
        .toString(16)
        .padStart(2, "0"),
  ).join("");
}

function createSixDigitCode() {
  const values =
    new Uint32Array(1);

  crypto.getRandomValues(values);

  return String(
    values[0] % 1_000_000,
  ).padStart(6, "0");
}

async function hashToken(
  token: string,
) {
  const data =
    new TextEncoder().encode(
      token,
    );

  const hash =
    await crypto.subtle.digest(
      "SHA-256",
      data,
    );

  return Array.from(
    new Uint8Array(hash),
    (byte) =>
      byte
        .toString(16)
        .padStart(2, "0"),
  ).join("");
}

export function describeUserAgent(
  value: string | null,
) {
  const userAgent =
    value ?? "";

  let browser =
    "Navigateur";

  if (
    /Edg\//i.test(userAgent)
  ) {
    browser = "Edge";
  } else if (
    /Chrome\//i.test(userAgent)
  ) {
    browser = "Chrome";
  } else if (
    /Firefox\//i.test(userAgent)
  ) {
    browser = "Firefox";
  } else if (
    /Safari\//i.test(userAgent)
  ) {
    browser = "Safari";
  }

  let device =
    "Appareil";

  if (
    /iPhone/i.test(userAgent)
  ) {
    device = "iPhone";
  } else if (
    /iPad/i.test(userAgent)
  ) {
    device = "iPad";
  } else if (
    /Android/i.test(userAgent)
  ) {
    device = "Android";
  } else if (
    /Macintosh|Mac OS X/i.test(
      userAgent,
    )
  ) {
    device = "Mac";
  } else if (
    /Windows/i.test(userAgent)
  ) {
    device = "Windows";
  } else if (
    /Linux/i.test(userAgent)
  ) {
    device = "Linux";
  }

  return `${browser} · ${device}`;
}

export async function issueTwoFactorChallenge({
  userId,
  email,
  purpose,
}: {
  userId: string;
  email: string;
  purpose: TwoFactorPurpose;
}) {
  const code =
    createSixDigitCode();

  const codeHash =
    await bcrypt.hash(
      code,
      10,
    );

  const id =
    crypto.randomUUID();

  await createTwoFactorChallengeRecord({
    id,
    userId,
    purpose,
    codeHash,
    expiresAt:
      new Date(
        Date.now() +
          TWO_FACTOR_DURATION_MS,
      ).toISOString(),
  });

  await sendTwoFactorCodeEmail(
    email,
    code,
    purpose,
  );

  return {
    id,
    expiresInMinutes: 15,
  };
}

export async function resendTwoFactorChallenge(
  challengeId: string,
) {
  const current =
    await getTwoFactorChallengeRecord(
      challengeId,
    );

  if (
    !current ||
    current.status !== "active"
  ) {
    return null;
  }

  if (
    current.purpose === "login" &&
    !current.two_factor_enabled
  ) {
    return null;
  }

  return issueTwoFactorChallenge({
    userId:
      current.user_id,
    email:
      current.email,
    purpose:
      current.purpose,
  });
}

export async function verifyTwoFactorChallenge({
  challengeId,
  code,
  expectedPurpose,
  expectedUserId,
}: {
  challengeId: string;
  code: string;
  expectedPurpose: TwoFactorPurpose;
  expectedUserId?: string;
}) {
  const challenge =
    await getTwoFactorChallengeRecord(
      challengeId,
    );

  if (
    !challenge ||
    challenge.purpose !==
      expectedPurpose ||
    challenge.status !==
      "active" ||
    challenge.used_at ||
    challenge.attempts >= 5 ||
    new Date(
      challenge.expires_at,
    ).getTime() <= Date.now() ||
    (
      expectedUserId &&
      challenge.user_id !==
        expectedUserId
    )
  ) {
    return {
      ok: false as const,
      reason:
        "invalid_or_expired" as const,
    };
  }

  const valid =
    await bcrypt.compare(
      code,
      challenge.code_hash,
    );

  if (!valid) {
    await failTwoFactorChallengeRecord(
      challenge.id,
    );

    return {
      ok: false as const,
      reason:
        "invalid_code" as const,
    };
  }

  const consumed =
    await consumeTwoFactorChallengeRecord({
      id:
        challenge.id,
      userId:
        challenge.user_id,
      purpose:
        challenge.purpose,
    });

  if (!consumed.ok) {
    return {
      ok: false as const,
      reason:
        "invalid_or_expired" as const,
    };
  }

  return {
    ok: true as const,
    userId:
      challenge.user_id,
    email:
      challenge.email,
    firstname:
      challenge.firstname,
  };
}

export async function isCurrentDeviceTrusted(
  userId: string,
) {
  const cookieStore =
    await cookies();

  const token =
    cookieStore.get(
      TRUSTED_DEVICE_COOKIE,
    )?.value;

  if (!token) {
    return false;
  }

  const tokenHash =
    await hashToken(token);

  const device =
    await findTrustedDeviceRecord(
      userId,
      tokenHash,
    );

  return Boolean(device);
}

export async function trustCurrentDevice({
  userId,
  userAgent,
}: {
  userId: string;
  userAgent: string | null;
}) {
  const rawToken =
    randomHex(32);

  const tokenHash =
    await hashToken(rawToken);

  const expiresAt =
    new Date(
      Date.now() +
        TRUSTED_DEVICE_DURATION_MS,
    );

  const deviceLabel =
    describeUserAgent(
      userAgent,
    );

  await createTrustedDeviceRecord({
    id:
      crypto.randomUUID(),
    userId,
    tokenHash,
    deviceLabel,
    expiresAt:
      expiresAt.toISOString(),
  });

  const cookieStore =
    await cookies();

  cookieStore.set(
    TRUSTED_DEVICE_COOKIE,
    rawToken,
    {
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    },
  );

}

export async function revokeTrustedDevice({
  userId,
  deviceId,
}: {
  userId: string;
  deviceId: string;
}) {
  const cookieStore =
    await cookies();

  const token =
    cookieStore.get(
      TRUSTED_DEVICE_COOKIE,
    )?.value;

  if (token) {
    const tokenHash =
      await hashToken(token);

    const current =
      await findTrustedDeviceRecord(
        userId,
        tokenHash,
      );

    if (
      current?.id ===
      deviceId
    ) {
      cookieStore.delete(
        TRUSTED_DEVICE_COOKIE,
      );
    }
  }

  await revokeTrustedDeviceRecord(
    userId,
    deviceId,
  );
}

export async function revokeAllTrustedDevices(
  userId: string,
) {
  await revokeAllTrustedDevicesRecord(
    userId,
  );

  const cookieStore =
    await cookies();

  cookieStore.delete(
    TRUSTED_DEVICE_COOKIE,
  );
}

export async function clearTrustedDeviceCookie() {
  const cookieStore =
    await cookies();

  cookieStore.delete(
    TRUSTED_DEVICE_COOKIE,
  );
}
