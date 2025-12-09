# Deployment Instructions

This guide will help you deploy your media viewer to GitHub Pages.

## Prerequisites

1. A GitHub account
2. Git installed on your machine
3. Node.js and npm installed

## Steps to Deploy

### 1. Wait for Scanner to Complete

Make sure the media scanner has finished running and generated:
- `public/media_index.json` - The JSON index file
- `public/thumbnails/` - The thumbnails directory

The scanner outputs directly to the `public/` directory, so no copying is needed.

### 2. Create GitHub Repository

1. Go to GitHub and create a new repository (e.g., `media-viewer`)
2. **Important**: Update `vite.config.js` and change the `base` setting to match your repo name:
   ```js
   base: '/your-repo-name/',
   ```

### 3. Initialize Git and Push

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Media viewer with thumbnails"

# Add remote (replace with your repo URL)
git remote add origin https://github.com/yourusername/your-repo-name.git

# Push to main branch
git branch -M main
git push -u origin main
```

### 4. Deploy to GitHub Pages

```bash
npm run deploy
```

This command will:
1. Build the production version of your site
2. Create a `gh-pages` branch
3. Push the built files to that branch

### 5. Configure GitHub Pages

1. Go to your repository on GitHub
2. Click on **Settings**
3. Scroll down to **Pages** in the left sidebar
4. Under **Source**, select `gh-pages` branch
5. Click **Save**

Your site will be available at: `https://yourusername.github.io/your-repo-name/`

## Updating the Site

Whenever you want to update the site (e.g., after scanning new media):

1. Run the scanner again:
   ```bash
   python3 media_scanner.py
   ```

2. Commit changes:
   ```bash
   git add .
   git commit -m "Update media library"
   git push
   ```

3. Redeploy:
   ```bash
   npm run deploy
   ```

## Troubleshooting

### Blank Page After Deployment

If you see a blank page:
1. Check that the `base` in `vite.config.js` matches your repository name
2. Make sure it starts and ends with `/` (e.g., `/media-viewer/`)
3. Redeploy after fixing

### Images Not Loading

1. Verify that `public/media_index.json` and `public/thumbnails/` exist
2. Check browser console for 404 errors
3. Ensure paths in JSON are relative (e.g., `thumbnails/...`)

### Build Errors

If you get errors during `npm run build`:
1. Check that all dependencies are installed: `npm install`
2. Verify that React components have no syntax errors
3. Run `npm run lint` to check for linting issues

## Local Testing

Before deploying, test locally:

```bash
npm run dev
```

Open http://localhost:5173 in your browser to preview.

To test the production build locally:

```bash
npm run build
npm run preview
```

## File Structure

After copying media files, your `public/` directory should look like:

```
public/
├── media_index.json
└── thumbnails/
    ├── Photos/
    │   └── 2024/
    │       └── IMG_1234.webp
    ├── Videos/
    │   └── video_frame_0.webp
    └── ...
```

## Notes

- The `public/` folder contents are served as static assets
- Thumbnail paths in JSON should be relative: `thumbnails/path/to/file.webp`
- GitHub Pages has a 1GB size limit per repository
- Large media libraries may need optimization or external hosting
