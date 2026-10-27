import { useCubeStore } from "@/context/CubeContext";
import { printCube } from "@/scripts/organize-cube";
import { cubeToString, solveCube } from "@/scripts/solve-cube";
import { useIsFocused } from "expo-router/react-navigation";
import { OrbitControls } from "@react-three/drei/native";
import { Canvas } from "@react-three/fiber/native";
import { useFocusEffect } from "expo-router";
import { Suspense, useCallback, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import RubiksCube from "../../components/rubiks-cube";

// R -> R', R' -> R, R2 -> R2
const invertMove = (move) => {
  if (move.endsWith("'")) return move.slice(0, -1);
  if (move.endsWith("2")) return move;
  return `${move}'`;
};

export default function Solve() {
  const modelRef = useRef();
  const cameraRef = useRef();

  const [resetKey, setResetKey] = useState(0);

  const [moves, setMoves] = useState([]);

  const isFocused = useIsFocused();

  const { detectedSides, validCube } = useCubeStore();

  const [currentSides, setCurrentSides] = useState([]);

  const [nextMove, setNextMove] = useState("");

  const [currentMove, setCurrentMove] = useState("");

  // Why the solver rejected the scanned cube, e.g. "an edge is flipped"
  const [solveError, setSolveError] = useState(null);

  // Bumped on every animated move so the cube replays even if the move string is unchanged (e.g. undoing R2)
  const [moveId, setMoveId] = useState(0);

  // Moves already played, most recent last, so they can be undone
  const [history, setHistory] = useState([]);

  // Ignore taps while a turn is animating, otherwise the move list and the cube drift apart
  const isAnimating = useRef(false);

  const playMove = (move) => {
    isAnimating.current = true;
    setCurrentMove(move);
    setMoveId((id) => id + 1);
  };

  const startNextMove = () => {
    if (isAnimating.current || nextMove === "" || nextMove === "Solved") return;

    // console.log(`Animating Move: ${nextMove}`);

    playMove(nextMove);
    setHistory([...history, nextMove]);

    if (moves.length > 0) {
      setNextMove(moves[0]);
      setMoves(moves.slice(1));
    } else {
      setNextMove("Solved");
    }
  };

  const startPrevMove = () => {
    if (isAnimating.current || history.length === 0) return;

    const lastMove = history[history.length - 1];
    // console.log(`Undoing Move: ${lastMove}`);

    playMove(invertMove(lastMove));
    setHistory(history.slice(0, -1));

    if (nextMove !== "Solved") {
      setMoves([nextMove, ...moves]);
    }
    setNextMove(lastMove);
  };

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      // The cube is repainted from the scanned state when the screen remounts, so start over
      isAnimating.current = false;
      setHistory([]);
      setSolveError(null);

      const solve = async () => {
        // printCube(detectedSides.value);
        const cube = cubeToString(detectedSides.value);

        try {
          const algorithm = await solveCube(cube);

          if (isActive) {
            if (algorithm === "") {
              setNextMove("Solved");
              setMoves([]);
              return;
            }

            const moves = algorithm.split(" ");
            setNextMove(moves[0]);
            // console.log(moves);
            setMoves(moves.splice(1));
          }
        } catch (e) {
          // console.log("Could not solve:", e.message);
          if (isActive) {
            setSolveError(e?.message || "the scanned colors don't make a real cube");
            setNextMove("");
            setMoves([]);
          }
        }
      };

      if (validCube.value) {
        setCurrentSides(detectedSides.value);
        solve();
      } else {
        setCurrentSides([]);
      }
      return () => {
        isActive = false;
      };
    }, []),
  );

  return (
    <View style={styles.container} key={isFocused}>
      <View style={styles.moveContainer}>
        {solveError ? (
          <>
            <Text style={[styles.moveLabel, styles.errorLabel]}>NO SOLUTION</Text>
            <Text style={styles.errorTitle}>
              {solveError.charAt(0).toUpperCase() + solveError.slice(1)}
            </Text>
            <Text style={styles.errorHint}>
              A sticker was probably misread. Reset the scan and try again.
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.moveLabel}>NEXT MOVE</Text>
            <Text style={styles.moveText}>{nextMove || "—"}</Text>
          </>
        )}
        <View style={styles.moveDivider} />
      </View>

      <Canvas
        style={styles.canvas}
        frameloop={isFocused ? "always" : "never"}
        key={resetKey}
      >
        <ambientLight intensity={2.0} />
        <directionalLight color="white" position={[1, 1, 2]} />
        <Suspense fallback={null}>
          <RubiksCube
            modelRef={modelRef}
            sides={currentSides}
            currentMove={currentMove}
            moveId={moveId}
            onMoveComplete={() => {
              isAnimating.current = false;
            }}
          ></RubiksCube>
          <OrbitControls
            enableRotate={true}
            rotateSpeed={2.5}
            enableZoom={false}
            enablePan={false}
            ref={cameraRef}
          />
        </Suspense>
      </Canvas>

      <View style={styles.controlPanel}>
        <View style={styles.movesRemainingBadge}>
          <Text style={styles.movesRemainingText}>
            {moves.length} moves left
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={() => startPrevMove()}
          >
            <Text style={styles.buttonTextSecondary}>{"← Prev"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary]}
            onPress={() => {
              startNextMove();
            }}
          >
            <Text style={styles.buttonTextPrimary}>{"Next →"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D0D",
  },

  moveContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: 60,
    paddingHorizontal: 28,
    paddingBottom: 16,
    backgroundColor: "rgba(13,13,13,0.85)",
    alignItems: "center",
  },
  moveLabel: {
    color: "#C49A00",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 4,
    marginBottom: 6,
  },
  moveText: {
    color: "#FFFFFF",
    fontSize: 52,
    fontWeight: "900",
    letterSpacing: -1,
    lineHeight: 58,
  },
  errorLabel: {
    color: "#E5484D",
  },
  errorTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 6,
  },
  errorHint: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 20,
  },
  moveDivider: {
    marginTop: 14,
    width: 40,
    height: 2,
    backgroundColor: "#C49A00",
    borderRadius: 2,
  },

  canvas: {
    flex: 1,
    backgroundColor: "transparent",
  },

  controlPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 44,
    paddingTop: 20,
    paddingHorizontal: 24,
    backgroundColor: "rgba(13,13,13,0.90)",
    borderTopWidth: 1,
    borderTopColor: "rgba(196,154,0,0.18)",
    alignItems: "center",
    gap: 16,
  },
  movesRemainingBadge: {
    backgroundColor: "rgba(196,154,0,0.12)",
    borderWidth: 1,
    borderColor: "rgba(196,154,0,0.35)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 5,
  },
  movesRemainingText: {
    color: "#C49A00",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.5,
  },
  buttonContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  button: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonSecondary: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  buttonPrimary: {
    backgroundColor: "#C49A00",
    shadowColor: "#C49A00",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonTextSecondary: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  buttonTextPrimary: {
    color: "#0D0D0D",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
