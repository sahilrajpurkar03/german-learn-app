"""Generate natural German voice clips for every line in the course (Piper neural TTS, runs locally).

Usage (from app/):
  pip install piper-tts
  python -m piper.download_voices --download-dir <voices-dir> de_DE-thorsten-high
  node --experimental-strip-types scripts/audio-manifest.ts > .audio-manifest.json
  python scripts/tts-build.py --voice <voices-dir>/de_DE-thorsten-high.onnx [--manifest .audio-manifest.json]

Writes public/audio/<hash>.mp3 (mono, 32 kbps) and skips clips that already exist, so it is
cheap to re-run after adding content. Requires ffmpeg on PATH. The Thorsten voice is CC0.
"""

import argparse
import concurrent.futures
import json
import os
import subprocess
import sys
import tempfile
import wave

from piper import PiperVoice, SynthesisConfig


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--voice", required=True)
    parser.add_argument("--manifest", default=".audio-manifest.json")
    parser.add_argument("--out", default="public/audio")
    parser.add_argument("--rate", type=float, default=1.08, help="length scale: >1 is slower, clearer speech")
    args = parser.parse_args()

    with open(args.manifest, encoding="utf-8") as handle:
        manifest = json.load(handle)
    os.makedirs(args.out, exist_ok=True)
    todo = [entry for entry in manifest if not os.path.exists(os.path.join(args.out, entry["file"]))]
    print(f"{len(manifest)} lines, {len(todo)} to synthesise", flush=True)
    if not todo:
        return 0

    voice = PiperVoice.load(args.voice)
    config = SynthesisConfig(length_scale=args.rate, noise_scale=0.6, noise_w_scale=0.7)
    tmp = tempfile.mkdtemp(prefix="sprechen-tts-")

    def encode(wav_path: str, mp3_path: str) -> None:
        subprocess.run(
            ["ffmpeg", "-loglevel", "error", "-y", "-i", wav_path, "-af", "silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,apad=pad_dur=0.12",
             "-ac", "1", "-ar", "22050", "-b:a", "32k", mp3_path],
            check=True,
        )
        os.remove(wav_path)

    jobs = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=os.cpu_count() or 4) as pool:
        for index, entry in enumerate(todo, 1):
            wav_path = os.path.join(tmp, entry["file"].replace(".mp3", ".wav"))
            with wave.open(wav_path, "wb") as wav:
                voice.synthesize_wav(entry["text"], wav, syn_config=config)
            jobs.append(pool.submit(encode, wav_path, os.path.join(args.out, entry["file"])))
            if index % 100 == 0:
                print(f"  {index}/{len(todo)}", flush=True)
        for job in jobs:
            job.result()
    print("done", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
