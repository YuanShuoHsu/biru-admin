// https://swr.vercel.app/docs/error-handling

interface ErrorInfo {
  message: string;
  documentation_url?: string;
}

interface FetchError extends Error {
  info: ErrorInfo;
  status: number;
}

export const fetcher = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    const error = new Error(
      "An error occurred while fetching the data.",
    ) as FetchError;

    error.info = await res.json();
    error.status = res.status;
    throw error;
  }

  return res.json();
};
