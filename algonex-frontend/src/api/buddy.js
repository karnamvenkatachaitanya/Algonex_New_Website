import apiClient from "./client";

/**
 * Send a chat message to the Buddy AI chatbot.
 * @param {Array} messages - Full conversation history [{role, content}, ...]
 * @returns {Promise<{message: string, cards: Array}>}
 */
export const sendBuddyMessage = async (messages) => {
  const response = await apiClient.post("/buddy/chat/", { messages });
  return response.data;
};
