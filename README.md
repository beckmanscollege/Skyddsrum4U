# Skyddsrum 4 U

A React/Vite web app for Swedish civil defense shelter (skyddsrum) statistics and the "Hinner du till ett skyddsrum?" quiz. Built with React, Tailwind CSS, and Recharts.

Original design: [Figma](https://www.figma.com/design/z9xnxzS0K0Zob1cAyNeYkP/Sveriges-skyddsrum-hemsida)

## Features

- Homepage with hero and consequence sections
- Statistics section with interactive charts (Sverige, Stockholm, Göteborg, Malmö)
- "Hinner du till ett skyddsrum?" quiz (5 questions)
- Deep dive into skyddsrum data and coverage over time

## Getting started

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

The built site will be in the `dist/` folder.

## Deploy to GitHub Pages

1. **Enable GitHub Pages** (one-time):
   - Go to [github.com/beckmanscollege/Skyddsrum4U](https://github.com/beckmanscollege/Skyddsrum4U) → **Settings** → **Pages**
   - Under "Build and deployment", set **Source** to **GitHub Actions**

2. **Push to deploy**: Every push to `main` automatically builds and deploys. The site will be at:
   - **https://beckmanscollege.github.io/Skyddsrum4U/**

## Tech stack

- React 18
- Vite 6
- Tailwind CSS 4
- Recharts
- Radix UI components

## License

See [ATTRIBUTIONS.md](ATTRIBUTIONS.md) for third-party licenses.
