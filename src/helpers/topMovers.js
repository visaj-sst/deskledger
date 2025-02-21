import NodeCache from "node-cache";
export const BSE_API_URL =
  "https://images.livemint.com/markets/prod/bse_gainerloser.json";

export const cache = new NodeCache({ stdTTL: 5, checkperiod: 1 });

export const fetchWithTimeout = async (url, timeout = 10000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};
