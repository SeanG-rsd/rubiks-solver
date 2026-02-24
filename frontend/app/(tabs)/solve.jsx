import { Canvas } from "@react-three/fiber/native";
import { OrbitControls, useGLTF } from "@react-three/drei/native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Suspense, useCallback, useRef, useState } from "react";
import { useIsFocused } from "@react-navigation/native";
import { useCubeStore } from "@/context/CubeContext";
import { useFocusEffect } from "expo-router";
import { FACE_ORDER } from "@/scripts/organize-cube";
import { cubeToString, solveCube } from "@/scripts/solve-cube";

useGLTF.preload(require("../../assets/models/rubiks.glb"));

function Rubiks({ modelRef, sides }) {
    const { scene } = useGLTF(require("../../assets/models/rubiks.glb"));
    console.log("--- START ---");

    let cubieRefs = [[]];
    let currCubie = [];
    let startsWith = "Cube_";
    let count = 1;

    scene.traverse((child) => {
        if (child.isMesh && child.name.startsWith(startsWith)) {
            currCubie.push(child);
            console.log("Found piece:", child.name);
            child.visible = true;
        } else if (child.isMesh) {
            cubieRefs.push(currCubie);
            currCubie = [];
            if (startsWith === "Cube_") {
                startsWith = "Cube001";
            } else {
                count++;
                if (count < 10) {
                    startsWith = `Cube00${count}`;
                } else {
                    startsWith = `Cube0${count}`;
                }
            }
        }
    });
    let show = 9
    cubieRefs.forEach((meshes, index) => {
        meshes.forEach((mesh) => {
            mesh.visible = index === show;
        });
    });

    console.log(cubieRefs.length);

    return (
        <primitive
            ref={modelRef}
            object={scene}
            scale={0.3}
            position={[0, 0, 0]}
        />
    );
}

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
                    sideColors[3] =
                        sides[FACE_ORDER.orange][(1 - z) * 3 + x + 1];
                }

                if (y == 1) {
                    sideColors[2] = sides[FACE_ORDER.red][(1 - z) * 3 + 1 - x];
                }

                if (z == 1) { // side 1
                    sideColors[4] =
                        sides[FACE_ORDER.white][(x + 1) * 3 + y + 1];
                }

                if (z == -1) { // side 1
                    sideColors[5] =
                        sides[FACE_ORDER.yellow][(1 - x) * 3 + y + 1];
                }

                if (x == -1) { // yellow
                    sideColors[1] = sides[FACE_ORDER.blue][(1 - z) * 3 + 1 - y];
                }

                if (x == 1) { // white
                    sideColors[0] =
                        sides[FACE_ORDER.green][(1 - z) * 3 + y + 1];
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

    const [resetKey, setResetKey] = useState(0);

    const reloadCanvas = () => setResetKey((prev) => prev + 1);

    const isFocused = useIsFocused();

    const { detectedSides, validCube } = useCubeStore();

    const [currentSides, setCurrentSides] = useState([]);

    const debug = () => {
        if (cameraRef.current && modelRef.current) {
            modelRef.current.rotation.set(Math.PI / 4, Math.PI / 4, 0);
            cameraRef.current.reset();
        }

        reloadCanvas();
    };

    const solve = async () => {
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
                    {/* <RubiksCube modelRef={modelRef} sides={currentSides} /> */}
                    <Rubiks modelRef={modelRef}></Rubiks>
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
