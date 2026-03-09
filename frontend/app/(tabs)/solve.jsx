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

    const reloadCanvas = () => setResetKey((prev) => prev + 1);

    const isFocused = useIsFocused();

    const { detectedSides, validCube } = useCubeStore();

    const [currentSides, setCurrentSides] = useState([]);

    const [nextMove, setNextMove] = useState("");

    const debug = () => {
        console.log("debug");
        setNextMove("t");
        // if (cameraRef.current && modelRef.current) {
        //     modelRef.current.rotation.set(Math.PI / 4, Math.PI / 4, 0);
        //     cameraRef.current.reset();
        // }

        // reloadCanvas();
    };

    const solve = async () => {
        printCube(detectedSides.value)
        const cube = cubeToString(detectedSides.value);
        const algorithm = await solveCube(cube);

        console.log(algorithm);
    };

    useFocusEffect(
        useCallback(() => {
            if (validCube.value) {
                console.log("VALID");
                setCurrentSides(detectedSides.value);
            } else {
                setCurrentSides([]);
            }
        }, []),
    );

    return (
        <View style={styles.container} key={isFocused}>
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
                        onMoveComplete={() => setNextMove("")}
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
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.button} onPress={() => debug()}>
                    <Text style={styles.text}>Debug</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={() => solve()}>
                    <Text style={styles.text}>Solve</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        backgroundColor: "#212121",
    },
    canvas: {
        flex: 1,
        justifyContent: "center",
        backgroundColor: "transparent",
    },
    buttonContainer: {
        position: "absolute",
        width: "100%",
        justifyContent: "space-around",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        bottom: "10%",
    },
    button: {
        width: "35%",
        height: 40,
        backgroundColor: "white",
        borderRadius: 20,
        justifyContent: "center",
        backgroundColor: "#927000",
    },
    text: {
        color: "white",
        textAlign: "center",
        textAlignVertical: "center",
        fontWeight: "bold",
        fontSize: 20,
    },
});
