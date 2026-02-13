'use server';
/**
 * @fileOverview An AI fraud detection system for score submissions.
 *
 * - proactiveFraudDetectionForScoreSubmissions - A function that analyzes score submissions for suspicious patterns.
 * - ProactiveFraudDetectionInput - The input type for the proactiveFraudDetectionForScoreSubmissions function.
 * - ProactiveFraudDetectionOutput - The return type for the proactiveFraudDetectionForScoreSubmissions function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ProactiveFraudDetectionInputSchema = z.object({
  currentSubmission: z.object({
    playerId: z.string().describe('The ID of the player submitting the score.').min(1),
    gameName: z.string().describe('The name of the game for the submission.').min(1),
    scoreValue: z.number().describe('The numerical score submitted.').int().nonnegative(),
    imageURL: z.string().url().describe('The URL of the score proof image.').optional(),
    timestamp: z.string().datetime().describe('The timestamp of the submission in ISO 8601 format.').min(1),
  }),
  playerContext: z.object({
    name: z.string().describe('The name of the player.').min(1),
    instagram: z.string().describe('The Instagram handle of the player.').optional(),
  }),
  previousScoresByPlayerForGame: z.array(
    z.object({
      scoreValue: z.number().int().nonnegative().describe('A previous score value.'),
      timestamp: z.string().datetime().describe('The timestamp of the previous score in ISO 8601 format.'),
    })
  ).describe('A chronologically sorted list of previous scores submitted by this player for the same game.').optional().default([]),
});
export type ProactiveFraudDetectionInput = z.infer<typeof ProactiveFraudDetectionInputSchema>;

const ProactiveFraudDetectionOutputSchema = z.object({
  isSuspicious: z.boolean().describe('True if the submission is deemed suspicious, false otherwise.'),
  reason: z.string().describe('A detailed explanation for the suspicion or lack thereof.'),
  confidence: z.number().min(0).max(100).describe('A confidence level (0-100) for the fraud detection.'),
  suggestedAction: z.string().describe('A suggested action for the admin (e.g., "Review manually", "Reject automatically", "Approve").'),
});
export type ProactiveFraudDetectionOutput = z.infer<typeof ProactiveFraudDetectionOutputSchema>;

export async function proactiveFraudDetectionForScoreSubmissions(
  input: ProactiveFraudDetectionInput
): Promise<ProactiveFraudDetectionOutput> {
  return proactiveFraudDetectionFlow(input);
}

const fraudDetectionPrompt = ai.definePrompt({
  name: 'proactiveFraudDetectionPrompt',
  input: { schema: ProactiveFraudDetectionInputSchema },
  output: { schema: ProactiveFraudDetectionOutputSchema },
  prompt: `You are an AI fraud detection system for a retro arcade event, acting as an expert analyst.
Your task is to analyze a new score submission and identify patterns indicating spam or fraudulent activity beyond simple duplicate counts.
Consider the player's history for the specific game to detect anomalies such as unrealistic score increases, submission frequency, or inconsistent scoring patterns.
Focus your analysis on the provided textual data and metadata; you cannot analyze the image content directly.

Here is the current score submission details:
Player ID: {{{currentSubmission.playerId}}}
Game Name: {{{currentSubmission.gameName}}}
Score Value: {{{currentSubmission.scoreValue}}}
{{#if currentSubmission.imageURL}}
Image Proof URL: {{{currentSubmission.imageURL}}}
{{else}}
Image Proof URL: Not yet available.
{{/if}}
Timestamp: {{{currentSubmission.timestamp}}}

Player Context:
Name: {{{playerContext.name}}}
Instagram: {{{playerContext.instagram}}}

Previous Scores by Player for this Game (sorted chronologically by timestamp):
{{#if previousScoresByPlayerForGame.length}}
{{#each previousScoresByPlayerForGame}}
- Score: {{this.scoreValue}}, Timestamp: {{this.timestamp}}
{{/each}}
{{else}}
No previous scores for this player in this game.
{{/if}}

Based on all the above information, determine if the current submission is suspicious. Provide a detailed reason for your assessment, a confidence level (0-100) for your detection, and a suggested action for the administrator.`,
});

const proactiveFraudDetectionFlow = ai.defineFlow(
  {
    name: 'proactiveFraudDetectionFlow',
    inputSchema: ProactiveFraudDetectionInputSchema,
    outputSchema: ProactiveFraudDetectionOutputSchema,
  },
  async (input) => {
    const { output } = await fraudDetectionPrompt(input);
    return output!;
  }
);
