// use server'

/**
 * @fileOverview Generates personalized HTML email drafts for contacts, including a table of their trademarks and expiration dates, with a tool to analyze and summarize key points.
 *
 * - generateTrademarkEmailDraft - A function that handles the email draft generation process.
 * - GenerateTrademarkEmailDraftInput - The input type for the generateTrademarkEmailDraft function.
 * - GenerateTrademarkEmailDraftOutput - The return type for the generateTrademarkEmailDraft function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TrademarkSchema = z.object({
  trademark: z.string(),
  class: z.string(),
  certificate: z.string(),
  expiration: z.string(),
});

const ContactSchema = z.object({
  name: z.string(),
  email: z.string(),
});

const GenerateTrademarkEmailDraftInputSchema = z.object({
  contact: ContactSchema.describe('The contact to generate the email for.'),
  trademarks: z.array(TrademarkSchema).describe('The trademarks associated with the contact.'),
  crmData: z.string().optional().describe('Additional CRM data to include in the email.'),
});
export type GenerateTrademarkEmailDraftInput = z.infer<typeof GenerateTrademarkEmailDraftInputSchema>;

const GenerateTrademarkEmailDraftOutputSchema = z.object({
  emailDraft: z.string().describe('The generated HTML email draft.'),
});
export type GenerateTrademarkEmailDraftOutput = z.infer<typeof GenerateTrademarkEmailDraftOutputSchema>;

export async function generateTrademarkEmailDraft(input: GenerateTrademarkEmailDraftInput): Promise<GenerateTrademarkEmailDraftOutput> {
  return generateTrademarkEmailDraftFlow(input);
}

const summarizeTrademarksTool = ai.defineTool({
  name: 'summarizeTrademarks',
  description: 'Analyzes a list of trademarks and summarizes key points, especially regarding expiration dates.',
  inputSchema: z.array(TrademarkSchema),
  outputSchema: z.string(),
}, async (trademarks) => {
  // Implement the summarization logic here.
  // This is a placeholder; replace with actual summarization.
  return `Summary of trademarks: ${trademarks.length} trademarks found. Check expiration dates.`;
});

const prompt = ai.definePrompt({
  name: 'generateTrademarkEmailDraftPrompt',
  input: {schema: GenerateTrademarkEmailDraftInputSchema},
  output: {schema: GenerateTrademarkEmailDraftOutputSchema},
  tools: [summarizeTrademarksTool],
  prompt: `You are an AI assistant specializing in generating personalized email drafts for legal professionals.

  Generate an HTML email draft for the following contact:
  Name: {{{contact.name}}}
  Email: {{{contact.email}}}

  Include a table of their trademarks and relevant expiration dates. Use the provided CRM data, if available, to further personalize the email.

  Trademarks:
  {{#each trademarks}}
  - Trademark: {{{trademark}}}, Class: {{{class}}}, Certificate: {{{certificate}}}, Expiration: {{{expiration}}}
  {{/each}}

  CRM Data: {{{crmData}}}

  Use the summarizeTrademarks tool to analyze the trademarks and highlight key points regarding expiration dates in the email.

  The email should be professional, informative, and encourage the contact to take action regarding their trademarks.

  Ensure the email is well-formatted HTML.

  Begin!
  `,
});

const generateTrademarkEmailDraftFlow = ai.defineFlow(
  {
    name: 'generateTrademarkEmailDraftFlow',
    inputSchema: GenerateTrademarkEmailDraftInputSchema,
    outputSchema: GenerateTrademarkEmailDraftOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
