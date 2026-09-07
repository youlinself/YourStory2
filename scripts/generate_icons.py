#!/usr/bin/env python3
"""Generate all Tauri icon sizes from project_logo.png"""

from PIL import Image
import os
import struct
import zlib

ICONS_DIR = os.path.join(os.path.dirname(__file__), "..", "src-tauri", "icons")
SOURCE_IMAGE = os.path.join(ICONS_DIR, "project_logo.png")

# Target sizes for PNG icons
PNG_SIZES = {
    "32x32.png": (32, 32),
    "128x128.png": (128, 128),
    "128x128@2x.png": (256, 256),
    "Square30x30Logo.png": (30, 30),
    "Square44x44Logo.png": (44, 44),
    "Square71x71Logo.png": (71, 71),
    "Square89x89Logo.png": (89, 89),
    "Square107x107Logo.png": (107, 107),
    "Square142x142Logo.png": (142, 142),
    "Square150x150Logo.png": (150, 150),
    "Square284x284Logo.png": (284, 284),
    "Square310x310Logo.png": (310, 310),
    "StoreLogo.png": (50, 50),
    "icon.png": (512, 512),
}

def create_ico_file(source_img, output_path, sizes=[(16,16), (32,32), (48,48), (64,64), (128,128), (256,256)]):
    """Create a multi-resolution ICO file"""
    images = []
    for size in sizes:
        img = source_img.resize(size, Image.Resampling.LANCZOS)
        # Save to bytes as PNG
        import io
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        images.append((size, buf.getvalue()))
    
    # ICO header
    num_images = len(images)
    header = struct.pack('<HHH', 0, 1, num_images)
    
    # Calculate offsets
    offset = 6 + num_images * 16
    entries = []
    data_blocks = []
    
    for size, png_data in images:
        width, height = size
        if width >= 256:
            width = 0
        if height >= 256:
            height = 0
        entry = struct.pack('<BBBBHHII', width, height, 0, 0, 1, 32, len(png_data), offset)
        entries.append(entry)
        data_blocks.append(png_data)
        offset += len(png_data)
    
    with open(output_path, 'wb') as f:
        f.write(header)
        for entry in entries:
            f.write(entry)
        for block in data_blocks:
            f.write(block)

def create_icns_file(source_img, output_path):
    """Create a basic ICNS file for macOS"""
    # ICNS format: header + icon entries
    icon_types = {
        "ic07": (128, 128),   # 128x128
        "ic08": (256, 256),   # 256x256
        "ic09": (512, 512),   # 512x512
        "ic10": (1024, 1024), # 1024x1024 (if available)
        "ic11": (32, 32),     # 16x16@2x
        "ic12": (64, 64),     # 32x32@2x
        "ic13": (256, 256),   # 128x128@2x
        "ic14": (512, 512),   # 256x256@2x
        "icp4": (16, 16),     # 16x16
        "icp5": (32, 32),     # 32x32
        "icp6": (64, 64),     # 64x64
    }
    
    import io
    
    blocks = []
    total_size = 8  # header size
    
    for icon_type, size in icon_types.items():
        img = source_img.resize(size, Image.Resampling.LANCZOS)
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        png_data = buf.getvalue()
        
        # Block: 4 bytes type + 4 bytes length + data
        block = icon_type.encode('ascii') + struct.pack('>I', 8 + len(png_data)) + png_data
        blocks.append(block)
        total_size += len(block)
    
    with open(output_path, 'wb') as f:
        f.write(b'icns')  # magic
        f.write(struct.pack('>I', total_size))  # total file size
        for block in blocks:
            f.write(block)

def main():
    print(f"Loading source image: {SOURCE_IMAGE}")
    source = Image.open(SOURCE_IMAGE).convert("RGBA")
    
    # Generate PNG icons
    print("\nGenerating PNG icons...")
    for filename, size in PNG_SIZES.items():
        output_path = os.path.join(ICONS_DIR, filename)
        resized = source.resize(size, Image.Resampling.LANCZOS)
        resized.save(output_path, format="PNG")
        print(f"  Created {filename} ({size[0]}x{size[1]})")
    
    # Generate ICO file
    print("\nGenerating icon.ico...")
    ico_path = os.path.join(ICONS_DIR, "icon.ico")
    create_ico_file(source, ico_path)
    print(f"  Created icon.ico")
    
    # Generate ICNS file
    print("\nGenerating icon.icns...")
    icns_path = os.path.join(ICONS_DIR, "icon.icns")
    create_icns_file(source, icns_path)
    print(f"  Created icon.icns")
    
    print("\nDone! All icons generated successfully.")

if __name__ == "__main__":
    main()
