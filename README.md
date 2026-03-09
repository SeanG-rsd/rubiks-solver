# Cube Solver

A mobile app that scans a Rubik's Cube with your camera and guides you through solving it step by step.

---

## How It Works

1. **Scan** — Point your camera at each of the 6 faces. The app samples pixel colors in real time to detect the color of each tile.
2. **Solve** — Once all 6 faces are scanned, the app sends the cube state to a FastAPI backend which runs the [Kociemba two-phase algorithm](https://github.com/muodov/kociemba) to compute an optimal solution.
3. **Animate** — The solution is played back move by move on an interactive 3D cube model, so you can follow along physically.

---

## Stack

**Mobile (React Native / Expo)**
- `react-native-vision-camera` — real-time frame processing for color detection
- `@react-three/fiber` + `@react-three/drei` — 3D cube rendering and animation
- `react-native-reanimated` + `react-native-worklets-core` — performant worklet-based frame analysis
- `expo-router` — file-based tab navigation

**Backend (Python)**
- `FastAPI` — REST API server
- `kociemba` — two-phase Rubik's Cube solving algorithm, typically solves in ≤20 moves

---

## Getting Started

### Backend

```bash
cd backend
pip install fastapi uvicorn kociemba
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Mobile App

```bash
cd frontend
npm expo start
```

Make sure the mobile app's API base URL points to your backend (update in `scripts/solve-cube.ts`).

---

## Project Structure

```
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx        # Scan screen
│   │   └── solve.tsx        # Solve & animate screen
│   └── _layout.tsx          # Tab navigator
├── components/
│   └── rubiks-cube.tsx      # 3D cube component
├── scripts/
│   ├── solve-cube.ts        # API call to backend
│   └── organize-cube.ts     # Color parsing & cube validation
├── constants/
│   └── variables.ts         # Color range thresholds
└── backend/
    └── main.py              # FastAPI + kociemba solver
```
