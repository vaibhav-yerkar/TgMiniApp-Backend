import axios from "axios";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;
const COMMUNITY_CHAT_ID = process.env.TELEGRAM_COMMUNITY_CHAT_ID;

export const telegramApi = axios.create({
  baseURL: `https://api.telegram.org/bot${BOT_TOKEN}`,
});

export const verifyChannelMember = async (username: string) => {
  try {
    const response = await telegramApi.get("/getChatMember", {
      params: {
        chat_id: CHANNEL_ID,
        user_id: username,
      },
    });
    return ["member", "creator", "administrator"].includes(
      response.data.result.status
    );
  } catch (error) {
    return false;
  }
};

export const verifyCommunityMember = async (username: string) => {
  try {
    const response = await telegramApi.get("/getChatMember", {
      params: {
        chat_id: COMMUNITY_CHAT_ID,
        user_id: username,
      },
    });
    return ["member", "creator", "administrator"].includes(
      response.data.result.status
    );
  } catch (error) {
    return false;
  }
};
