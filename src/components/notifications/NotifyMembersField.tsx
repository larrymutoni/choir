"use client";

type NotifyMembersFieldProps = {
  checked: boolean;
  onCheckedChange: (
    checked: boolean,
  ) => void;
  disabled?: boolean;
};

export function NotifyMembersField({
  checked,
  onCheckedChange,
  disabled = false,
}: NotifyMembersFieldProps) {
  return (
    <label className="flex cursor-pointer items-center gap-3 py-1">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) =>
          onCheckedChange(
            event.target.checked,
          )
        }
        className="h-4 w-4 cursor-pointer rounded border-zinc-300 accent-zinc-900 disabled:cursor-not-allowed"
      />

      <span className="text-sm font-medium text-zinc-800">
        Envoyer un email aux membres
      </span>
    </label>
  );
}
