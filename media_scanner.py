#!/usr/bin/env python3
"""
Media Scanner and Thumbnail Generator
Scans a volume for images, videos, and audio files, generates thumbnails, and creates a JSON index.
"""

import os
import json
import hashlib
import subprocess
import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import mimetypes

from PIL import Image
import piexif

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%H:%M:%S'
)

# Configuration
SOURCE_VOLUME = "/Volumes/KINGSTON/"
OUTPUT_DIR = Path(__file__).parent  # Current directory (media-viewer)
THUMBNAILS_DIR = OUTPUT_DIR / "public" / "thumbnails"
OUTPUT_JSON = OUTPUT_DIR / "public" / "media_index.json"
THUMBNAIL_WIDTH = 800
VIDEO_FRAME_COUNT = 5

# Supported file extensions
IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.tif', '.webp', '.heic', '.heif'}
VIDEO_EXTENSIONS = {'.mp4', '.mov', '.avi', '.mkv', '.m4v', '.wmv', '.flv', '.webm', '.mpeg', '.mpg', '.3gp'}
AUDIO_EXTENSIONS = {'.mp3', '.wav', '.flac', '.m4a', '.aac', '.ogg', '.wma', '.opus'}

# System folders to skip
SKIP_FOLDERS = {'.Trash', '.Spotlight-V100', '.fseventsd', '.DocumentRevisions-V100',
                '.TemporaryItems', '.VolumeIcon.icns', 'System Volume Information', '$RECYCLE.BIN'}


def should_skip_path(path: Path) -> bool:
    """Check if a path should be skipped."""
    parts = path.parts
    for part in parts:
        if part.startswith('.') and part in SKIP_FOLDERS:
            return True
        if part.startswith('.') and len(part) > 1:
            # Skip hidden folders except .thumbnails
            if part != '.thumbnails':
                return True
    return False


def get_file_type(file_path: Path) -> Optional[str]:
    """Determine if file is image, video, or audio."""
    ext = file_path.suffix.lower()
    if ext in IMAGE_EXTENSIONS:
        return 'image'
    elif ext in VIDEO_EXTENSIONS:
        return 'video'
    elif ext in AUDIO_EXTENSIONS:
        return 'audio'
    return None


def get_creation_date(file_path: Path, file_type: str) -> str:
    """Extract creation date from file metadata."""
    try:
        # Try EXIF for images
        if file_type == 'image':
            try:
                exif_dict = piexif.load(str(file_path))
                if piexif.ExifIFD.DateTimeOriginal in exif_dict.get('Exif', {}):
                    date_str = exif_dict['Exif'][piexif.ExifIFD.DateTimeOriginal].decode()
                    dt = datetime.strptime(date_str, '%Y:%m:%d %H:%M:%S')
                    return dt.isoformat() + 'Z'
            except:
                pass

        # Try ffprobe for videos/audio
        if file_type in ['video', 'audio']:
            try:
                result = subprocess.run([
                    'ffprobe', '-v', 'quiet', '-print_format', 'json',
                    '-show_entries', 'format_tags=creation_time',
                    str(file_path)
                ], capture_output=True, text=True, timeout=10)

                if result.returncode == 0:
                    data = json.loads(result.stdout)
                    creation_time = data.get('format', {}).get('tags', {}).get('creation_time')
                    if creation_time:
                        return creation_time
            except:
                pass

        # Fallback to file system creation time
        stat = file_path.stat()
        birthtime = getattr(stat, 'st_birthtime', None) or stat.st_mtime
        return datetime.fromtimestamp(birthtime).isoformat() + 'Z'

    except Exception as e:
        logging.warning(f"Could not get creation date for {file_path.name}: {e}")
        return datetime.now().isoformat() + 'Z'


def get_image_metadata(file_path: Path) -> Dict:
    """Extract metadata from image file."""
    try:
        with Image.open(file_path) as img:
            width, height = img.size
            return {
                'resolution': {'width': width, 'height': height},
                'duration': None,
                'format': img.format.lower() if img.format else file_path.suffix[1:].lower()
            }
    except Exception as e:
        logging.error(f"Error reading image metadata for {file_path.name}: {e}")
        return {
            'resolution': {'width': 0, 'height': 0},
            'duration': None,
            'format': file_path.suffix[1:].lower()
        }


