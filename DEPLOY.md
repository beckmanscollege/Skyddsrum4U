# Deploy Skyddsrum 4 U to GitHub Pages

## One-time setup

1. Go to **https://github.com/beckmanscollege/Skyddsrum4U**
2. Click **Settings** → **Pages** (in the left sidebar)
3. Under **Build and deployment**:
   - **Source**: Select **GitHub Actions**

That's it. The workflow will run on every push to `main`.

## After pushing

1. Push your changes: `git add -A && git commit -m "..." && git push`
2. Go to the **Actions** tab to see the build/deploy progress
3. When it finishes, your site is live at:
   - **https://beckmanscollege.github.io/Skyddsrum4U/**

## Troubleshooting

- **404 on first visit**: Wait 1–2 minutes after the workflow completes. GitHub Pages can take a moment to update.
- **404 on refresh**: Make sure GitHub Pages is set to **GitHub Actions** (not "Deploy from a branch").
- **Assets not loading**: The `base` in `vite.config.ts` must be `/Skyddsrum4U/` for project pages.
