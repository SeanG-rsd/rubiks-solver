import { useCubeStore } from "@/context/CubeContext";
import {
    organizeCube,
    validCubeColors,
} from "@/scripts/organize-cube";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const AMBER       = "#C49A00";
const BG          = "#0D0D0D";
const BORDER_MED  = "rgba(196,154,0,0.18)";
const WHITE_MUTED = "rgba(255,255,255,0.30)";

// Mock cube data for Expo Go testing
const MOCK_CUBE_DATA = [
    ["white", "yellow", "blue", "red", "white", "green", "yellow", "green", "green"],
    ["green", "yellow", "blue", "blue", "orange", "green", "yellow", "orange", "yellow"],
    ["red", "orange", "red", "yellow", "green", "yellow", "green", "green", "white"],
    ["white", "red", "white", "blue", "red", "red", "orange", "red", "green"],
    ["red", "orange", "orange", "blue", "blue", "orange", "yellow", "blue", "orange"],
    ["red", "white", "blue", "white", "yellow", "white", "blue", "white", "orange"]
];

export default function ScanScreen() {
    const { detectedSides, validCube } = useCubeStore();
    const [displaySides, setDisplaySides] = useState<string[][]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    const loadMockCube = () => {
        // Validate and organize the mock cube
        let valid = validCubeColors(MOCK_CUBE_DATA);
        if (!valid) {
            console.log("Mock cube data is invalid");
            return;
        }

        const organized = organizeCube(MOCK_CUBE_DATA);
        detectedSides.value = organized;
        validCube.value = true;
        setDisplaySides(organized);
        setIsLoaded(true);
    };

    // Auto-load mock data on mount for easier testing
    useEffect(() => {
        loadMockCube();
    }, []);

    const resetSides = () => {
        detectedSides.value = [];
        validCube.value = false;
        setDisplaySides([]);
        setIsLoaded(false);
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.hudTop}>
                    <Text style={styles.hudLabel}>MOCK CUBE DATA</Text>
                    <Text style={styles.statusText}>
                        {isLoaded ? "✓ Loaded" : "Not loaded"}
                    </Text>
                    <View style={styles.progressRow}>
                        {Array.from({ length: 6 }).map((_, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.progressDot,
                                    {
                                        backgroundColor: i < displaySides.length
                                            ? displaySides[i][4]
                                            : "rgba(196,154,0,0.20)",
                                    },
                                ]}
                            />
                        ))}
                    </View>
                    <Text style={styles.hudSub}>{displaySides.length} / 6 sides loaded</Text>
                </View>

                <View style={styles.infoBox}>
                    <Text style={styles.infoTitle}>TEST MODE</Text>
                    <Text style={styles.infoText}>
                        This is a mock cube for testing the solve animation in Expo Go.
                    </Text>
                    <Text style={styles.infoText}>
                        Navigate to the SOLVE tab to see the cube animation and test moves.
                    </Text>
                </View>
            </View>

            <View style={styles.bottomBar}>
                <TouchableOpacity 
                    style={styles.button}
                    onPress={loadMockCube}
                >
                    <Text style={styles.buttonText}>Load Mock Cube</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={[styles.button, styles.buttonSecondary]}
                    onPress={resetSides}
                >
                    <Text style={styles.buttonTextSecondary}>Reset</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BG,
    },
    content: {
        flex: 1,
        justifyContent: "center",
    },
    hudTop: {
        paddingTop: 60,
        paddingBottom: 30,
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
    statusText: {
        color: "#4ADE80",
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 12,
    },
    progressRow: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 12,
    },
    progressDot: {
        width: 28,
        height: 4,
        borderRadius: 2,
        backgroundColor: "rgba(196,154,0,0.20)",
    },
    hudSub: {
        color: WHITE_MUTED,
        fontSize: 12,
        fontWeight: "600",
        letterSpacing: 1,
    },
    infoBox: {
        marginHorizontal: 28,
        marginTop: 40,
        paddingHorizontal: 20,
        paddingVertical: 24,
        backgroundColor: "rgba(196,154,0,0.08)",
        borderWidth: 1,
        borderColor: "rgba(196,154,0,0.25)",
        borderRadius: 12,
    },
    infoTitle: {
        color: AMBER,
        fontSize: 13,
        fontWeight: "700",
        letterSpacing: 2,
        marginBottom: 12,
    },
    infoText: {
        color: WHITE_MUTED,
        fontSize: 13,
        fontWeight: "500",
        lineHeight: 20,
        marginBottom: 8,
    },
    bottomBar: {
        paddingBottom: 44,
        paddingTop: 20,
        paddingHorizontal: 24,
        backgroundColor: "rgba(13,13,13,0.85)",
        borderTopWidth: 1,
        borderTopColor: BORDER_MED,
        gap: 12,
    },
    button: {
        width: "100%",
        height: 52,
        borderRadius: 14,
        backgroundColor: AMBER,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: AMBER,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.45,
        shadowRadius: 12,
        elevation: 8,
    },
    buttonSecondary: {
        backgroundColor: "rgba(255,255,255,0.06)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.12)",
        shadowOpacity: 0,
        elevation: 0,
    },
    buttonText: {
        color: BG,
        fontSize: 16,
        fontWeight: "800",
        letterSpacing: 0.5,
    },
    buttonTextSecondary: {
        color: WHITE_MUTED,
        fontSize: 16,
        fontWeight: "600",
        letterSpacing: 0.5,
    },
});