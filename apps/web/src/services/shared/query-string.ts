type SearchParamValue = string | string[] | undefined;

export type SearchParamsInput = Record<string, SearchParamValue>;

export function getSingleSearchParam(value: SearchParamValue): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export function getNumberSearchParam(
  value: SearchParamValue,
  fallback: number,
): number {
  const parsed = Number(getSingleSearchParam(value));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function createSearchParams(
  current: SearchParamsInput,
  updates: Record<string, string | number | boolean | undefined | null>,
): string {
  const params = new URLSearchParams();

  for (const [key, rawValue] of Object.entries(current)) {
    const value = getSingleSearchParam(rawValue);

    if (value !== undefined && value.length > 0) {
      params.set(key, value);
    }
  }

  for (const [key, rawValue] of Object.entries(updates)) {
    if (rawValue === undefined || rawValue === null || rawValue === "") {
      params.delete(key);
      continue;
    }

    params.set(key, String(rawValue));
  }

  const query = params.toString();
  return query.length === 0 ? "" : `?${query}`;
}