def get_video_metadata(file_path: Path) -> Dict:
    """Extract metadata from video file using ffprobe."""
    try:
        result = subprocess.run([
            'ffprobe', '-v', 'quiet', '-print_format', 'json',
            '-show_entries', 'stream=width,height,duration:format=duration',
            str(file_path)
        ], capture_output=True, text=True, timeout=30)

        if result.returncode == 0:
            data = json.loads(result.stdout)

            # Get video stream info
            video_stream = next((s for s in data.get('streams', []) if s.get('width')), None)

            width = video_stream.get('width', 0) if video_stream else 0
            height = video_stream.get('height', 0) if video_stream else 0

            # Get duration
            duration = None
            if video_stream and 'duration' in video_stream:
                duration = float(video_stream['duration'])
            elif 'format' in data and 'duration' in data['format']:
                duration = float(data['format']['duration'])

            return {
                'resolution': {'width': width, 'height': height},
                'duration': duration,
                'format': file_path.suffix[1:].lower()
            }
    except Exception as e:
        logging.error(f"Error reading video metadata for {file_path.name}: {e}")

    return {
        'resolution': {'width': 0, 'height': 0},
        'duration': None,
        'format': file_path.suffix[1:].lower()
    }


def get_audio_metadata(file_path: Path) -> Dict:
    """Extract metadata from audio file using ffprobe."""
    try:
        result = subprocess.run([
            'ffprobe', '-v', 'quiet', '-print_format', 'json',
            '-show_entries', 'format=duration',
            str(file_path)
        ], capture_output=True, text=True, timeout=30)

        if result.returncode == 0:
            data = json.loads(result.stdout)
            duration = None
            if 'format' in data and 'duration' in data['format']:
                duration = float(data['format']['duration'])

            return {
                'resolution': None,
                'duration': duration,
                'format': file_path.suffix[1:].lower()
            }
    except Exception as e:
        logging.error(f"Error reading audio metadata for {file_path.name}: {e}")

    return {
        'resolution': None,
        'duration': None,
        'format': file_path.suffix[1:].lower()
    }


def generate_image_thumbnail(file_path: Path, output_path: Path) -> bool:
    """Generate thumbnail for image file."""
    try:
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with Image.open(file_path) as img:
            # Convert RGBA to RGB if necessary
            if img.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')

            # Calculate new dimensions
            width, height = img.size
            if width > THUMBNAIL_WIDTH:
                new_height = int(height * THUMBNAIL_WIDTH / width)
                img = img.resize((THUMBNAIL_WIDTH, new_height), Image.Resampling.LANCZOS)

            # Save as WebP
            img.save(output_path, 'WEBP', quality=85)
            return True

    except Exception as e:
        logging.error(f"Error generating thumbnail for {file_path.name}: {e}")
        return False


