import { z } from "zod";
import { STREAM_PASSWORD_MIN_LENGTH } from "../constants";

export const createStreamSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().max(2000).optional(),
    isPasswordProtected: z.boolean().default(false),
    password: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.isPasswordProtected) {
        return (
          data.password && data.password.length >= STREAM_PASSWORD_MIN_LENGTH
        );
      }
      return true;
    },
    {
      message: `Password must be at least ${STREAM_PASSWORD_MIN_LENGTH} characters`,
      path: ["password"],
    }
  );

export const updateStreamSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  isPasswordProtected: z.boolean().optional(),
  password: z.string().min(STREAM_PASSWORD_MIN_LENGTH).optional(),
});

export const verifyPasswordSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

export type CreateStreamInput = z.infer<typeof createStreamSchema>;
export type UpdateStreamInput = z.infer<typeof updateStreamSchema>;
