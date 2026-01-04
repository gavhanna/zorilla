#!/usr/bin/env python3
"""
Transcription script using faster-whisper
Called from Node.js transcription service
"""

import sys
import json
import argparse
from pathlib import Path

try:
    from faster_whisper import WhisperModel
except ImportError:
    print(json.dumps({
        "error": "faster-whisper not installed. Run: pip install faster-whisper",
        "success": False
    }))
    sys.exit(1)


def transcribe_file(
    audio_path: str,
    model_name: str = "base",
    language: str = "auto",
    compute_type: str = "int8"
):
    """
    Transcribe an audio file using faster-whisper

    Args:
        audio_path: Path to the audio file
        model_name: Whisper model size (tiny, base, small, medium, large-v1, large-v2, large-v3)
        language: Language code or "auto" for auto-detection
        compute_type: Computation type (float32, float16, int8, int8_float16)

    Returns:
        dict with success, transcript, and optional error
    """
    try:
        # Validate file exists
        if not Path(audio_path).exists():
            return {
                "success": False,
                "error": f"Audio file not found: {audio_path}"
            }

        print(f"Loading model: {model_name}", file=sys.stderr)

        # Initialize model with int8 quantization for memory efficiency
        model = WhisperModel(
            model_name,
            device="cpu",
            compute_type=compute_type,
            download_root=None  # Use default cache directory
        )

        print(f"Transcribing: {audio_path}", file=sys.stderr)

        # Transcribe the audio file
        segments, info = model.transcribe(
            audio_path,
            language=language if language != "auto" else None,
            beam_size=5,
            vad_filter=True,
            vad_parameters={"min_silence_duration_ms": 500}
        )

        # Combine all segments into full transcript
        transcript_parts = []
        for segment in segments:
            transcript_parts.append(segment.text)

        full_transcript = "".join(transcript_parts).strip()

        print(f"Transcription complete", file=sys.stderr)

        return {
            "success": True,
            "transcript": full_transcript,
            "language": info.language if hasattr(info, 'language') else language,
            "duration": info.duration if hasattr(info, 'duration') else 0
        }

    except Exception as e:
        print(f"Error during transcription: {str(e)}", file=sys.stderr)
        return {
            "success": False,
            "error": str(e)
        }


def main():
    parser = argparse.ArgumentParser(
        description="Transcribe audio file using faster-whisper"
    )
    parser.add_argument("audio_path", help="Path to audio file")
    parser.add_argument("--model", default="base",
                        help="Whisper model name (default: base)")
    parser.add_argument("--language", default="auto",
                        help="Language code or 'auto' (default: auto)")
    parser.add_argument("--compute-type", default="int8",
                        help="Compute type: float32, float16, int8, int8_float16 (default: int8)")

    args = parser.parse_args()

    # Run transcription
    result = transcribe_file(
        args.audio_path,
        args.model,
        args.language,
        args.compute_type
    )

    # Output result as JSON
    print(json.dumps(result))

    # Exit with error code if transcription failed
    sys.exit(0 if result["success"] else 1)


if __name__ == "__main__":
    main()
