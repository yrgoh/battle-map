#!/usr/bin/env python3
"""
Nano Banana Pro Image Generation Script
Generates restaurant promotional materials using Gemini 3 Pro Image API
"""

import argparse
import os
import sys
from datetime import datetime
from pathlib import Path

try:
    from google import genai
    from google.genai import types
except ImportError:
    print("Error: google-genai package not installed.", file=sys.stderr)
    print("Install it with: pip install google-genai", file=sys.stderr)
    sys.exit(1)


def generate_poster(
    prompt: str,
    api_key: str,
    aspect_ratio: str = "3:4",
    image_size: str = "2K",
    output_dir: str = None
) -> str:
    """
    Generate a poster image using Nano Banana Pro API.

    Args:
        prompt: Detailed image generation prompt
        api_key: Google API key
        aspect_ratio: Image aspect ratio (default: 3:4 for vertical poster)
        image_size: Image resolution - 1K, 2K, or 4K (default: 2K)
        output_dir: Directory to save the generated image

    Returns:
        Path to the generated image file
    """
    # Set up output directory
    if output_dir is None:
        output_dir = Path.home() / ".claude" / "skills" / "qiuzhi-restaurant-creative" / "assets" / "output"
    else:
        output_dir = Path(output_dir)

    output_dir.mkdir(parents=True, exist_ok=True)

    # Initialize client with API key
    client = genai.Client(api_key=api_key)

    print(f"Generating image with Nano Banana Pro...", file=sys.stderr)
    print(f"  Aspect Ratio: {aspect_ratio}", file=sys.stderr)
    print(f"  Resolution: {image_size}", file=sys.stderr)

    try:
        # Generate content
        response = client.models.generate_content(
            model="gemini-3-pro-image-preview",
            contents=[prompt],
            config=types.GenerateContentConfig(
                response_modalities=['TEXT', 'IMAGE'],
                image_config=types.ImageConfig(
                    aspect_ratio=aspect_ratio,
                    image_size=image_size
                )
            )
        )

        # Find and save the image
        image_saved = False
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        for part in response.candidates[0].content.parts:
            if hasattr(part, 'inline_data') and part.inline_data:
                # Save image data
                output_filename = f"restaurant_poster_{timestamp}.png"
                output_path = output_dir / output_filename

                with open(output_path, 'wb') as f:
                    f.write(part.inline_data.data)

                print(f"✓ Image saved: {output_path}", file=sys.stderr)
                print(output_path)  # Output path to stdout for Claude to read
                image_saved = True
                return str(output_path)

        if not image_saved:
            print("Error: No image data in response", file=sys.stderr)
            sys.exit(1)

    except Exception as e:
        print(f"Error generating image: {str(e)}", file=sys.stderr)
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description="Generate restaurant promotional posters using Nano Banana Pro API"
    )
    parser.add_argument(
        "prompt",
        type=str,
        help="Detailed image generation prompt"
    )
    parser.add_argument(
        "--api-key",
        type=str,
        required=True,
        help="Google API key for Gemini API"
    )
    parser.add_argument(
        "--aspect-ratio",
        type=str,
        default="3:4",
        choices=["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"],
        help="Image aspect ratio (default: 3:4)"
    )
    parser.add_argument(
        "--image-size",
        type=str,
        default="2K",
        choices=["1K", "2K", "4K"],
        help="Image resolution (default: 2K)"
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default=None,
        help="Output directory for generated images"
    )

    args = parser.parse_args()

    generate_poster(
        prompt=args.prompt,
        api_key=args.api_key,
        aspect_ratio=args.aspect_ratio,
        image_size=args.image_size,
        output_dir=args.output_dir
    )


if __name__ == "__main__":
    main()
