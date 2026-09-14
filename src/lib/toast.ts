export type ToastTone =
  | "success"
  | "error"
  | "warning";

export type ToastDetail = {
  message: string;
  tone: ToastTone;
};

export function showToast(
  message: string,
  tone: ToastTone = "success",
) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<ToastDetail>(
      "chorale:toast",
      {
        detail: {
          message,
          tone,
        },
      },
    ),
  );
}
