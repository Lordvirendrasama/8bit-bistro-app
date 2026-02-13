'use server';
/**
 * @fileOverview This file implements a Genkit flow for verifying submitted high scores using AI.
 * It analyzes a photo proof and compares the detected score with the entered score, flagging discrepancies.
 *
 * - adminScoreImageVerificationAssistant - The main function to call the score verification flow.
 * - AdminScoreImageVerificationAssistantInput - The input type for the verification process.
 * - AdminScoreImageVerificationAssistantOutput - The output type after verification.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Input Schema
const AdminScoreImageVerificationAssistantInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of the high score screen, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  enteredScore: z.number().describe('The numerical score entered by the participant.'),
  gameName: z.string().describe('The name of the game the score is for.'),
});
export type AdminScoreImageVerificationAssistantInput = z.infer<
  typeof AdminScoreImageVerificationAssistantInputSchema
>;

// Output Schema
const AdminScoreImageVerificationAssistantOutputSchema = z.object({
  isVerified: z
    .boolean()
    .describe('True if the score detected in the image matches the entered score, false otherwise.'),
  imageDetectedScore: z
    .number()
    .nullable()
    .describe('The numerical score detected in the provided image, or null if no score could be clearly identified.'),
  discrepancyReason: z
    .string()
    .describe('A detailed explanation if a discrepancy is found, or "No discrepancy found." if verified.'),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe('A confidence score (0 to 1) for the AI\'s verification.'),
});
export type AdminScoreImageVerificationAssistantOutput = z.infer<
  typeof AdminScoreImageVerificationAssistantOutputSchema
>;

// Wrapper function
export async function adminScoreImageVerificationAssistant(
  input: AdminScoreImageVerificationAssistantInput
): Promise<AdminScoreImageVerificationAssistantOutput> {
  return adminScoreImageVerificationAssistantFlow(input);
}

// Prompt definition
const verifyScorePrompt = ai.definePrompt({
  name: 'verifyScorePrompt',
  input: { schema: AdminScoreImageVerificationAssistantInputSchema },
  output: { schema: AdminScoreImageVerificationAssistantOutputSchema },
  prompt: `You are an expert image analysis assistant for retro arcade game high score verification.
Your task is to analyze the provided image of a high score screen for the game "{{{gameName}}}" and compare the score visible in the image with the "enteredScore" provided.

Carefully examine the image to identify the score displayed.
Compare this detected score with the "enteredScore": {{{enteredScore}}}.

If the scores match, set "isVerified" to true.
If the scores do not match, set "isVerified" to false and provide a "discrepancyReason".
If you cannot clearly identify a score in the image, set "isVerified" to false, "imageDetectedScore" to null, and explain why in "discrepancyReason".
Provide a confidence score (0 to 1) for your verification.

Game Name: {{{gameName}}}
Entered Score: {{{enteredScore}}}
Photo Proof: {{media url=photoDataUri}}`,
});

// Flow definition
const adminScoreImageVerificationAssistantFlow = ai.defineFlow(
  {
    name: 'adminScoreImageVerificationAssistantFlow',
    inputSchema: AdminScoreImageVerificationAssistantInputSchema,
    outputSchema: AdminScoreImageVerificationAssistantOutputSchema,
  },
  async (input) => {
    const { output } = await verifyScorePrompt(input);
    return output!;
  }
);
