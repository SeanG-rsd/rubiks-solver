import {
    CameraCapturedPicture,
    CameraType,
    CameraView,
    FlashMode,
    useCameraPermissions,
} from "expo-camera";
import { Image } from "expo-image";
import { useRef, useState } from "react";
import { Button, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Path } from "react-native-svg";

export default function ScanScreen() {
    const [facing, setFacing] = useState<CameraType>("back");
    const [cameraReady, setCameraReady] = useState(false);
    const [flash, setFlash] = useState(false);
    const [permission, requestPermission] = useCameraPermissions();

    const [imageUri, setImageUri] = useState<CameraCapturedPicture>();
    const cameraRef = useRef<CameraView>(null);

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

    function onCameraReady() {
        setCameraReady(true);
    }

    function toggleCameraFacing() {
        setFacing((current) => (current === "back" ? "front" : "back"));
    }

    function toggleFlash() {
        setFlash((current) => !current);
    }

    async function takePhoto() {
        if (cameraReady && cameraRef.current) {
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.6,
                base64: false,
            });

            setImageUri(photo);
            console.log("Photo URI:", photo.uri);
        }
    }

    return (
        <View style={styles.container}>
            <CameraView
                style={styles.camera}
                facing={facing}
                enableTorch={flash}
                onCameraReady={onCameraReady}
                ref={cameraRef}
            />
            <View style={styles.takePictureContainer}>
                <TouchableOpacity
                    style={styles.takePictureButton}
                    onPress={takePhoto}
                >
                </TouchableOpacity>
            </View>
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={styles.button}
                    onPress={toggleCameraFacing}
                >
                    <Text style={styles.text}>Flip Camera</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.box}>
                <Svg height="100%" width="100%" viewBox="0 0 100 100">
                    {
                        /* This path draws a box starting from the top-right gap,
       goes around the square, and ends at the top-left gap.
       M = Move to, L = Line to, A = Arc (for rounded corners)
    */
                    }
                    <Path
                        d="
        M 65 5 
        L 90 5 
        A 5 5 0 0 1 95 10 
        L 95 90 
        A 5 5 0 0 1 90 95 
        L 10 95 
        A 5 5 0 0 1 5 90 
        L 5 10 
        A 5 5 0 0 1 10 5 
        L 35 5
      "
                        fill="none"
                        stroke="white"
                        strokeWidth="2" // Relative to viewBox size
                        strokeLinecap="round"
                    />
                </Svg>
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
