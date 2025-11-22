import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { SubjectType, QuizQuestion, PathModule, DictationItem } from "../types";

const apiKey = process.env.API_KEY;

const ai = new GoogleGenAI({ apiKey: apiKey });

export const generateExplanation = async (
  subject: SubjectType,
  topic: string,
  age: number,
  history: string[]
): Promise<string> => {
  const modelId = 'gemini-2.5-flash';
  
  const prompt = `
    You are a friendly, encouraging tutor for a ${age}-year-old student.
    Subject: ${subject}
    Topic: ${topic}
    
    Explain the topic simply, using analogies suitable for a ${age}-year-old.
    If the subject is a language (Tamil, Hindi, Kannada), provide English transliteration and translation.
    Use Markdown formatting. Bold key terms.
    Keep it concise (under 200 words) but informative.
    Previous context: ${history.slice(-3).join('\n')}
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });
    return response.text || "I couldn't generate an explanation right now. Let's try again!";
  } catch (error) {
    console.error("Error generating explanation:", error);
    return "Something went wrong while thinking. Please check your connection.";
  }
};

export const generateQuiz = async (
  subject: SubjectType,
  topic: string,
  age: number
): Promise<QuizQuestion[]> => {
  const modelId = 'gemini-2.5-flash';

  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        question: { type: Type.STRING },
        options: { 
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        correctAnswer: { type: Type.STRING, description: "Must be exactly one of the strings in the options array" },
        explanation: { type: Type.STRING, description: "Why this answer is correct" }
      },
      required: ["question", "options", "correctAnswer", "explanation"]
    }
  };

  const prompt = `
    Create a mini-quiz with 3 questions about "${topic}" in ${subject} for a ${age}-year-old student.
    Ensure options are clear. 
    If Language subject, test vocabulary or basic grammar.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text) as QuizQuestion[];
  } catch (error) {
    console.error("Error generating quiz:", error);
    return [];
  }
};

export const suggestTopics = async (subject: SubjectType, age: number): Promise<string[]> => {
  const modelId = 'gemini-2.5-flash';
  
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      topics: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  };

  const prompt = `Suggest 4 interesting, age-appropriate learning topics for a ${age}-year-old in the subject: ${subject}. Keep titles short (max 5 words).`;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    const text = response.text;
    if (!text) return ["Basics", "Advanced", "Fun Facts", "History"];
    const data = JSON.parse(text);
    return data.topics || [];
  } catch (error) {
    console.error("Error suggesting topics:", error);
    return ["Introduction", "Key Concepts", "Practice", "Challenge"];
  }
};

export const generateLearningPath = async (
  subject: SubjectType,
  age: number
): Promise<PathModule[]> => {
  const modelId = 'gemini-2.5-flash';

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      modules: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Fun title for the lesson" },
            description: { type: Type.STRING, description: "What will be learned" },
            topicQuery: { type: Type.STRING, description: "The specific topic string to feed into the AI tutor" }
          },
          required: ["title", "description", "topicQuery"]
        }
      }
    }
  };

  const prompt = `
    Create a personalized 5-step learning path for a ${age}-year-old student learning ${subject}.
    Start with basics and get progressively harder.
    The 'topicQuery' should be a specific instruction I can pass to an AI to start a lesson (e.g., "Teach me about Multiplication").
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    const text = response.text;
    if (!text) return [];
    
    const data = JSON.parse(text);
    const rawModules = data.modules || [];

    // Transform to PathModule type with default status
    return rawModules.map((m: any, index: number) => ({
      id: `module-${Date.now()}-${index}`,
      title: m.title,
      description: m.description,
      topicQuery: m.topicQuery,
      status: index === 0 ? 'current' : 'locked'
    }));

  } catch (error) {
    console.error("Error generating path:", error);
    // Fallback path
    return [
      { id: '1', title: 'Introduction', description: 'Getting started', topicQuery: `Basics of ${subject}`, status: 'current' },
      { id: '2', title: 'Core Concepts', description: 'Important ideas', topicQuery: `Core concepts of ${subject}`, status: 'locked' },
      { id: '3', title: 'Practice', description: 'Try it out', topicQuery: `Practice ${subject}`, status: 'locked' }
    ];
  }
};

export const generateDictationList = async (age: number, language: string = 'English'): Promise<DictationItem[]> => {
  const modelId = 'gemini-2.5-flash';
  
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      words: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
             text: { type: Type.STRING, description: `The word or short phrase to spell in ${language}` },
             hint: { type: Type.STRING, description: "A contextual hint in English (e.g. 'An animal with a trunk')" }
          },
          required: ["text", "hint"]
        }
      }
    }
  };

  const prompt = `
    Generate 5 challenging but age-appropriate spelling words or short phrases for a ${age}-year-old student.
    The language is: ${language}.
    If the language is Tamil, Hindi, or Kannada, provide the word in the native script (e.g., 'வணக்கம்').
    Ensure the hints are always in English.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });
    
    const text = response.text;
    if (!text) return [];
    const data = JSON.parse(text);
    
    return (data.words || []).map((w: any, i: number) => ({
      id: `word-${i}`,
      text: w.text,
      hint: w.hint
    }));
  } catch (error) {
    console.error("Error generating dictation list:", error);
    return [
      { id: '1', text: 'Elephant', hint: 'A large animal with a trunk' },
      { id: '2', text: 'Beautiful', hint: 'Something very pretty' },
      { id: '3', text: 'Science', hint: 'Study of the natural world' }
    ];
  }
};

export const generateSpeech = async (text: string, language: string = 'English'): Promise<string | undefined> => {
  const modelId = 'gemini-2.5-flash-preview-tts';

  const promptText = language === 'English' 
    ? `Please clearly pronounce the word: ${text}`
    : `Please clear pronounce the following ${language} word: ${text}`;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: [{ parts: [{ text: promptText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio;
  } catch (error) {
    console.error("Error generating speech:", error);
    return undefined;
  }
};
