export function contentArrayToMap(
  content: { key: string; value: string }[] | null,
) {
  return (content ?? []).reduce<Record<string, string>>((acc, item) => {
    acc[item.key] = item.value;
    return acc;
  }, {});
}
