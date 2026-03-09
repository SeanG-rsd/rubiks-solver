import { useAppState } from "@react-native-community/hooks";
import { useCameraPermissions } from "expo-camera";
import { useEffect, useRef, useState } from "react";
import { Button, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
    COLOR_TABLE,
    organizeCube,
    validCubeColors,
} from "@/scripts/organize-cube";

const AMBER       = "#C49A00";
const BG          = "#0D0D0D";
const BORDER_MED  = "rgba(196,154,0,0.18)";
const WHITE_MUTED = "rgba(255,255,255,0.30)";

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

    //const boxStyles = [styles.sideWhite, styles.sideOrange, styles.sideGreen, styles.sideRed, styles.sideBlue, styles.sideYellow];

    const frameDimensions = useSharedValue({ width: 0, height: 0 });

    const { detectedSides, validCube } = useCubeStore();

    const lastLength = useRef(0);

    const scannedCount = scannedSides.length;

    useEffect(() => {
        const interval = setInterval(() => {
            const current = detectedSides.value;
            if (current.length !== lastLength.current) {
                lastLength.current = current.length;

                setScannedSides([...current])
            }
        }, 500);

        return () => clearInterval(interval);
    }, []);

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
                scale: { width, height },
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

                    const red   = resized[index];
                    const green = resized[index + 1];
                    const blue  = resized[index + 2];

                    for (const range of Object.values(cubeRanges)) {
                        const { min, max } = range;
                        if (
                            red   >= min.red   && red   <= max.red   &&
                            green >= min.green && green <= max.green &&
                            blue  >= min.blue  && blue  <= max.blue
                        ) {
                            colors.push(range.color);
                        }
                    }
                }
            }

            if (colors.length === 9 && detectedSides.value.length < 6) {
                let valid = true;
                for (const side of Object.values(detectedSides.value)) {
                    if (side[4] === colors[4]) valid = false;
                }
                if (valid) {
                    detectedSides.value = [...detectedSides.value, colors];
                    console.log(`Found Valid!: ${detectedSides.value.length}`);
                }
            }

            if (detectedSides.value.length === 6 && !validCube.value) {
                let valid = validCubeColors(detectedSides.value);
                if (!valid) {
                    detectedSides.value = [];
                } else {
                    detectedSides.value = organizeCube(detectedSides.value);
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

    if (!permission) return <View />;

    if (!permission.granted) {
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

            <View style={styles.box}>
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />
            </View>

            <View style={styles.hudTop}>
                <Text style={styles.hudLabel}>SCANNING</Text>
                <View style={styles.progressRow}>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <View
                            key={i}
                            style={[
                                styles.progressDot,
                                {
                                    backgroundColor: i < scannedCount
                                        ? scannedSides[i][4]
                                        : "rgba(196,154,0,0.20)",
                                },
                            ]}
                        />
                    ))}
                </View>
                <Text style={styles.hudSub}>{scannedCount} / 6 sides</Text>
            </View>

            <View style={styles.bottomBar}>
                <TouchableOpacity style={styles.resetButton} onPress={resetSides}>
                    <Text style={styles.resetButtonText}>Reset Scan</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const CORNER_SIZE  = 22;
const CORNER_WIDTH = 3;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BG,
    },
    camera: {
        flex: 1,
    },

    box: {
        position: "absolute",
        top: "32.5%",
        left: "15%",
        width: 250,
        aspectRatio: "1/1",
        borderRadius: 12,
    },
    corner: {
        position: "absolute",
        width: CORNER_SIZE,
        height: CORNER_SIZE,
        borderColor: AMBER,
        borderRadius: 3,
    },
    cornerTL: {
        top: 0,
        left: 0,
        borderTopWidth: CORNER_WIDTH,
        borderLeftWidth: CORNER_WIDTH,
    },
    cornerTR: {
        top: 0,
        right: 0,
        borderTopWidth: CORNER_WIDTH,
        borderRightWidth: CORNER_WIDTH,
    },
    cornerBL: {
        bottom: 0,
        left: 0,
        borderBottomWidth: CORNER_WIDTH,
        borderLeftWidth: CORNER_WIDTH,
    },
    cornerBR: {
        bottom: 0,
        right: 0,
        borderBottomWidth: CORNER_WIDTH,
        borderRightWidth: CORNER_WIDTH,
    },

    hudTop: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        paddingTop: 60,
        paddingBottom: 18,
        paddingHorizontal: 28,
        backgroundColor: "rgba(13,13,13,0.75)",
        borderBottomWidth: 1,
        borderBottomColor: BORDER_MED,
        alignItems: "center",
    },
    hudLabel: {
        color: AMBER,
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 4,
        marginBottom: 10,
    },
    progressRow: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 6,
    },
    progressDot: {
        width: 28,
        height: 4,
        borderRadius: 2,
        backgroundColor: "rgba(196,154,0,0.20)",
    },
    progressDotFilled: {
        backgroundColor: AMBER,
    },
    hudSub: {
        color: WHITE_MUTED,
        fontSize: 12,
        fontWeight: "600",
        letterSpacing: 1,
    },

    sidesContainer: {
        position: "absolute",
        top: 0,
        right: "40%",
        width: 100,
        height: 50,
        alignItems: "center",
    },
    sideGreen:  { position: "absolute", top: 90,  right: 30  },
    sideBlue:   { position: "absolute", top: 90,  right: -60 },
    sideRed:    { position: "absolute", top: 90,  right: -15 },
    sideOrange: { position: "absolute", top: 90,  right: 75  },
    sideYellow: { position: "absolute", top: 135, right: 30  },
    sideWhite:  { position: "absolute", top: 45,  right: 30  },
    sideIndicator: {
        width: 40,
        height: 40,
        borderRadius: 7,
        borderWidth: 1.5,
        alignItems: "center",
        justifyContent: "center",
    },
    sideText: {
        color: AMBER,
        fontWeight: "700",
        fontSize: 13,
    },

    bottomBar: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: 44,
        paddingTop: 20,
        paddingHorizontal: 32,
        backgroundColor: "rgba(13,13,13,0.85)",
        borderTopWidth: 1,
        borderTopColor: BORDER_MED,
        alignItems: "center",
    },
    resetButton: {
        width: "100%",
        height: 52,
        borderRadius: 14,
        backgroundColor: "rgba(255,255,255,0.06)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.12)",
        alignItems: "center",
        justifyContent: "center",
    },
    resetButtonText: {
        color: WHITE_MUTED,
        fontSize: 16,
        fontWeight: "700",
        letterSpacing: 1,
    },

    message: {
        textAlign: "center",
        paddingBottom: 10,
        color: "white",
    },
});