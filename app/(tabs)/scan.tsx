import { View, StyleSheet, Text, Button } from "react-native";

export default function ScanScreen() {
    return (
        <View style={styles.text}>
            <Text>
                Text
            </Text>
            <Button title="Test">
                
            </Button>
        </View>
    );
}

const styles = StyleSheet.create({
    text: {
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#ff00ff",
        height: "100%",
    }
})