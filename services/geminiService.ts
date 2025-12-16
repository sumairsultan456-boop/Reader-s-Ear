import { GoogleGenAI, Modality } from "@google/genai";
import { pcmToWavBlobUrl } from "../utils/audioUtils";
import { processImageForGemini } from "../utils/imageUtils";

/**
 * Extracts text from an uploaded image using Gemini Vision (gemini-2.5-flash).
 */
export async function extractTextFromImage(imageFile: File): Promise<string> {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please check your environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Resize and process image to prevent payload issues (500 errors)
  const { base64, mimeType } = await processImageForGemini(imageFile);

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64,
            },
          },
          {
            text: "Transcribe all the text visible in this image. Do not add any conversational filler, just provide the text exactly as it appears. Preserve line breaks where logical.",
          },
        ],
      }
    ],
  });

  return response.text || "";
}

/**
 * Generates speech audio from text using Gemini TTS (gemini-2.5-flash-preview-tts).
 */
export async function generateSpeechFromText(text: string): Promise<string> {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }
  
  if (!text.trim()) {
    throw new Error("Text is empty");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Using gemini-2.5-flash-preview-tts for speech synthesis
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' }, // 'Kore' is a generally clear voice
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

  if (!base64Audio) {
    throw new Error("Failed to generate audio content.");
  }

  // Convert raw PCM to WAV blob URL for browser playback
  return pcmToWavBlobUrl(base64Audio, 24000);
}