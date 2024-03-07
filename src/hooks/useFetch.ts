// useFetch.ts
import useSWR from "swr";

const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL;
const X_API_KEY = process.env.NEXT_PUBLIC_X_API_KEY;

const fetcher = async (url: string) => {
  try {
    const response = await fetch(`${NEXT_PUBLIC_API_URL}/${url}`, {
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": X_API_KEY,
      } as any,
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();

    return data;
  } catch (error) {
    // Handle errors (e.g., network issues)
    console.error("Error fetching data:", error);
    throw error;
  }
};

export function useQuery<Data = any>(url: string) {
  const { data, error, isValidating, mutate } = useSWR<Data>(
    url ? `${url}` : null,
    fetcher
  );

  return {
    data,
    error,
    isLoading: !data && !error,
    isValidating,
    mutate,
  };
}
