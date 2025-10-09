# GrayTool Chrome Extension

A Chrome extension tool for Graylog that injects buttons in Graylog logs to query your admin panel.

## Development Setup

### Prerequisites
- Node.js (version 16 or higher)
- npm

### Installation

1. Clone the repository and navigate to the project directory
2. Install dependencies:
   ```bash
   npm install
   ```

### Building the Extension

#### Development Build (with source maps)
```bash
npm run build
```

#### Production Build (minified)
```bash
npm run build:prod
```

#### Watch Mode (for development)
```bash
npm run dev
```

This will watch for changes and automatically rebuild the CSS and JavaScript files.

#### Clean Build Directory
```bash
npm run clean
```

### Loading the Extension in Chrome

1. Build the extension: `npm run build`
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the project directory
5. The extension should now be loaded and visible in your extensions

### Development Workflow

1. Make changes to your code
2. Run `npm run dev` to start watch mode
3. The files will be automatically rebuilt when you save changes
4. Reload the extension in Chrome by clicking the reload button on the extension card

### Technologies Used

- **React** - UI framework
- **TypeScript** - Type-safe JavaScript
- **TailwindCSS** - Utility-first CSS framework
- **esbuild** - Fast JavaScript bundler
- **Chrome Extensions Manifest V3** - Latest Chrome extension format

## Usage

After installing the extension, it will be available in your Chrome toolbar. The extension works on Graylog pages that match the patterns defined in `manifest.json`.
