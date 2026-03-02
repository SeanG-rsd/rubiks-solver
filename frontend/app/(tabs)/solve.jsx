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

import * as THREE from "three";

function applySideColors(sortedMeshes, sideColors) {
    sortedMeshes.forEach((mesh, i) => {
        mesh.material = mesh.material.clone();
        mesh.material.color.set(sideColors[i]);
    });
}

function getGeometryCenter(mesh) {
    mesh.geometry.computeBoundingBox();
    const center = new THREE.Vector3();
    mesh.geometry.boundingBox.getCenter(center);
    return center;
}

function Rubiks({ modelRef, sides }) {
    if (sides.length !== 6) {
        return (
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[2, 2, 2]}></boxGeometry>
                <meshStandardMaterial color={"red"}></meshStandardMaterial>
            </mesh>
        );
    }

    const pivotRef = useRef(new THREE.Group());

    const handleUMove = (isClockwise = true) => {
        const angle = isClockwise ? -Math.PI / 2 : Math.PI / 2;
        const topY = 2.5; // Based on your code's threshold

        const topPieces = [];
        scene.traverse((child) => {
            if (child.isMesh) {
                const pos = new THREE.Vector3();
                child.getWorldPosition(pos);
                if (pos.y > 1.5) topPieces.push(child);
            }
        });

        // Move pieces to pivot, rotate pivot, then move back.
        // NOTE: In React, it's often easier to use an animation library
        // to avoid messy state management during the rotation.
    };

    const { scene } = useGLTF(require("../../assets/models/rubiks.glb"));

    // Collect all sticker meshes
    const allMeshes = [];
    scene.traverse((child) => {
        if (child.isMesh) {
            child.visible = true;
            const color = child.material.color;
            const isDark = color.r < 0.1 && color.g < 0.1 && color.b < 0.1;
            if (!isDark) allMeshes.push(child);
        }
    });

    //allMeshes.forEach(m => console.log(m.name, getGeometryCenter(m)));

    const threshold = 2.5; // tune to your model's scale

    // Up (white) - U1 is back-left, U9 is front-right
    const top = allMeshes
        .filter((m) => getGeometryCenter(m).y > 2.5)
        .sort((a, b) => {
            const pa = getGeometryCenter(a), pb = getGeometryCenter(b);
            if (Math.abs(pa.z - pb.z) > 0.01) return pa.z - pb.z; // z- first (back = top row)
            return pa.x - pb.x; // x- first (left to right)
        });

    // Down (yellow) - D1 is front-left, D9 is back-right
    const bottom = allMeshes
        .filter((m) => getGeometryCenter(m).y < -2.5)
        .sort((a, b) => {
            const pa = getGeometryCenter(a), pb = getGeometryCenter(b);
            if (Math.abs(pa.z - pb.z) > 0.01) return pb.z - pa.z; // z+ first (front = top row)
            return pa.x - pb.x;
        });

    // Front (green) - F1 is top-left, F9 is bottom-right
    const front = allMeshes
        .filter((m) => getGeometryCenter(m).z > 2.5)
        .sort((a, b) => {
            const pa = getGeometryCenter(a), pb = getGeometryCenter(b);
            if (Math.abs(pa.y - pb.y) > 0.01) return pb.y - pa.y; // y+ first (top row)
            return pa.x - pb.x;
        });

    // Back (blue) - B1 is top-left when facing back (x+ side)
    const back = allMeshes
        .filter((m) => getGeometryCenter(m).z < -2.5)
        .sort((a, b) => {
            const pa = getGeometryCenter(a), pb = getGeometryCenter(b);
            if (Math.abs(pa.y - pb.y) > 0.01) return pb.y - pa.y;
            return pb.x - pa.x; // x+ first (mirrored when facing back)
        });

    // Right (red) - R1 is top-left when facing right (z+ side)
    const right = allMeshes
        .filter((m) => getGeometryCenter(m).x > 2.5)
        .sort((a, b) => {
            const pa = getGeometryCenter(a), pb = getGeometryCenter(b);
            if (Math.abs(pa.y - pb.y) > 0.01) return pb.y - pa.y;
            return pb.z - pa.z; // z- first (front = left side when facing right)
        });

    // Left (orange) - L1 is top-left when facing left (z- side)
    const left = allMeshes
        .filter((m) => getGeometryCenter(m).x < -2.5)
        .sort((a, b) => {
            const pa = getGeometryCenter(a), pb = getGeometryCenter(b);
            if (Math.abs(pa.y - pb.y) > 0.01) return pb.y - pa.y;
            return pa.z - pb.z; // z+ first (front = left side when facing left... mirrored)
        });

    applySideColors(top, sides[FACE_ORDER.white]);
    applySideColors(left, sides[FACE_ORDER.orange]);
    applySideColors(front, sides[FACE_ORDER.green]);
    applySideColors(right, sides[FACE_ORDER.red]);
    applySideColors(back, sides[FACE_ORDER.blue]);
    applySideColors(bottom, sides[FACE_ORDER.yellow]);

    return (
        <primitive
            ref={modelRef}
            object={scene}
            scale={0.3}
            position={[0, 0, 0]}
        />
    );
}

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
                    <Rubiks modelRef={modelRef} sides={currentSides}></Rubiks>
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
