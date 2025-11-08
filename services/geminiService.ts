
import { GoogleGenAI } from "@google/genai";
import type { Trip, Friend, Expense, Settlement } from '../types';

export const generateTripSummary = async (trip: Trip, friends: Friend[], settlements: Settlement[]): Promise<string> => {
  if (!process.env.API_KEY) {
    return "API key is not set. Please configure your environment.";
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const getFriendName = (id: string) => friends.find(f => f.id === id)?.name || 'Unknown';

  const prompt = `
    Generate a fun, friendly, and narrative-style summary for a trip. Be creative and engaging.

    Here are the details:
    - Trip Name: "${trip.name}"
    - Trip Date: ${trip.date}

    Members on the trip:
    ${trip.members.map(id => `- ${getFriendName(id)}`).join('\n')}

    Here's a list of expenses:
    ${trip.expenses.map(exp => `- ${exp.description || 'An expense'} for ₹${exp.amount.toFixed(2)}, paid by ${getFriendName(exp.paidById)}.`).join('\n')}
    
    And here is the final breakdown of who needs to pay whom:
    ${settlements.map(s => `- ${getFriendName(s.from)} pays ${getFriendName(s.to)} ₹${s.amount.toFixed(2)}`).join('\n')}

    Based on all this data, write a short, engaging summary.
    - Start with a catchy headline.
    - Mention the total spending.
    - Highlight who paid for major items or who was the biggest spender in a fun way.
    - Briefly mention the final settlements in a light-hearted manner, like "time to settle up!".
    - Give it a positive and memorable tone, like a fond memory.
    - Keep it concise, around 3-4 paragraphs.
    - The output should be plain text.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating trip summary:", error);
    return "Sorry, I couldn't generate a summary at this time. Please check the console for errors.";
  }
};
