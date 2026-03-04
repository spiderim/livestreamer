import { z } from "zod";
import { CHAT_MESSAGE_MAX_LENGTH } from "../constants";

export const sendMessageSchema = z.object({
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(CHAT_MESSAGE_MAX_LENGTH, `Message cannot exceed ${CHAT_MESSAGE_MAX_LENGTH} characters`),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
