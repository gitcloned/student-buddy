import axios from "axios";

export async function generateAudio(
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
  audio_speed = 1.0,
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

// Interface for Google Text-to-Speech API response
interface GoogleTTSResponse {
  audioContent: string;
}

export async function generateAudioUsingGoogle(
  text: string,
  audio_speed = 1.0,
  voiceName = "en-IN-Chirp3-HD-Aoede"
): Promise<Buffer> {
  console.log("Generating audio using Google Text-to-Speech for text:", text);

  const googleApiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!googleApiKey) {
    throw new Error("Google Text-to-Speech API key is not set in environment variables");
  }

  // Google Text-to-Speech API endpoint
  const url = "https://texttospeech.googleapis.com/v1beta1/text:synthesize";

  // Default to Indian English if not specified
  const languageCode = voiceName.startsWith("en-") ? voiceName.substring(0, 5) : "en-IN";

  // Request configuration
  const config = {
    method: "post" as const,
    url: `${url}?key=${googleApiKey}`,
    headers: {
      "Content-Type": "application/json"
    },
    data: {
      input: {
        text: text
      },
      voice: {
        languageCode: languageCode,
        name: voiceName
      },
      audioConfig: {
        audioEncoding: "MP3",
        effectsProfileId: [
          "handset-class-device"
        ],
        pitch: 0,
        speakingRate: audio_speed
      }
    }
  };

  try {
    // Use a generic axios call
    const response = await axios(config);
    
    // Google TTS returns base64 encoded audio content in the response
    // Use any type to bypass strict type checking
    const responseData: any = response.data;
    
    if (responseData && responseData.audioContent) {
      // Convert base64 to buffer
      const audioBuffer = Buffer.from(responseData.audioContent, 'base64');
      return audioBuffer;
    } else {
      throw new Error("No audio content received from Google Text-to-Speech API");
    }
  } catch (error) {
    console.error("Error generating audio with Google Text-to-Speech:", error);
    throw error;
  }
}