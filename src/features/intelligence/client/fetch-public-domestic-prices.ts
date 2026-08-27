import type {
  DomesticPriceApiResponse,
  DomesticPricePeriod,
  PublicDomesticPriceRecord,
} from "../types/domestic-price";

type FetchPublicDomesticPricesInput = {
  commodity: string;
  standard?: string;
  fromDate?: string;
  toDate?: string;
  period?: DomesticPricePeriod;
  signal?: AbortSignal;
};

export async function fetchPublicDomesticPrices({
  commodity,
  standard,
  fromDate,
  toDate,
  period,
  signal,
}: FetchPublicDomesticPricesInput): Promise<PublicDomesticPriceRecord[]> {
  const searchParams = new URLSearchParams({
    commodity,
  });

  if (standard !== undefined) {
    searchParams.set("standard", standard);
  }

  if (fromDate !== undefined) {
    searchParams.set("fromDate", fromDate);
  }

  if (toDate !== undefined) {
    searchParams.set("toDate", toDate);
  }

  if (period !== undefined) {
    searchParams.set("period", period);
  }

  const response = await fetch(
    `/api/v1/intelligence/prices?${searchParams.toString()}`,
    {
      headers: {
        Accept: "application/json",
      },
      signal,
    },
  );

  const payload = (await response.json()) as DomesticPriceApiResponse;

  if (!response.ok || !payload.success) {
    throw new Error(
      payload.success
        ? "Data harga domestik gagal dimuat."
        : payload.error.message,
    );
  }

  return payload.data;
}
