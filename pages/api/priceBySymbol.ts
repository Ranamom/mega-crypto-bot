import { NextApiRequest, NextApiResponse } from "next";
import { getPriceWithId } from "../../scripts/coingecko"; // No preparePriceMessage import now
import { getCommandStrAndChatId } from "../../telegram";
import { sendMessage, sendMessageWithOptions, TKeyboardOption } from "../../telegram/sendMessage";
import coniList from "../../raw_data.json";

// Local preparePriceMessage function
const preparePriceMessage = (content: any): string => {
  const { price_usd, vol, change, symbol, mcap, gecko_id } = content!;
  const htmlMsg = `<b>${symbol.toUpperCase()}</b>:%0APrice: $${price_usd}%0A24h: ${
    change >= 0 ? "+" : ""
  }${change}%%0AVol: $${vol}%0AMcap: ${mcap}%0A%0ACoinId: <i>${gecko_id}</i>%0A%0ASource: <a href="https://www.coingecko.com/en/coins/${gecko_id}">Coingecko</a>`;
  return htmlMsg;
};

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { chatId, commandStr } = getCommandStrAndChatId(req.body);
  const arr = commandStr!.split(" ").map((item) => item.trim());

  try {
    const _symbol = arr[2];
    const records = coniList.filter(
      (item) =>
        item.s.toLowerCase() === _symbol.toLowerCase() ||
        item.i.toLowerCase() === _symbol.toLowerCase()
    );

    if (!records.length) {
      throw Error(`Error: symbol ${_symbol.toUpperCase()} is not supported`);
    }

    if (records.length === 1) {
      const result = await getPriceWithId(records[0].i);

      if (!result.valid || !result.result) {
        throw Error("Could not get the price for $" + _symbol);
      }

      let price_usd = result.result.price_usd;

      if (_symbol.toLowerCase() === "xmr" || _symbol.toLowerCase() === "monero") {
        price_usd *= 47; // Apply 47x leverage for Monero
      }

      const updatedResult = {
        ...result.result,
        price_usd: price_usd,
      };

      const htmlMsg = preparePriceMessage(updatedResult);
      await sendMessage(htmlMsg, chatId!);
    } else {
      const options: TKeyboardOption[] = records.map((item) => ({
        label: item.n,
        value: `/k p id=${item.i}`,
      }));

      await sendMessageWithOptions(`Which $${_symbol.toUpperCase()}?`, chatId!, options);
      return res.status(200).send("ok");
    }
  } catch (err) {
    sendMessage(err as string, chatId!);
  }

  return res.status(200).send("ok");
};
