/**
 * Pre-generate audio assets using ElevenLabs APIs.
 *
 * Creates music and SFX files, stores them locally,
 * and avoids regenerating existing assets.
 *
 * Usage:
 *   export $(cat .env | xargs) && node generate-audio.mjs
 */

import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { writeFile, mkdir, access } from "node:fs/promises";

const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) {
  console.error("Error: Set ELEVENLABS_API_KEY environment variable first.");
  process.exit(1);
}

const client = new ElevenLabsClient({ apiKey });
await mkdir("audio", { recursive: true });

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

async function fileExists(path) {
  try { await access(path); return true; } catch { return false; }
}

async function generateSfx(filename, prompt, duration) {
  if (await fileExists(filename)) {
    console.log(`⏭️  ${filename} already exists, skipping`);
    return;
  }
  console.log(`🔊 Generating ${filename}...`);
  try {
    const res = await fetch("https://api.elevenlabs.io/v1/sound-generation", {
      method: "POST",
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        text: prompt,
        duration_seconds: duration,
        prompt_influence: 0.6,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(filename, buf);
    console.log(`✅ ${filename} (${(buf.length / 1024).toFixed(0)} KB)`);
  } catch (err) {
    console.error(`❌ ${filename} failed:`, err.message);
  }
}

async function generateMusic(filename, prompt) {
  if (await fileExists(filename)) {
    console.log(`⏭️  ${filename} already exists, skipping`);
    return;
  }
  console.log(`🎵 Generating ${filename} (30-60s)...`);
  try {
    const stream = await client.music.compose({
      prompt,
      musicLengthMs: 60000,
      forceInstrumental: true,
    });
    const buf = await streamToBuffer(stream);
    await writeFile(filename, buf);
    console.log(`✅ ${filename} (${(buf.length / 1024).toFixed(0)} KB)`);
  } catch (err) {
    console.error(`❌ ${filename} failed:`, err.message);
  }
}

// ── Music tracks ──
await generateMusic(
  "audio/music1.mp3",
  "Soft ambient lo-fi track with gentle piano motifs and warm analog pads, slow tempo, dreamy and peaceful walking mood, subtle texture, fully instrumental"
);

await generateMusic(
  "audio/music2.mp3",
  "Calm acoustic fingerstyle guitar with light string backing, warm and mellow tone, evokes a quiet nature walk, relaxed tempo, fully instrumental"
);

await generateMusic(
  "audio/music3.mp3",
  "Ethereal ambient soundscape with airy synth pads, soft chimes, and a floating meditative feel, very slow evolving texture, fully instrumental"
);

// ── Footstep variations ──
await generateSfx(
  "audio/footsteps1.mp3",
  "Soft steady footsteps on a dirt and gravel forest trail, light crunch with each step, natural rhythm, calm walking pace",
  10
);

await generateSfx(
  "audio/footsteps2.mp3",
  "Gentle footsteps on grass and fallen leaves, soft rustling textures, quiet and relaxed outdoor walking",
  10
);

await generateSfx(
  "audio/footsteps3.mp3",
  "Slow footsteps on a sandy path, soft padded impacts, minimal noise, peaceful and unhurried pace",
  10
);

// ── Ambient: day ──
await generateSfx(
  "audio/birds1.mp3",
  "Morning forest ambience with layered birdsong, light breeze through trees, soft natural atmosphere, fresh and peaceful dawn",
  10
);

await generateSfx(
  "audio/birds2.mp3",
  "Warm afternoon forest ambience with distant bird calls, gentle wind in leaves, subtle early crickets, calm sunny environment",
  10
);

// ── Ambient: night ──
await generateSfx(
  "audio/owls1.mp3",
  "Night forest ambience with distant owl hoots, steady crickets, soft wind through trees, calm and immersive nocturnal atmosphere",
  10
);

await generateSfx(
  "audio/owls2.mp3",
  "Deep night ambience with continuous cricket chorus, occasional far owl call, very still air, quiet and serene mood",
  10
);

console.log("\n🚀 All audio generated! Open index.html in your browser.");