import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Event } from '@prisma/client';

export interface ProposalItem {
  category: string;
  description: string;
  amount: number;
  currency: string;
}

@Injectable()
export class GeminiService {
  private genAI: GoogleGenerativeAI;

  constructor(private config: ConfigService) {
    this.genAI = new GoogleGenerativeAI(config.get<string>('GEMINI_API_KEY')!);
  }

  async generateProposal(event: Event, message: string): Promise<ProposalItem[]> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are a budget planning assistant.
Generate a detailed budget proposal for the following event:
- Title: ${event.title}
- Date: ${new Date(event.date).toDateString()}
- Currency: ${event.currency}

User request: ${message}

Respond ONLY with a valid JSON array. No markdown, no code fences, no explanation.
Each item must have: category (string), description (string), amount (number), currency (string).
All amounts must be in ${event.currency}. Do not use any other currency.

Example output: [{"category":"Catering","description":"Dinner for 100 guests","amount":5000,"currency":"${event.currency}"}]`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Strip markdown code fences if Gemini wraps anyway
    const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();

    let items: ProposalItem[];
    try {
      items = JSON.parse(cleaned);
    } catch {
      throw new UnprocessableEntityException(
        'Gemini returned an invalid response that could not be parsed as JSON.',
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      throw new UnprocessableEntityException('Gemini returned an empty or invalid proposal.');
    }

    return items;
  }
}
