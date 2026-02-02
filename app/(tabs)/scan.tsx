import { useCameraPermissions } from "expo-camera";
import {
    Camera,
    runAtTargetFps,
    useCameraDevice,
    useFrameProcessor,
} from "react-native-vision-camera";
import type { Frame } from "react-native-vision-camera";
import { useAppState } from "@react-native-community/hooks";
import { useCallback, useRef, useState } from "react";
import {
    Button,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";

import { useIsFocused } from "@react-navigation/native";

import { useResizePlugin } from "vision-camera-resize-plugin";
import {
    ColorConversionCodes,
    ContourApproximationModes,
    DataTypes,
    ObjectType,
    OpenCV,
    Rect,
    RetrievalModes,
} from "react-native-fast-opencv";
import {
    Canvas,
    PaintStyle,
    Path,
    rect,
    Skia,
} from "@shopify/react-native-skia";
import { runOnJS, runOnRuntime, scheduleOnRN } from "react-native-worklets";
import { Rectangle } from "@/constants/types";
import { useSharedValue } from "react-native-worklets-core";
import { useAnimatedReaction, useDerivedValue } from "react-native-reanimated";
import { cubeRanges } from "@/constants/variables";
import { Range } from "@/constants/types";

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

    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const frameDimensions = useSharedValue({ width: 0, height: 0 });

    const rects = useSharedValue<Rectangle[]>([]);

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

            const index = (y * width + x) * channels;

            const red = resized[index];
            const green = resized[index + 1];
            const blue = resized[index + 2];
            const alpha = resized[index + 3];
            
            // for (const range of Object.values(cubeRanges)) {
            //     console.log(range.max.name)
            // }

            console.log(`RBG: ${red}, ${green}, ${blue}, ${alpha}`);
        });
    }, [rects]);

    const skiaPath = useDerivedValue(() => {
        const path = Skia.Path.Make();

        const frameW = frameDimensions.value.width;
        const frameH = frameDimensions.value.height;

        if (frameW === 0 || frameH === 0) return path;

        const originalPixelX = frameW / 2;
        const originalPixelY = frameH / 2;

        const scaleX = screenWidth / frameW;
        const scaleY = screenHeight / frameH;

        const screenX = originalPixelX * scaleX;
        const screenY = originalPixelY * scaleY;

        const lineLength = 20;

        console.log("here!")

        path.moveTo(screenX - lineLength, screenY);
        path.lineTo(screenX + lineLength, screenY);

        path.moveTo(screenX, screenY - lineLength);
        path.lineTo(screenX, screenY + lineLength);

        return path;
    }, [screenWidth, screenHeight, frameDimensions]);

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

            <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
                <Path
                    path={skiaPath}
                    color="red"
                    style="stroke"
                    strokeWidth={2}
                />
            </Canvas>

            <View style={styles.takePictureContainer}>
                <TouchableOpacity
                    style={styles.takePictureButton}
                    onPress={() => {}}
                >
                </TouchableOpacity>
            </View>
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => {}}
                >
                    <Text style={styles.text}>Flip Camera</Text>
                </TouchableOpacity>
            </View>
            {
                /* <View style={styles.box}>
            </View> */
            }
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
        top: "30%",
        left: "15%",
        backgroundColor: "transparent",
        width: "70%",
        aspectRatio: "1/1",
        borderColor: "white",
        borderWidth: 10,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
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
