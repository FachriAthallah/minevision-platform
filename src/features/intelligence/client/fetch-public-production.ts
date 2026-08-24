import type {
  ProductionApiResponse,
  PublicProductionRecord,
} from "../types/production";

type FetchPublicProductionInput = {
  commodity: string;
  fromYear?: number;
  toYear?: number;
  signal?: AbortSignal;
};

export async function fetchPublicProduction({
  commodity,
  fromYear,
  toYear,
  signal,
}: FetchPublicProductionInput): Promise<PublicProductionRecord[]> {
  const searchParams = new URLSearchParams({
    commodity,
  });

  if (fromYear !== undefined) {
    searchParams.set("fromYear", String(fromYear));
  }

  if (toYear !== undefined) {
    searchParams.set("toYear", String(toYear));
  }

  const response = await fetch(
    `/api/v1/intelligence/production?${searchParams.toString()}`,
    {
      headers: {
        Accept: "application/json",
      },
      signal,
    },
  );

  const payload = (await response.json()) as ProductionApiResponse;

  if (!response.ok || !payload.success) {
    throw new Error(
      payload.success
        ? "Data produksi gagal dimuat."
        : payload.error.message,
    );
  }

  return payload.data;
}
