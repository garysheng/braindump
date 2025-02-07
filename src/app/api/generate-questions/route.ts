import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';

interface Question {
  id: string;
  text: string;
  order: number;
}

export async function POST(request: Request) {
  try {
    const { prompt, apiKey } = await request.json();

    if (!prompt || !apiKey) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const openai = new OpenAI({ apiKey });

    // Check if this is a title generation request by looking for the word "title" in the prompt
    const isTitleGeneration = prompt.toLowerCase().includes("title");

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: isTitleGeneration
            ? "You are a helpful assistant that generates concise and descriptive titles. Your response must be a valid JSON object with a 'title' field. Do not include any markdown formatting or code blocks. Example: {\"title\": \"Daily Reflection Session\"}"
            : "You are a helpful assistant that generates interview questions. Your response must be a valid JSON object with a 'questions' array containing 5-10 questions. Each question should be a string. Do not include any markdown formatting or code blocks. Example: {\"questions\": [\"What are your goals for today?\", \"How do you feel about your progress?\"]}",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const result = completion.choices[0]?.message?.content;
    if (!result) {
      throw new Error("No content generated");
    }

    // Clean the result string - remove any markdown formatting if present
    const cleanResult = result.replace(/```json\n?|\n?```/g, '').trim();

    try {
      const parsedResult = JSON.parse(cleanResult) as { title?: string; questions?: string[] };
      
      // Validate and format the response
      if (isTitleGeneration) {
        if (!parsedResult.title) {
          throw new Error("Response missing title field");
        }
        return NextResponse.json(parsedResult);
      } else {
        if (!parsedResult.questions || !Array.isArray(parsedResult.questions)) {
          throw new Error("Response missing questions array");
        }

        // Format questions with required fields
        const formattedQuestions = parsedResult.questions.map((question: string, index: number) => ({
          id: uuidv4(),
          text: question,
          order: index,
        }));

        // Validate each question
        formattedQuestions.forEach((question: Question) => {
          if (!question.text || typeof question.text !== 'string') {
            throw new Error(`Invalid question format at index ${question.order}`);
          }
        });

        return NextResponse.json({ questions: formattedQuestions });
      }
    } catch (error) {
      console.error("Failed to parse OpenAI response:", error);
      throw new Error("Invalid response format from OpenAI");
    }
  } catch (error: unknown) {
    console.error("Error generating content:", error);
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
} 