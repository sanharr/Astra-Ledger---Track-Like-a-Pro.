import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Expense } from "../types";
import { CURRENCY_SYMBOL } from "../constants";

// Initialize the client. apiKey is required from environment variables.
// Note: In a real production app, you might proxy this through a backend to hide the key,
// but for this client-side demo, we rely on the env var or user providing it.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// 1. MEMORY CONTEXT BUILDER
export const buildMemoryContext = (expenses: Expense[]): string => {
  const habitMap: Record<string, string> = {};
  expenses.forEach(exp => {
    if (exp.item && exp.category) {
      const key = exp.item.toLowerCase().trim();
      if (!habitMap[key]) habitMap[key] = exp.category;
    }
  });
  
  return Object.entries(habitMap)
    .slice(0, 50)
    .map(([item, cat]) => `"${item}": "${cat}"`)
    .join(", ");
};

// 2. PARSING AGENT (Text -> JSON)
export const runParsingAgent = async (text: string, memoryContext: string): Promise<Expense[]> => {
  if (!process.env.API_KEY) return [];

  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        item: { type: Type.STRING },
        amount: { type: Type.NUMBER },
        category: { type: Type.STRING }
      },
      required: ["item", "amount", "category"]
    }
  };

  const systemInstruction = `
    You are the "Parsing Agent" for Astra Ledger.
    1. MEMORY: User's past habits: { ${memoryContext} }.
    2. TASK: Analyze input for expenses.
    3. RULES: Default to ${CURRENCY_SYMBOL} if currency missing. Handle natural language.
    4. OUTPUT: Return structured JSON data matching the schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: text,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    const jsonText = response.text;
    if (!jsonText) return [];
    
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Parsing Agent Error:", error);
    return [];
  }
};

// 3. VISION AGENT (Image -> JSON)
export const runVisionAgent = async (base64Image: string, mimeType: string): Promise<Expense[]> => {
  if (!process.env.API_KEY) return [];

  const prompt = `
    Analyze this receipt image. 
    Extract the main Merchant Name (as 'item') and the Total Amount. 
    Infer the Category (Food, Transport, Groceries, Shopping, Bills, etc.).
    Return the data in the specified JSON schema.
    If multiple distinct items are visible that should be categorized differently, list them.
    Otherwise, return a single total.
  `;

  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        item: { type: Type.STRING },
        amount: { type: Type.NUMBER },
        category: { type: Type.STRING }
      },
      required: ["item", "amount", "category"]
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { text: prompt },
          { inlineData: { mimeType, data: base64Image } }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    const jsonText = response.text;
    if (!jsonText) return [];

    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Vision Agent Error:", error);
    return [];
  }
};

// 4. SUMMARY AGENT (Q&A)
export const runSummaryAgent = async (queryText: string, expenseData: Expense[]): Promise<string> => {
  if (!process.env.API_KEY) return "API Key missing.";

  const dataSummary = JSON.stringify(
    expenseData.slice(0, 100).map(e => ({ i: e.item, a: e.amount, c: e.category }))
  );

  const systemInstruction = `
    You are the "Summary Agent" for Astra Ledger.
    Data context (Last 100 items): ${dataSummary}
    Task: Answer the user's question concisely based on the data.
    Style: Professional, concise, use bolding (Markdown) for numbers.
    Currency: ${CURRENCY_SYMBOL}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: queryText,
      config: {
        systemInstruction
      }
    });
    return response.text || "I couldn't generate a summary.";
  } catch (error) {
    console.error("Summary Agent Error:", error);
    return "Service temporarily unavailable.";
  }
};

// 5. ADVISOR AGENT (Dashboard Insight)
export const runAdvisorAgent = async (expenseData: Expense[]): Promise<string> => {
  if (expenseData.length === 0) return "Start adding expenses to get AI insights!";
  if (!process.env.API_KEY) return "Add your API Key to enable AI insights.";

  const dataSummary = JSON.stringify(
    expenseData.slice(0, 30).map(e => ({ i: e.item, a: e.amount, c: e.category }))
  );

  const systemInstruction = `
    You are a witty, premium Financial Coach.
    Analyze this spending data: ${dataSummary}.
    Identify ONE interesting pattern or give ONE specific piece of advice.
    Keep it under 25 words. Be insightful but concise.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "Give me an insight.",
      config: {
        systemInstruction,
        thinkingConfig: { thinkingBudget: 1024 } // Use a bit of thinking for better insight
      }
    });
    return response.text || "Tracking is the first step to financial freedom.";
  } catch (error) {
    console.warn("Advisor Agent Error:", error);
    return "Keep tracking your expenses to see patterns.";
  }
};

// Helper: File to Base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
