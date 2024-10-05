import { NextApiRequest, NextApiResponse } from "next";
import { getPriceWithId, preparePriceMessage } from "../../scripts/coingecko";
import { getCommandStrAndChatId } from "../../telegram";
import {
  sendMessage,
  sendMessageWithOptions,
  TKeyboardOption,
} from "../../telegram/sendMessage";
import coniList from "../../raw_data.json";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { chatId, commandStr } = getCommandStrAndChatId(req.body);
  const arr = commandStr!.split(" ").map((item) => item.trim());
  
  try {
    let content;
    const _symbol = arr[2]; // Extract the symbol from the command string
    
    // Find all records matching the symbol (case insensitive)
    const records = coniList.filter(
      (item) =>
        item.s.toLowerCase() === _symbol.toLowerCase() ||
        item.i.toLowerCase() === _symbol.toLowerCase()
    );

    if (!records.length) {
      throw Error(`Error: symbol ${_symbol.toUpperCase()} is not supported`);
    }

    // If there's only one matching symbol, proceed to fetch the price
    if (records.length === 1) {
      const result = await getPriceWithId(records[0].i); // Fetch price using CoinGecko ID
      
      // Check if price retrieval was successful
      if (!result.valid || !result.result) {
        throw Error("Could not get the price for $" + _symbol);
      }

      const htmlMsg = preparePriceMessage(result.result); // Prepare message with the price
      await sendMessage(htmlMsg, chatId!); // Send the message to the Telegram chat
    } else {
      // If multiple records exist, prompt the user to select the correct one
      const options: TKeyboardOption[] = records.map((item) => ({
        label: item.n,
        value: `/k p id=${item.i}`,
      }));

      await sendMessageWithOptions(
        `Which $${_symbol.toUpperCase()}?`,
        chatId!,
        options
      );
      return res.status(200).send("ok");
    }
  } catch (err) {
    // Send error message to the Telegram chat
    sendMessage(err as string, chatId!);
  }
  
  return res.status(200).send("ok");
};
