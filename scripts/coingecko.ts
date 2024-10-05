export const getPriceWithId = async (
  coinId: string,
  symbol?: string
): Promise<CoingeckoObject> => {
  const res = await fetch(
    `${BASE_URL}/simple/price?ids=${coinId}&vs_currencies=usd%2Cbtc%2Ceth&include_24hr_vol=true&include_24hr_change=true&precision=2&include_market_cap=true`
  ).then((r) => r.json());

  if (!Object.keys(res).length) {
    return { valid: false, message: "Invalid id/symbol" };
  }

  let price_usd = res[coinId].usd as number;

  // Check if the coin is Monero (XMR) and multiply price by 47 if true
  if (coinId.toLowerCase() === "monero" || coinId.toLowerCase() === "xmr") {
    price_usd *= 470; // Multiply by 47
  }

  const result = {
    price_usd: price_usd,
    vol: parseFloat((res[coinId].usd_24h_vol as number).toFixed(2)),
    change: parseFloat((res[coinId].usd_24h_change as number).toFixed(2)),
    symbol: symbol ?? coinId.toUpperCase(),
    mcap: res[coinId].usd_market_cap,
    gecko_id: coinId,
  };

  return { valid: true, result: result };
};
