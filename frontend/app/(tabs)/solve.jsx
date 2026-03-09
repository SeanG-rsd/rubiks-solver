import { useCubeStore } from "@/context/CubeContext";
import { printCube } from "@/scripts/organize-cube";
import { cubeToString, solveCube } from "@/scripts/solve-cube";
import { useIsFocused } from "@react-navigation/native";
import { OrbitControls } from "@react-three/drei/native";
import { Canvas } from "@react-three/fiber/native";
import { useFocusEffect } from "expo-router";
import {
    Suspense,
    useCallback,
    useRef,
    useState,
} from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import RubiksCube from "../../components/rubiks-cube";


export default function Solve() {
    const modelRef = useRef();
    const cameraRef = useRef();

    const [resetKey, setResetKey] = useState(0);

    const [moves, setMoves] = useState([])

    const isFocused = useIsFocused();

    const { detectedSides, validCube } = useCubeStore();

    const [currentSides, setCurrentSides] = useState([]);

    const [nextMove, setNextMove] = useState("");

    const [moveState, setMoveState] = useState(false);

    const startNextMove = () => {
        const move = moves[0];

        setMoves(moves.slice(1))

        setNextMove(move)

        setMoveState(false)
    }

    const doMove = () => {
        setMoveState(true)
    }

    const goBack = () => {

    }

    useFocusEffect(
        useCallback(() => {
            let isActive = true; 

            const solve = async () => {
                printCube(detectedSides.value);
                const cube = cubeToString(detectedSides.value);
                
                try {
                    const algorithm = await solveCube(cube);

                    if (!algorithm || algorithm.startsWith("Error")) {
                        console.log("Could not solve:", algorithm);
                        return;
                    }

                    if (isActive) {
                        const moves = algorithm.split(' ');
                        setNextMove(moves[0])
                        console.log(moves)
                        setMoves(moves.splice(1));
                    }
                } catch (e) {
                    console.error("Failed to process cube", e);
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
        }, [])
    );

    return (
        <View style={styles.container} key={isFocused}>

            <View style={styles.moveContainer}>
                <Text style={styles.moveLabel}>NEXT MOVE</Text>
                <Text style={styles.moveText}>{nextMove || "—"}</Text>
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
                        currentMove={nextMove}
                        onMoveComplete={() => {}}
                    >
                    </RubiksCube>
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
                    <Text style={styles.movesRemainingText}>{moves.length} moves left</Text>
                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={() => goBack()}>
                        <Text style={styles.buttonTextSecondary}>{moveState ? "Redo" : "← Prev"}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.buttonPrimary]}
                        onPress={() => {
                            if (moveState) {
                                startNextMove()
                            } else {
                                doMove()
                            }
                        }}
                    >
                        <Text style={styles.buttonTextPrimary}>
                            {moveState ? "Next →" : "Animate"}
                        </Text>
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