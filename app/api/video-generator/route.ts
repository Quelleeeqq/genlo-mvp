import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import os from 'os';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

ffmpeg.setFfmpegPath(ffmpegPath!);

export async function POST(req: NextRequest) {
  try {
    const {
      userId, scenes, stability, similarity, model, ssml
    } = await req.json();

    const videoPaths: string[] = [];
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ugc-scenes-'));

    for (const [i, scene] of scenes.entries()) {
      // Fetch avatar and voice details
      const { data: avatarData, error: avatarError } = await supabase.from('avatars').select('*').eq('id', scene.avatarId).single();
      if (avatarError || !avatarData) throw new Error('Avatar not found');
      const { data: voiceData, error: voiceError } = await supabase.from('voices').select('*').eq('id', scene.voiceId).single();
      if (voiceError || !voiceData) throw new Error('Voice not found');

      // D-ID API call
      const didRes = await axios.post(
        'https://api.d-id.com/talks',
        {
          source_url: avatarData.image_url,
          script: {
            type: 'text',
            input: scene.text,
            ...(ssml ? { ssml: true } : {}),
            provider: {
              type: 'elevenlabs',
              voice_id: voiceData.elevenlabs_id,
              voice_config: {
                stability: stability ?? 0.5,
                similarity_boost: similarity ?? 0.75
              },
              model_id: model || 'eleven_multilingual_v2'
            }
          },
          config: {
            driver_expressions: {
              expressions: [
                { start_frame: 0, expression: scene.emotion || 'neutral', intensity: 1.0 }
              ]
            }
          }
        },
        {
          headers: {
            Authorization: `Basic ${process.env.DID_API_KEY!}`,
            'Content-Type': 'application/json',
            'x-api-key-external': JSON.stringify({ elevenlabs: process.env.ELEVENLABS_API_KEY! }),
          }
        }
      );
      const talkId = didRes.data.id;

      // Poll for video completion
      let resultUrl = '';
      for (let j = 0; j < 30; j++) {
        await new Promise(res => setTimeout(res, 2000));
        const pollRes = await axios.get(`https://api.d-id.com/talks/${talkId}`, {
          headers: { Authorization: `Basic ${process.env.DID_API_KEY!}` },
        });
        if (pollRes.data.status === 'done' && pollRes.data.result_url) {
          resultUrl = pollRes.data.result_url;
          break;
        }
      }
      if (!resultUrl) throw new Error(`Scene ${i + 1} video generation timed out`);

      // Download the video
      const videoRes = await axios.get(resultUrl, { responseType: 'arraybuffer' });
      const videoPath = path.join(tempDir, `scene${i + 1}.mp4`);
      fs.writeFileSync(videoPath, videoRes.data);
      videoPaths.push(videoPath);
    }

    // Stitch all scene videos into one using FFmpeg
    const concatListPath = path.join(tempDir, 'concat.txt');
    fs.writeFileSync(
      concatListPath,
      videoPaths.map(p => `file '${p.replace(/'/g, "'\\''")}'`).join('\n')
    );
    const finalVideoPath = path.join(tempDir, `final-${uuidv4()}.mp4`);

    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(concatListPath)
        .inputOptions(['-f', 'concat', '-safe', '0'])
        .outputOptions(['-c', 'copy'])
        .output(finalVideoPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });

    // Upload the final video to Supabase Storage
    const videoBuffer = fs.readFileSync(finalVideoPath);
    const videoId = uuidv4();
    const supaPath = `user-${userId}/ugc-${videoId}.mp4`;
    const { error: uploadError } = await supabase.storage
      .from('videos')
      .upload(supaPath, videoBuffer, {
        contentType: 'video/mp4',
        upsert: true,
      });
    if (uploadError) throw new Error(uploadError.message);

    const { data: videoUrlData } = supabase.storage
      .from('videos')
      .getPublicUrl(supaPath);

    // Clean up temp files
    for (const p of videoPaths.concat([finalVideoPath, concatListPath])) {
      fs.unlinkSync(p);
    }
    fs.rmdirSync(tempDir);

    return NextResponse.json({ url: videoUrlData.publicUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Video generation failed' }, { status: 500 });
  }
} 