# Media Viewer

A web-based media gallery that scans a volume for images, videos, and audio files, generates thumbnails, and presents them in an interactive timeline view.

## Features

- **Media Scanner**: Python script that scans a volume and generates:
  - Web-optimized thumbnails (WebP format, 800px width)
  - Video frame previews (5 frames distributed across duration)
  - Audio waveform visualizations
  - JSON index with complete metadata

- **Web Viewer**: React-based gallery with:
  - Date-based grouping and timeline view
  - Search and filter functionality (Images/Videos/Audio)
  - Video thumbnail cycling on hover
  - Duration overlays and metadata display
  - Responsive grid layout

## Project Structure

```
media-viewer/
├── media_scanner.py       # Python scanner script
├── requirements.txt       # Python dependencies
├── public/                # Static assets (created by scanner)
│   ├── media_index.json   # Generated media index
│   └── thumbnails/        # Generated thumbnails
├── src/                   # React application source
│   ├── components/
│   │   └── MediaCard.jsx
│   ├── App.jsx
│   └── main.jsx
├── package.json
├── vite.config.js
└── DEPLOY.md             # Deployment instructions
```

## Prerequisites

### For Scanner
- Python 3.8+
- FFmpeg (for video and audio processing)
- Pillow and piexif (install via requirements.txt)

### For Web Viewer
- Node.js 18+
- npm

## Installation

### 1. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 2. Install Node Dependencies

```bash
npm install
```

## Usage

### Step 1: Scan Media Files

Edit `media_scanner.py` to set your source volume:

```python
SOURCE_VOLUME = "/Volumes/KINGSTON/"  # Change to your volume path
```

Run the scanner:

```bash
python3 media_scanner.py
```

The scanner will:
- Traverse the source volume for media files
- Extract metadata (creation date, resolution, duration)
- Generate thumbnails in `public/thumbnails/`
- Create `public/media_index.json` with all file information

### Step 2: Run the Web Viewer

Start the development server:

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

## Scanner Details

### Supported Formats

- **Images**: JPG, PNG, GIF, BMP, TIFF, WebP, HEIC, HEIF
- **Videos**: MP4, MOV, AVI, MKV, M4V, WMV, FLV, WebM, MPEG, 3GP
- **Audio**: MP3, WAV, FLAC, M4A, AAC, OGG, WMA, Opus

### Metadata Extraction

- **Images**: EXIF data for creation date, resolution
- **Videos**: FFprobe for creation date, resolution, duration
- **Audio**: FFprobe for duration

### Thumbnail Generation

- **Images**: Resized to 800px width, converted to WebP
- **Videos**: 5 frames extracted at even intervals
- **Audio**: Waveform visualization

## Deployment

See [DEPLOY.md](DEPLOY.md) for detailed deployment instructions to GitHub Pages.

Quick deploy:

```bash
# Update vite.config.js with your repo name first
npm run deploy
```

## Configuration

### Scanner Configuration (media_scanner.py)

```python
SOURCE_VOLUME = "/Volumes/KINGSTON/"           # Source volume to scan
THUMBNAIL_WIDTH = 800                          # Thumbnail width in pixels
VIDEO_FRAME_COUNT = 5                          # Number of frames per video
```

### Vite Configuration (vite.config.js)

```javascript
export default defineConfig({
  plugins: [react()],
  base: '/media-viewer/',  // Change to your GitHub repo name for deployment
})
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run deploy` - Deploy to GitHub Pages

### Project Technologies

- **Frontend**: React 19, Vite 7, Tailwind CSS 4
- **Scanner**: Python 3, Pillow, FFmpeg
- **Deployment**: GitHub Pages via gh-pages

## Troubleshooting

### Scanner Issues

**FFmpeg not found**: Install FFmpeg using:
- macOS: `brew install ffmpeg`
- Linux: `apt-get install ffmpeg`
- Windows: Download from https://ffmpeg.org/

**HEIC images not supported**: Install additional Pillow support:
```bash
pip install pillow-heif
```

### Web Viewer Issues

**Blank page in production**: Check that `base` in `vite.config.js` matches your repository name.

**Images not loading**: Ensure `public/media_index.json` exists and paths in JSON are relative (e.g., `thumbnails/...`).

## License

This project is provided as-is for personal use.
