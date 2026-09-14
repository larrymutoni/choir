export type MemberUpdateArea =
  | "calendar"
  | "resources";

export async function publishMemberUpdate(
  area: MemberUpdateArea,
  sendEmail = false,
) {
  try {
    const response = await fetch(
      "/api/member/notifications/publish",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          area,
          sendEmail,
        }),
      },
    );

    if (!response.ok) {
      console.error(
        "Member notification failed:",
        await response.text(),
      );

      return false;
    }

    return true;
  } catch (error) {
    console.error(
      "Member notification failed:",
      error,
    );

    return false;
  }
}