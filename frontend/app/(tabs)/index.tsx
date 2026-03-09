import { useAppState } from "@react-native-community/hooks";
import { useCameraPermissions } from "expo-camera";
import { useRef, useState } from "react";
import {
    Button,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";
import {
    Camera,
    runAtTargetFps,
    useCameraDevice,
    useFrameProcessor,
} from "react-native-vision-camera";

import { useIsFocused } from "@react-navigation/native";

import { cubeRanges } from "@/constants/variables";
import { useCubeStore } from "@/context/CubeContext";
import { PaintStyle, Skia } from "@shopify/react-native-skia";
import { useSharedValue } from "react-native-worklets-core";
import { useResizePlugin } from "vision-camera-resize-plugin";
import {
    organizeCube,
    printCube,
    validCubeColors,
} from "@/scripts/organize-cube";
import { runOnJS, useAnimatedReaction } from "react-native-reanimated";

const paint = Skia.Paint();
paint.setStyle(PaintStyle.Fill);
paint.setColor(Skia.Color("lime"));
paint.setStrokeWidth(2);

export default function ScanScreen() {
    const [permission, requestPermission] = useCameraPermissions();
    const device = useCameraDevice("back");

    const { resize } = useResizePlugin();

    const cameraRef = useRef<Camera>(null);
    const isFocused = useIsFocused();
    const appState = useAppState();
    const isActive = isFocused && appState === "active";

    const [scannedSides, setScannedSides] = useState<string[][]>([]);

    const frameDimensions = useSharedValue({ width: 0, height: 0 });
    
    const { detectedSides, validCube } = useCubeStore();

    const frameProcessor = useFrameProcessor((frame) => {
        "worklet";

        if (
            frameDimensions.value.width !== frame.width ||
            frameDimensions.value.height !== frame.height
        ) {
            frameDimensions.value = {
                width: frame.width,
                height: frame.height,
            };
        }

        runAtTargetFps(1, () => {
            "worklet";

            const height = frame.height / 4;
            const width = frame.width / 4;

            const resized = resize(frame, {
                scale: {
                    width: width,
                    height: height,
                },
                pixelFormat: "rgba",
                dataType: "uint8",
            });

            const channels = 4;

            const x = width / 2;
            const y = height / 2;
            const d = 20;

            let colors: string[] = [];

            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    const newX = x + (j * d);
                    const newY = y + (i * d);

                    const index = (newY * width + newX) * channels;

                    const red = resized[index];
                    const green = resized[index + 1];
                    const blue = resized[index + 2];
                    const alpha = resized[index + 3];

                    for (const range of Object.values(cubeRanges)) {
                        const min = range.min;
                        const max = range.max;

                        if (
                            red >= min.red && red <= max.red &&
                            green >= min.green &&
                            green <= max.green && blue >= min.blue &&
                            blue <= max.blue
                        ) {
                            // console.log(
                            //     `The pixel at ${j},${i} is ${range.color}!`,
                            // );
                            colors.push(range.color);
                        }
                    }
                }
            }

            if (colors.length === 9 && detectedSides.value.length < 6) {
                let valid = true;
                //console.log(sides.value.length)
                for (const side of Object.values(detectedSides.value)) {
                    //console.log(`${side[4] == colors[4]}: ${side[4]} === ${colors[4]}`)
                    if (side[4] === colors[4]) valid = false;
                }

                if (valid) {
                    detectedSides.value = [...detectedSides.value, colors];
                    console.log(colors);
                    console.log(detectedSides.value.length);
                    console.log(`Found Valid!: ${detectedSides.value.length}`);
                }
            }

            if (detectedSides.value.length === 6 && !validCube.value) {
                let valid = validCubeColors(detectedSides.value);

                if (!valid) {
                    detectedSides.value = [];
                } else {
                    detectedSides.value = organizeCube(detectedSides.value);

                    console.log(detectedSides.value);

                    validCube.value = true;
                }

                console.log("------FINISH CHECK------");
            }
        });
    }, [resize]);

    const resetSides = () => {
        detectedSides.value = [];
        validCube.value = false;
    };

    if (!permission) {
        // Camera permissions are still loading.
        return <View />;
    }

    if (!permission.granted) {
        // Camera permissions are not granted yet.
        return (
            <View style={styles.container}>
                <Text style={styles.message}>
                    We need your permission to show the camera
                </Text>
                <Button onPress={requestPermission} title="grant permission" />
            </View>
        );
    }

    if (device == null) return <View />;

    return (
        <View style={styles.container}>
            <Camera
                style={styles.camera}
                device={device}
                ref={cameraRef}
                isActive={isActive}
                frameProcessor={frameProcessor}
                pixelFormat="rgb"
            />

            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={styles.button}
                    onPress={resetSides}
                >
                    <Text style={styles.text}>Reset Scan</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.box}></View>

            <View style={styles.sidesContainer}>
                {Array.from({ length: 6 }).map((_, i) => {
                    const side = scannedSides[i];
                    return (
                        <View
                            key={i}
                            style={[
                                styles.sideIndicator,
                                {
                                    backgroundColor: side
                                        ? side[4]
                                        : "transparent",
                                },
                            ]}
                        >
                            {!side && (
                                <Text style={styles.sideText}>{i + 1}</Text>
                            )}
                        </View>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
    },
    box: {
        position: "absolute",
        top: "32.5%",
        left: "15%",
        backgroundColor: "transparent",
        width: 250,
        aspectRatio: "1/1",
        borderColor: "white",
        borderWidth: 10,
        borderRadius: 15,
        alignItems: "center",
        justifyContent: "center",
    },
    sidesContainer: {
        position: "absolute",
        top: 16,
        right: 16,
        gap: 8,
    },
    sideIndicator: {
        width: 36,
        height: 36,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: "white",
        alignItems: "center",
        justifyContent: "center",
    },
    sideText: {
        color: "white",
        fontWeight: "bold",
    },
    boxH: {
        position: "absolute",
        top: "50%",
        left: "45%",
        width: "10%",
        height: 2,
        backgroundColor: "red",
    },
    boxV: {
        position: "absolute",
        top: "50%",
        left: "45%",
        width: "10%",
        height: 2,
        transform: "rotate(90deg)",
        backgroundColor: "red",
    },
    message: {
        textAlign: "center",
        paddingBottom: 10,
    },
    camera: {
        flex: 1,
    },
    buttonContainer: {
        position: "absolute",
        bottom: 64,
        flexDirection: "row",
        backgroundColor: "transparent",
        width: "100%",
        paddingHorizontal: 64,
    },
    takePictureContainer: {
        position: "absolute",
        bottom: 128,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "transparent",
        width: "100%",
    },
    button: {
        flex: 1,
        alignItems: "center",
    },
    text: {
        fontSize: 24,
        fontWeight: "bold",
        color: "white",
    },
    takePictureButton: {
        width: 64,
        height: 64,
        backgroundColor: "#0000ff",
        borderRadius: 32,
    },
});