def generate_video_thumbnails(file_path: Path, output_dir: Path, duration: Optional[float]) -> Tuple[Optional[str], List[str]]:
    """Generate 5 thumbnails distributed across video duration."""
    if not duration or duration <= 0:
        return None, []

    try:
        output_dir.mkdir(parents=True, exist_ok=True)
        base_name = file_path.stem

        # Calculate timestamps for 5 frames
        timestamps = [duration * i / (VIDEO_FRAME_COUNT + 1) for i in range(1, VIDEO_FRAME_COUNT + 1)]

        frames = []
        for idx, timestamp in enumerate(timestamps):
            frame_path = output_dir / f"{base_name}_frame_{idx}.webp"

            # Extract frame using ffmpeg
            result = subprocess.run([
                'ffmpeg', '-ss', str(timestamp), '-i', str(file_path),
                '-vframes', '1', '-vf', f'scale={THUMBNAIL_WIDTH}:-1',
                '-y', str(frame_path)
            ], capture_output=True, timeout=30)

            if result.returncode == 0 and frame_path.exists():
                frames.append(str(frame_path.relative_to(OUTPUT_DIR / "public")))

        # Use middle frame as main thumbnail
        main_thumbnail = frames[len(frames) // 2] if frames else None

        return main_thumbnail, frames

    except Exception as e:
        logging.error(f"Error generating video thumbnails for {file_path.name}: {e}")
        return None, []


def generate_audio_waveform(file_path: Path, output_path: Path, duration: Optional[float]) -> bool:
    """Generate waveform visualization for audio file."""
    try:
        output_path.parent.mkdir(parents=True, exist_ok=True)

        # Use ffmpeg to generate waveform
        result = subprocess.run([
            'ffmpeg', '-i', str(file_path),
            '-filter_complex', f'showwavespic=s={THUMBNAIL_WIDTH}x400:colors=0x3b82f6',
            '-frames:v', '1', '-y', str(output_path)
        ], capture_output=True, timeout=30)

        if result.returncode == 0 and output_path.exists():
            return True

    except Exception as e:
        logging.error(f"Error generating waveform for {file_path.name}: {e}")

    return False


def process_file(file_path: Path, relative_path: Path) -> Optional[Dict]:
    """Process a single media file and return its metadata."""
    file_type = get_file_type(file_path)
    if not file_type:
        return None

    logging.info(f"Processing {file_type}: {relative_path}")

    # Generate unique ID
    file_id = hashlib.md5(str(relative_path).encode()).hexdigest()[:16]

    # Get file size
    file_size = file_path.stat().st_size

    # Get creation date
    creation_date = get_creation_date(file_path, file_type)

    # Get type-specific metadata
    if file_type == 'image':
        metadata = get_image_metadata(file_path)
    elif file_type == 'video':
        metadata = get_video_metadata(file_path)
    else:  # audio
        metadata = get_audio_metadata(file_path)

    # Generate thumbnails
    thumbnail_dir = THUMBNAILS_DIR / relative_path.parent
    main_thumbnail = None
    frames = []

    if file_type == 'image':
        thumbnail_path = thumbnail_dir / f"{file_path.stem}.webp"
        if generate_image_thumbnail(file_path, thumbnail_path):
            main_thumbnail = str(thumbnail_path.relative_to(OUTPUT_DIR / "public"))

    elif file_type == 'video':
        main_thumbnail, frames = generate_video_thumbnails(
            file_path, thumbnail_dir, metadata['duration']
        )

    elif file_type == 'audio':
        thumbnail_path = thumbnail_dir / f"{file_path.stem}_waveform.webp"
        if generate_audio_waveform(file_path, thumbnail_path, metadata['duration']):
            main_thumbnail = str(thumbnail_path.relative_to(OUTPUT_DIR / "public"))

    # Build file entry
    return {
        'id': file_id,
        'type': file_type,
        'relativePath': str(relative_path),
        'fileName': file_path.name,
        'metadata': {
            'creationDate': creation_date,
            'fileSize': file_size,
            'resolution': metadata['resolution'],
            'duration': metadata['duration'],
            'format': metadata['format']
        },
        'thumbnails': {
            'main': main_thumbnail,
            'frames': frames
        },
        'googleDrive': {
            'url': '',
            'fileId': ''
        }
    }


def scan_volume(volume_path: str) -> List[Dict]:
    """Scan volume for media files and process them."""
    volume = Path(volume_path)
    if not volume.exists():
        raise FileNotFoundError(f"Volume not found: {volume_path}")

    files = []
    total_files = 0
    current_dir = None

    logging.info(f"Starting scan of {volume_path}...")

    for file_path in volume.rglob('*'):
        # Log directory changes
        if file_path.parent != current_dir:
            current_dir = file_path.parent
            logging.info(f"Scanning directory: {current_dir.relative_to(volume)}")

        if file_path.is_file() and not should_skip_path(file_path):
            if get_file_type(file_path):
                total_files += 1
                relative_path = file_path.relative_to(volume)

                try:
                    file_data = process_file(file_path, relative_path)
                    if file_data:
                        files.append(file_data)
                        # Progress update every 10 files
                        if len(files) % 10 == 0:
                            logging.info(f"Progress: {len(files)} files processed")
                except Exception as e:
                    logging.error(f"Error processing {file_path}: {e}")

    logging.info(f"Scan complete! Processed {len(files)} out of {total_files} media files")
    return files


def main():
    """Main execution function."""
    logging.info("=" * 60)
    logging.info("Media Scanner and Thumbnail Generator")
    logging.info("=" * 60)

    # Create output directory
    (OUTPUT_DIR / "public").mkdir(exist_ok=True)
    THUMBNAILS_DIR.mkdir(parents=True, exist_ok=True)
    logging.info(f"Output directory: {OUTPUT_DIR / 'public'}")
    logging.info(f"Thumbnails directory: {THUMBNAILS_DIR}")

    # Scan volume
    files = scan_volume(SOURCE_VOLUME)

    # Calculate statistics
    stats = {
        'images': sum(1 for f in files if f['type'] == 'image'),
        'videos': sum(1 for f in files if f['type'] == 'video'),
        'audio': sum(1 for f in files if f['type'] == 'audio')
    }

    logging.info(f"Building JSON structure...")

    # Build final JSON structure
    output_data = {
        'metadata': {
            'generatedAt': datetime.now().isoformat() + 'Z',
            'sourceVolume': SOURCE_VOLUME,
            'totalFiles': len(files),
            'stats': stats
        },
        'files': files
    }

    # Write JSON file
    logging.info(f"Writing JSON to {OUTPUT_JSON}")
    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)

    logging.info("=" * 60)
    logging.info(f"SUCCESS! Generated {OUTPUT_JSON}")
    logging.info(f"Total files: {len(files)}")
    logging.info(f"  - Images: {stats['images']}")
    logging.info(f"  - Videos: {stats['videos']}")
    logging.info(f"  - Audio: {stats['audio']}")
    logging.info(f"Thumbnails stored in: {THUMBNAILS_DIR}")
    logging.info("=" * 60)


if __name__ == '__main__':
    main()
