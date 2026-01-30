import {
    CameraCapturedPicture,
    CameraType,
    CameraView,
    useCameraPermissions,
} from "expo-camera";
import {
    Camera,
    runAtTargetFps,
    useCameraDevice,
    useFrameProcessor,
} from "react-native-vision-camera";
import type { Frame } from "react-native-vision-camera";
import { useAppState } from "@react-native-community/hooks";
import { useRef, useState } from "react";
import { Button, StyleSheet, Text, TouchableOpacity, View } from "react-native";

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
import { PaintStyle, Skia } from "@shopify/react-native-skia";
import { runOnJS, runOnRuntime, scheduleOnRN } from "react-native-worklets";

const paint = Skia.Paint();
paint.setStyle(PaintStyle.Fill);
paint.setColor(Skia.Color("lime"));

export default function ScanScreen() {
    const [permission, requestPermission] = useCameraPermissions();
    const device = useCameraDevice("back");

    const { resize } = useResizePlugin();

    const cameraRef = useRef<Camera>(null);
    const isFocused = useIsFocused();
    const appState = useAppState();
    const isActive = isFocused && appState === "active";

    const [detectedRects, setDetectedRects] = useState<any[]>([]);

    const updateRects = (rects: any[]) => {
        setDetectedRects(rects);
    };

    const frameProcessor = useFrameProcessor((frame) => {
        runAtTargetFps(5, () => {
            "worklet";

            const height = frame.height / 4;
            const width = frame.width / 4;

            const resized = resize(frame, {
                scale: {
                    width: width,
                    height: height,
                },
                pixelFormat: "bgr",
                dataType: "uint8",
            });

            const src = OpenCV.frameBufferToMat(height, width, 3, resized);

            const dst = OpenCV.createObject(
                ObjectType.Mat,
                0,
                0,
                DataTypes.CV_8U,
            );

            const lowerBound = OpenCV.createObject(
                ObjectType.Scalar,
                30,
                60,
                60,
            );
            const upperBound = OpenCV.createObject(
                ObjectType.Scalar,
                50,
                255,
                255,
            );
            OpenCV.invoke(
                "cvtColor",
                src,
                dst,
                ColorConversionCodes.COLOR_BGR2HSV,
            );
            OpenCV.invoke("inRange", dst, lowerBound, upperBound, dst);

            const channels = OpenCV.createObject(ObjectType.MatVector);
            OpenCV.invoke("split", dst, channels);
            const grayChannel = OpenCV.copyObjectFromVector(channels, 0);

            const contours = OpenCV.createObject(ObjectType.MatVector);
            OpenCV.invoke(
                "findContours",
                grayChannel,
                contours,
                RetrievalModes.RETR_TREE,
                ContourApproximationModes.CHAIN_APPROX_SIMPLE,
            );

            const contoursMats = OpenCV.toJSValue(contours);
            const rectangles: Rect[] = [];

            for (let i = 0; i < contoursMats.array.length; i++) {
                const contour = OpenCV.copyObjectFromVector(contours, i);
                const { value: area } = OpenCV.invoke(
                    "contourArea",
                    contour,
                    false,
                );

                if (area > 3000) {
                    const rect = OpenCV.invoke("boundingRect", contour);
                    rectangles.push(rect);
                }
            }

            const jsRects = [];
            for (const rect of rectangles) {
                const data = OpenCV.toJSValue(rect);

                jsRects.push({
                    x: data.x * 4,
                    y: data.y * 4,
                    width: data.width * 4,
                    height: data.height * 4,
                });
            }

            runOnJS(updateRects)(jsRects);

            OpenCV.clearBuffers(); // IMPORTANT! At the end.
        });
    }, [resize]);

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
                pixelFormat="yuv"
            />
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
            <View style={styles.box}>
            </View>

            <View style={[StyleSheet.absoluteFill, { pointerEvents: "none" }]}>
                {detectedRects.map((r, index) => (
                    <View
                        key={index}
                        style={{
                            position: "absolute",
                            left: r.x,
                            top: r.y,
                            width: r.width,
                            height: r.height,
                            borderWidth: 2,
                            borderColor: "lime", // Bright green box
                            backgroundColor: "rgba(0, 255, 0, 0.1)", // Semi-transparent fill
                        }}
                    />
                ))}
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
