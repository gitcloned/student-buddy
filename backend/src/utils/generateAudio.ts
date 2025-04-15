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