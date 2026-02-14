import { Canvas, useFrame } from "@react-three/fiber/native";
import { Environment, OrbitControls, useGLTF } from "@react-three/drei/native";
import { Button, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useIsFocused, useTheme } from "@react-navigation/native";
import { useCubeStore } from "@/context/CubeContext";
import { useAnimatedReaction } from "react-native-reanimated";
import { runOnJS } from "react-native-worklets";
import { useFocusEffect } from "expo-router";
import { organizeCube } from "@/scripts/organize-cube";
import { FACE_ORDER } from "@/scripts/organize-cube";

const RubiksCube = ({ modelRef, sides }) => {
    if (sides.length !== 6) {
        return (
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[2, 2, 2]}></boxGeometry>
                <meshStandardMaterial color={"red"}></meshStandardMaterial>
            </mesh>
        );
    }

    let cubes = [];

    for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
            for (let z = -1; z <= 1; z++) {
                let sideColors = [
                    "black",
                    "black",
                    "black",
                    "black",
                    "black",
                    "black",
                ];

                if (y == -1) { // side 0
                    sideColors[3] = sides[FACE_ORDER.orange][(z + 1) * 3 + 1 - x];
                }

                if (y == 1) {
                    sideColors[2] = sides[FACE_ORDER.red][(1 - z) * 3 + 1 - x];
                }

                if (z == 1) { // side 1
                    sideColors[4] = sides[FACE_ORDER.white][(x + 1) * 3 + y + 1];
                }

                if (z == -1) { // side 1
                    sideColors[5] = sides[FACE_ORDER.yellow][(1 - x) * 3 + y + 1];
                }

                if (x == -1) { // yellow
                    sideColors[1] = sides[FACE_ORDER.blue][(1 - z) * 3 + 1 - y];
                }

                if (x == 1) { // white
                    sideColors[0] = sides[FACE_ORDER.green][(1 - z) * 3 + y + 1];
                }

                cubes.push(
                    <mesh
                        position={[x * 0.52, y * 0.52, z * 0.52]}
                        key={`${x}-${y}-${z}`}
                    >
                        <boxGeometry args={[0.5, 0.5, 0.5]} />
                        {sideColors.map((c, i) => (
                            <meshStandardMaterial
                                key={i}
                                attach={`material-${i}`}
                                color={c}
                            />
                        ))}
                    </mesh>,
                );
            }
        }
    }

    return (
        <group ref={modelRef}>
            {cubes}
        </group>
    );
};

export default function Solve() {
    const modelRef = useRef();
    const cameraRef = useRef();

    const isFocused = useIsFocused();

    const { detectedSides, validCube } = useCubeStore();

    const [currentSides, setCurrentSides] = useState([]);

    const test = () => {
        if (cameraRef.current && modelRef.current) {
            modelRef.current.rotation.set(Math.PI / 4, Math.PI / 4, 0);
            cameraRef.current.reset();
        }

        setCurrentSides(organizeCube([]))
    };

    useFocusEffect(
        useCallback(() => {
            if (validCube.value) {
                console.log("VALID")
                setCurrentSides(detectedSides.value);
            } else {
                setCurrentSides([])
            }
        }, []),
    );

    return (
        <View style={styles.container} key={isFocused}>
            <Canvas
                style={styles.canvas}
                frameloop={isFocused ? "always" : "never"}
            >
                <ambientLight intensity={2.0} />
                <directionalLight color="white" position={[1, 1, 2]} />
                <Suspense fallback={<Text>Loading...</Text>}>
                    <RubiksCube modelRef={modelRef} sides={currentSides} />
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
                <TouchableOpacity style={styles.button} onPress={() => test()}>
                    <Text style={styles.text}>Debug</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button}>
                    <Text style={styles.text}>Next</Text>
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
