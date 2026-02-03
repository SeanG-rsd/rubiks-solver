import { Canvas, useFrame } from "@react-three/fiber/native";
import { OrbitControls, useGLTF, Environment } from "@react-three/drei/native";
import { Button, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Suspense, useEffect, useRef } from "react";
import { useIsFocused, useTheme } from "@react-navigation/native";

const Model = ({ modelRef }) => {
    // Replace with the path to your actual 3D model file
    // const gltf = useGLTF(require("./path/to/your/model.glb")) as GLTF;
    // return <primitive object={gltf.scene} scale={1} />
    return (
        <mesh ref={modelRef} rotation={[Math.PI / 4, Math.PI / 4, 0]}>
            <boxGeometry
                args={[2, 2, 2]}
            />
            <meshStandardMaterial color="red" />
        </mesh>
    );
};

export default function Solve() {
    const modelRef = useRef();
    const cameraRef = useRef();

    const isFocused = useIsFocused();

    const test = () => {
        if (cameraRef.current && modelRef.current) {
            modelRef.current.rotation.set(Math.PI / 4, Math.PI / 4, 0);
            cameraRef.current.reset();
        }
    };

    return (
        <View style={styles.container} key={isFocused}>
            <Canvas style={styles.canvas} frameloop={isFocused ? 'always' : 'never'}>
                <ambientLight intensity={2.0} />
                <directionalLight color="white" position={[1, 1, 2]} />
                <Suspense fallback={<Text>Loading...</Text>}>
                    <Model modelRef={modelRef} />
                    <OrbitControls
                        enableRotate={true}
                        rotateSpeed={2.5}
                        ref={cameraRef}
                    />
                </Suspense>
            </Canvas>
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.button} onPress={() => test()}>
                    <Text style={styles.text}>Previous</Text>
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
