import axios from "axios";
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { normaliseText } from "./normaliseText";

export async function generateAudio(
  text: string,
  audio_speed = 1,
  voiceName?: string
): Promise<Buffer> {

  const speech = normaliseText(text)

  if (process.env.GENERATE_AUDIO_USING === "google") {
    return generateAudioUsingGoogle(speech, audio_speed, voiceName);
  } else if (process.env.GENERATE_AUDIO_USING === "openai") {
    return generateAudioUsingOpenAI(speech, audio_speed, voiceName);
  }

  return generateAudioUsingElevenLabs(speech, audio_speed, voiceName);
}

export async function generateAudioUsingElevenLabs(
  text: string,
  audio_speed = 1,
  voiceName?: string
): Promise<Buffer> {

  console.log("Generating audio for text:", text);

  const data = {
    model_id: "eleven_multilingual_v2",
    text: text,
    voice_settings: {
      stability: 0.36,
      similarity_boost: 0.47,
      speed: audio_speed,
    },
  };

  voiceName =
    voiceName || process.env.ELEVEN_LABS_VOICE_NAME || "EGQM7bHbTHTb7VUEcOHG";

  if (voiceName === "EGQM7bHbTHTb7VUEcOHG") {
    // shakuntala
    data.voice_settings.similarity_boost = 0.41;
    data.voice_settings.stability = 0.36;
    data.model_id = "eleven_multilingual_v2";
  }

  if (voiceName === "ftDdhfYtmfGP0tFlBYA1") {
    // alisha
    data.voice_settings.similarity_boost = 0.6;
    data.voice_settings.stability = 0.5;
  }

  if (voiceName === "SpknCRN08oLyKbJFn5e5") {
    // kavya
    data.voice_settings.stability = 0.4;
    data.voice_settings.similarity_boost = 0.34;
  }

  if (voiceName === "siw1N9V8LmYeEWKyWBxv") {
    // ruhan
    data.voice_settings.stability = 0.54;
    data.voice_settings.similarity_boost = 0.4;
  }

  if (voiceName === "TM6EiVdUQXAy4w6qOvOq") {
    // Mitali
    data.voice_settings.stability = 0.45;
    data.voice_settings.similarity_boost = 0.6;
  }

  if (voiceName === "8Bn4GxPHXGtRW9zlnmDb") {
    // Indya
    data.voice_settings.stability = 0.4;
    data.voice_settings.similarity_boost = 0.3;
  }

  if (voiceName === "DJDkcaY4POaxra3iaZ5b") {
    // natasha
    data.voice_settings.stability = 0.44;
    data.voice_settings.similarity_boost = 0.31;
  }

  const config = {
    method: "post" as const,
    maxBodyLength: Infinity,
    url: `${process.env.ELEVEN_LABS_BASE_URL}${voiceName}`,
    headers: {
      "xi-api-key": process.env.ELEVEN_LABS_API_KEY,
      "Content-Type": "application/json",
    },
    data: data,
    responseType: "arraybuffer" as const,
  };

  try {
    const response = await axios.request(config);
    // @ts-ignore
    const audioBuffer = Buffer.from(response.data);
    return audioBuffer;
  } catch (error) {
    throw error;
  }
}

export async function generateAudioUsingOpenAI(
  text: string,
  audio_speed = 0.8,
  voiceName = "alloy",
): Promise<Buffer> {
  console.log("Generating audio using OpenAI for text:", text);

  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    throw new Error("OpenAI API key is not set in environment variables");
  }

  // OpenAI TTS API endpoint
  const url = "https://api.openai.com/v1/audio/speech";

  // Request configuration
  const config = {
    method: "post" as const,
    maxBodyLength: Infinity,
    url: url,
    headers: {
      "Authorization": `Bearer ${openaiApiKey}`,
      "Content-Type": "application/json"
    },
    data: {
      model: "gpt-4o-mini-tts", // Using the specified model
      input: text,
      voice: voiceName, // Available voices: alloy, echo, fable, onyx, nova, shimmer
      speed: audio_speed, // Speed factor: 0.25 to 4.0
      response_format: "mp3"
    },
    responseType: "arraybuffer" as const,
  };

  try {
    const response = await axios(config);
    // @ts-ignore
    const audioBuffer = Buffer.from(response.data);
    return audioBuffer;
  } catch (error) {
    console.error("Error generating audio with OpenAI:", error);
    throw error;
  }
}

export async function generateAudioUsingGoogle(
  text: string,
  audio_speed = 0.8,
  voiceName = "en-IN-Chirp3-HD-Aoede"
): Promise<Buffer> {
  console.log("Generating audio using Google Text-to-Speech for normalised text:", text);

  // Check if GOOGLE_APPLICATION_CREDENTIALS environment variable is set
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.warn("GOOGLE_APPLICATION_CREDENTIALS environment variable is not set. Using default credentials.");
    // You can set it programmatically here if needed:
    // process.env.GOOGLE_APPLICATION_CREDENTIALS = '/path/to/your/service-account.json';
  }

  try {
    // Creates a client using Application Default Credentials
    const client = new TextToSpeechClient();

    // Default to Indian English if not specified
    const languageCode = voiceName.startsWith("en-") ? voiceName.substring(0, 5) : "en-IN";

    // Construct the request
    const request = {
      input: { text },
      // Select the language and voice
      voice: {
        languageCode: languageCode,
        name: voiceName,
      },
      // Select the type of audio encoding
      audioConfig: {
        audioEncoding: "MP3" as const,
        effectsProfileId: ["handset-class-device"],
        pitch: 0,
        speakingRate: audio_speed,
      },
    };

    // Performs the text-to-speech request
    const [response] = await client.synthesizeSpeech(request);

    if (response.audioContent) {
      // The response's audioContent is binary
      return Buffer.from(response.audioContent as Uint8Array);
    } else {
      throw new Error("No audio content received from Google Text-to-Speech API");
    }
  } catch (error) {
    console.error("Error generating audio with Google Text-to-Speech:", error);
    throw error;
  }
}