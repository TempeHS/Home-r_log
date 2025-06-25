#!/usr/bin/env python3
"""
Script to create simple language icon placeholders
"""

import os
from PIL import Image, ImageDraw, ImageFont

def create_language_icon(name, color, size=64):
    """create a simple square icon with language name"""
    
    # create image with solid color background
    img = Image.new('RGB', (size, size), color)
    draw = ImageDraw.Draw(img)
    
    # try to load a font, fall back to default if not available
    try:
        font = ImageFont.truetype("arial.ttf", size//4)
    except:
        font = ImageFont.load_default()
    
    # get text size and center it
    text = name[:3].upper()  # first 3 letters
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    x = (size - text_width) // 2
    y = (size - text_height) // 2
    
    # draw white text
    draw.text((x, y), text, fill='white', font=font)
    
    return img

def main():
    languages = {
        'python': '#3776ab',
        'javascript': '#f7df1e', 
        'html': '#e34f26',
        'css': '#1572b6',
        'c': '#555555',
        'cpp': '#00599c',
        'java': '#ed8b00',
        'typescript': '#3178c6',
        'php': '#777bb4',
        'go': '#00add8',
        'rust': '#000000',
        'ruby': '#cc342d',
        'default': '#666666'
    }
    
    output_dir = '/workspaces/Home-r_log/static/images/languages'
    os.makedirs(output_dir, exist_ok=True)
    
    for lang, color in languages.items():
        print(f"Creating icon for {lang}...")
        icon = create_language_icon(lang, color)
        icon.save(os.path.join(output_dir, f'{lang}.png'))
    
    print("Language icons created successfully!")

if __name__ == '__main__':
    main()
