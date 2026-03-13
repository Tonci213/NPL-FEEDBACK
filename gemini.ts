import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface FeedbackResult {
  summary: string;
  feedback: string;
  stars: number;
  encouragement: string;
}

export async function analyzeActivityFeedback(
  imageData: string,
  gradeLevel: string,
  studentName: string
): Promise<FeedbackResult> {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    You are a friendly librarian at the Nashville Public Library. 
    Your job is to review feedback from children about library activities and provide a warm, encouraging response.
    
    Context:
    - Grade K-1: They use smile icons. You should interpret their joy and give a simple, happy message.
    - Grade 2-3: They use star ratings and confirm feelings with a caregiver. You should acknowledge their rating and the adult's involvement.
    - Grade 4-6: They write short reflections (what they learned, enjoyed, or found challenging). You should provide constructive and supportive feedback on their writing and thoughts.
    
    Guidelines:
    - Be extremely positive and encouraging.
    - Use age-appropriate language.
    - For K-1, keep it very simple.
    - For 4-6, mention specific things they might have written in their reflection.
    - Always thank them for visiting the Nashville Public Library.
  `;

  const prompt = `
    Analyze this activity feedback for a student named "${studentName}" in grade level "${gradeLevel}".
    The image contains their feedback (smile icons, stars, or a written reflection).
    
    Return a JSON object with:
    - summary: A 1-sentence summary of their feedback.
    - feedback: A warm, detailed response from the librarian (Markdown supported).
    - stars: An overall "Library Star" rating (1-5) based on their engagement.
    - encouragement: A short, catchy phrase for their certificate (e.g., "Library Explorer!", "Future Author!").
  `;

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: imageData.split(",")[1],
            },
          },
        ],
      },
    ],
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          feedback: { type: Type.STRING },
          stars: { type: Type.INTEGER },
          encouragement: { type: Type.STRING },
        },
        required: ["summary", "feedback", "stars", "encouragement"],
      },
    },
  });

  return JSON.parse(response.text);
}
