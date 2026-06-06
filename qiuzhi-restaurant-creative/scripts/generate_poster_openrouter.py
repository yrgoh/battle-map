#!/usr/bin/env python3
"""
OpenRouter Image Generation Script
Generates restaurant promotional materials using OpenRouter API
"""

import argparse
import os
import sys
import json
import base64
from datetime import datetime
from pathlib import Path

try:
    import requests
except ImportError:
    print("Error: requests package not installed.", file=sys.stderr)
    print("Install it with: pip install requests", file=sys.stderr)
    sys.exit(1)


def generate_poster(
    prompt: str,
    api_key: str,
    model: str = "google/gemini-3-pro-image-preview",
    size: str = "1024x1792",
    output_dir: str = None
) -> str:
    """
    Generate a poster image using OpenRouter API.

    Args:
        prompt: Detailed image generation prompt
        api_key: OpenRouter API key
        model: Image generation model (default: google/gemini-3-pro-image-preview)
        size: Image size (default: 1024x1792 for vertical poster)
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

    print(f"Generating image with OpenRouter...", file=sys.stderr)
    print(f"  Model: {model}", file=sys.stderr)
    print(f"  Size: {size}", file=sys.stderr)

    try:
        # OpenRouter API endpoint - use chat completions for image generation
        url = "https://openrouter.ai/api/v1/chat/completions"

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/anthropics/claude-code",
            "X-Title": "Qiuzhi Restaurant Creative"
        }

        data = {
            "model": model,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "modalities": ["image", "text"]
        }

        response = requests.post(url, headers=headers, json=data, timeout=120)
        response.raise_for_status()

        result = response.json()

        # Get image from the message
        if "choices" in result and len(result["choices"]) > 0:
            message = result["choices"][0].get("message", {})
            images = message.get("images", [])

            if images and len(images) > 0:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                output_filename = f"restaurant_poster_{timestamp}.png"
                output_path = output_dir / output_filename

                # Get the first image URL
                image_url = images[0].get("image_url", {}).get("url", "")

                if image_url:
                    # Check if it's a base64 data URL
                    if image_url.startswith("data:image"):
                        # Extract base64 data
                        base64_data = image_url.split(",")[1]
                        img_bytes = base64.b64decode(base64_data)

                        with open(output_path, 'wb') as f:
                            f.write(img_bytes)
                    else:
                        # Download from regular URL
                        img_response = requests.get(image_url, timeout=30)
                        img_response.raise_for_status()

                        with open(output_path, 'wb') as f:
                            f.write(img_response.content)

                    print(f"✓ Image saved: {output_path}", file=sys.stderr)
                    print(output_path)  # Output path to stdout for Claude to read
                    return str(output_path)
                else:
                    print("Error: No image URL in response", file=sys.stderr)
                    sys.exit(1)
            else:
                print("Error: No images in message", file=sys.stderr)
                print(f"Response: {json.dumps(result, indent=2)}", file=sys.stderr)
                sys.exit(1)
        else:
            print("Error: No choices in response", file=sys.stderr)
            print(f"Response: {json.dumps(result, indent=2)}", file=sys.stderr)
            sys.exit(1)

    except requests.exceptions.HTTPError as e:
        print(f"HTTP Error: {e}", file=sys.stderr)
        try:
            error_detail = e.response.json()
            print(f"Error details: {json.dumps(error_detail, indent=2)}", file=sys.stderr)
        except:
            print(f"Response text: {e.response.text}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error generating image: {str(e)}", file=sys.stderr)
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description="Generate restaurant promotional posters using OpenRouter API"
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
        help="OpenRouter API key"
    )
    parser.add_argument(
        "--model",
        type=str,
        default="google/gemini-3-pro-image-preview",
        help="Image generation model (default: google/gemini-3-pro-image-preview)"
    )
    parser.add_argument(
        "--size",
        type=str,
        default="1024x1792",
        help="Image size (default: 1024x1792 for vertical poster)"
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
        model=args.model,
        size=args.size,
        output_dir=args.output_dir
    )


if __name__ == "__main__":
    main()
