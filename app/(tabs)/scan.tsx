import { CameraCapturedPicture, useCameraPermissions, CameraView, CameraType } from "expo-camera";
// import {
//     Camera,
//     useCameraDevice,
//     useCameraPermission,
// } from "react-native-vision-camera";
import { useAppState } from "@react-native-community/hooks";
import { Image } from "expo-image";
import { useRef, useState } from "react";
import { Button, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useIsFocused } from "@react-navigation/native";

export default function ScanScreen() {
    const [cameraReady, setCameraReady] = useState(false);
    const [permission, requestPermission] = useCameraPermissions();
    //const device = useCameraDevice("back");
    const [facing, setFacing] = useState<CameraType>('back');

    const [imageUri, setImageUri] = useState<CameraCapturedPicture>();
    const cameraRef = useRef<CameraView>(null);
    const isFocused = useIsFocused();
    const appState = useAppState();
    const isActive = isFocused && appState === "active";

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
        //setFlash((current) => !current);
    }

    async function takePhoto() {
        // if (cameraReady && cameraRef.current) {
        //     const photo = await cameraRef.current.takePictureAsync({
        //         quality: 0.6,
        //         base64: false,
        //     });

        //     setImageUri(photo);
        //     console.log("Photo URI:", photo.uri);
        // }
    }

    //if (device == null) return <View />;

    return (
        <View style={styles.container}>
            {/* <Camera
                style={styles.camera}
                device={device}
                ref={cameraRef}
                isActive={true}
            /> */}
            <CameraView
                style={styles.camera}
                facing={facing}
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
