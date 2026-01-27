import { Colors } from "@/constants/theme";
import { StyleSheet, View } from "react-native";

export default function TopBar() {
    return (
    <View style={styles.topBar}>
        Test
    </View>
    );
}

const styles = StyleSheet.create({
    topBar: {
        height: 20,
        backgroundColor: Colors.dark.background
    }
})

