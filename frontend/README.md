# Motion AI Studio - Frontend

Professional web interface for AI-powered 3D human motion generation and visualization.

## Overview

The Motion AI Studio frontend is a React + TypeScript application that provides an intuitive interface for:

- **Natural language motion prompts** - Describe human movements in plain English
- **Real-time 3D visualization** - Interactive Three.js skeleton viewer with orbit controls
- **Professional timeline** - View motion sequence breakdown with action tracks
- **Playback controls** - Play, pause, scrub, loop with variable speed
- **Export capabilities** - Download generated motions in multiple formats (NPY, NPZ, JSON)
- **Generation history** - Quick access to previously generated motions

## Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Three.js** - 3D rendering engine
- **@react-three/fiber** - React renderer for Three.js
- **@react-three/drei** - Three.js helpers (OrbitControls, Grid)
- **Tailwind CSS 4** - Styling
- **Lucide React** - Icons

## Project Structure

```
frontend/
├── src/
│   ├── api/
│   │   └── client.ts          # Backend API client
│   ├── components/
│   │   ├── ActionTrack.tsx    # Timeline action visualization
│   │   ├── ErrorBanner.tsx    # Error message display
│   │   ├── ExportPanel.tsx    # Export format buttons
│   │   ├── GenerationStatus.tsx # Generation status indicator
│   │   ├── HistoryPanel.tsx   # Motion history browser
│   │   ├── ModelPanel.tsx     # Model configuration panel
│   │   ├── MotionViewer.tsx   # 3D skeleton viewer (Three.js)
│   │   ├── PlaybackControls.tsx # Play/pause/loop/speed controls
│   │   ├── PromptEditor.tsx   # Motion prompt textarea
│   │   ├── Timeline.tsx       # Main timeline component
│   │   ├── TimelineRuler.tsx  # Timeline time ruler
│   │   └── TopNav.tsx         # Top navigation bar
│   ├── hooks/
│   │   └── usePlayback.ts     # Playback state management
│   ├── types/
│   │   └── motion.ts          # TypeScript type definitions
│   ├── utils/
│   │   └── skeleton.ts        # Skeleton bone definitions
│   ├── App.tsx                # Main application component
│   ├── main.tsx               # Application entry point
│   ├── styles.css             # Global styles
│   └── vite-env.d.ts          # Vite environment types
├── index.html                 # HTML template
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── vite.config.ts             # Vite configuration
└── README.md                  # This file
```

## Installation

### Prerequisites

- Node.js 18+ and npm
- Backend server running on `http://localhost:8000`

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. (Optional) Configure API URL:
   Create `.env.local` if your backend is not on the default port:
   ```bash
   VITE_API_URL=http://localhost:8000/api
   ```

## Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Development Features

- **Hot module replacement** - Changes reflect instantly
- **TypeScript checking** - Real-time type validation
- **Fast refresh** - Preserves component state during edits

## Building for Production

Build optimized production bundle:

```bash
npm run build
```

Output will be in the `dist/` directory.

Preview production build locally:

```bash
npm run preview
```

## API Integration

The frontend communicates with the FastAPI backend through a REST API client (`src/api/client.ts`).

### API Endpoints Used

- `GET /api/health` - System health check
- `POST /api/plan` - Generate motion plan from prompt
- `POST /api/generate` - Generate full motion
- `GET /api/motions` - List motion history
- `GET /api/motions/{id}` - Get motion metadata
- `GET /api/motions/{id}/data` - Get motion frame data
- `GET /api/motions/{id}/download` - Download motion file
- `DELETE /api/motions/{id}` - Delete motion

### Data Flow

1. User enters prompt in `PromptEditor`
2. `App.tsx` calls `api.generate()` with prompt
3. Backend processes with Groq + local motion model
4. Frontend receives motion ID and plan
5. `App.tsx` fetches motion data with `api.data()`
6. Data flows to `MotionViewer` (3D) and `Timeline`
7. `usePlayback` hook manages animation state

## Component Architecture

### State Management

- **Local state** - `useState` for component-local data
- **Derived state** - `useMemo` for computed values
- **Effect hooks** - `useEffect` for side effects and API calls
- **Custom hooks** - `usePlayback` for playback logic

### Key Components

#### MotionViewer
- Renders 3D skeleton using Three.js
- 22-joint HumanML3D skeleton structure
- Orbit controls for camera manipulation
- Grid floor and axis helpers
- Frame-based animation

#### Timeline
- Visualizes motion action sequence
- Shows Groq motion plan breakdown
- Multiple tracks (prompt, full body, hands, feet)
- Scrub bar for frame navigation
- Integrated playback controls

#### PromptEditor
- Multi-line textarea with character limit
- Example prompt chips for quick start
- Ctrl+Enter keyboard shortcut
- Clear button

## Styling

The application uses **Tailwind CSS 4** with a dark professional theme:

- **Background**: `#080b0f` (dark navy)
- **Panels**: `#0c1217` (slightly lighter)
- **Borders**: `#1e293b` (slate-800)
- **Accent**: `#22d3ee` (cyan-400)
- **Typography**: Inter, system UI fonts

### Design Principles

- Dark mode optimized for long sessions
- High information density without clutter
- Technical/research tool aesthetic
- Clear visual hierarchy
- Accessible color contrast

## 3D Visualization Details

### Skeleton Structure

- **22 joints** - HumanML3D standard joint structure
- **21 bones** - Connecting lines between joints
- **Joint colors**:
  - Root joint: Gold (`#f0b14a`)
  - Other joints: Light cyan (`#67d2ff`)
- **Bone color**: Cyan (`#3aa0c4`)

### Camera Controls

- **Orbit** - Left mouse drag
- **Zoom** - Scroll wheel
- **Pan** - Right mouse drag
- **Reset** - Button in control panel

### Performance

- Renders at 60 FPS
- Efficient buffer geometry
- Minimal re-renders with React.memo patterns
- Frame-based animation (typically 20 FPS motion data)

## Keyboard Shortcuts

- **Ctrl + Enter** - Generate motion from prompt

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 15+

Requires WebGL 2.0 support for Three.js rendering.

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:8000/api` | Backend API base URL |

## Troubleshooting

### Build fails with TypeScript errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### 3D viewer shows blank screen

- Check browser console for WebGL errors
- Verify browser supports WebGL 2.0
- Check motion data is valid (frames array not empty)

### API requests fail

- Verify backend is running on port 8000
- Check CORS configuration in backend
- Inspect network tab for request details

### Motion doesn't animate

- Check that frames array has multiple frames
- Verify FPS value is set correctly
- Ensure playback is not paused

## Development Tips

### Adding New Components

1. Create component file in `src/components/`
2. Use TypeScript for props interface
3. Export as named export
4. Import in parent component

### Modifying API Client

1. Update type definitions in `src/types/motion.ts`
2. Add/modify endpoint in `src/api/client.ts`
3. Update consuming components

### Styling Best Practices

- Use Tailwind utility classes
- Keep custom CSS minimal
- Use design tokens for colors
- Maintain consistent spacing scale

## Testing

```bash
npm run test
```

Test framework is configured with Vitest for unit tests.

## License

See root project LICENSE file.

## Related Documentation

- [Three.js Documentation](https://threejs.org/docs/)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- [Vite Guide](https://vitejs.dev/guide/)
- [Tailwind CSS](https://tailwindcss.com/docs)

## Support

For issues related to:
- **Backend/API** - See backend documentation
- **Motion model** - See vendor/text-to-motion
- **Frontend bugs** - Check browser console and network tab
