// Define the standard cube face order and their relationships
export const FACE_ORDER = {
    white: 0,
    orange: 1,
    green: 2,
    red: 3,
    blue: 4,
    yellow: 5,
};

const COLOR_TABLE = {
    "white": FACE_ORDER.white,
    "orange": FACE_ORDER.orange,
    "green": FACE_ORDER.green,
    "red": FACE_ORDER.red,
    "blue": FACE_ORDER.blue,
    "yellow": FACE_ORDER.yellow,
};

const rotateSideCW = (side: string[]) => {
    "worklet";

    let temp = side[0];
    side[0] = side[6];
    side[6] = side[8];
    side[8] = side[2];
    side[2] = temp;
    temp = side[1];
    side[1] = side[3];
    side[3] = side[7];
    side[7] = side[5];
    side[5] = temp;
    return side;
};

const rotateSideCCW = (side: string[]) => {
    side = rotateSideCW(side);
    side = rotateSideCW(side);
    return rotateSideCW(side);
};

// Define edge indices for each side (top, right, bottom, left edges)
const EDGES = {
    top: [0, 1, 2],
    right: [2, 5, 8],
    bottom: [6, 7, 8],
    left: [0, 3, 6],
};

export const printCube = (cube: string[][]) => {
    "worklet";
    // Helper to get a short color code for better readability
    const getColorCode = (color: string): string => {
        if (color === "white") return "W";
        if (color === "orange") return "O";
        if (color === "green") return "G";
        if (color === "red") return "R";
        if (color === "blue") return "B";
        if (color === "yellow") return "Y";
        return "?";
    };

    // Helper to format a 3x3 side
    const formatSide = (side: string[]): string[] => {
        "worklet";
        const lines: string[] = [];
        for (let row = 0; row < 3; row++) {
            let line = "";
            for (let col = 0; col < 3; col++) {
                line += getColorCode(side[row * 3 + col]) + " ";
            }
            lines.push(line);
        }
        return lines;
    };

    // Helper to add indentation
    const indent = (lines: string[], spaces: number): string[] => {
        const prefix = " ".repeat(spaces);
        const result: string[] = [];
        for (let i = 0; i < lines.length; i++) {
            result.push(prefix + lines[i]);
        }
        return result;
    };

    console.log("\n========== RUBIK'S CUBE ==========");
    console.log("Cube Layout (Unfolded Net):\n");

    // Print top face (white) - indented
    const topLines = formatSide(cube[0]);
    const indentedTop = indent(topLines, 8);
    for (let i = 0; i < indentedTop.length; i++) {
        console.log(indentedTop[i]);
    }

    console.log(""); // spacing

    // Print middle row: left, front, right, back
    const leftLines = formatSide(cube[1]); // orange
    const frontLines = formatSide(cube[2]); // green
    const rightLines = formatSide(cube[3]); // red
    const backLines = formatSide(cube[4]); // blue

    for (let row = 0; row < 3; row++) {
        console.log(
            leftLines[row] + " " +
                frontLines[row] + " " +
                rightLines[row] + " " +
                backLines[row],
        );
    }

    console.log(""); // spacing

    // Print bottom face (yellow) - indented
    const bottomLines = formatSide(cube[5]);
    const indentedBottom = indent(bottomLines, 8);
    for (let i = 0; i < indentedBottom.length; i++) {
        console.log(indentedBottom[i]);
    }

    console.log("\n==================================");
    console.log("Legend: W=White, O=Orange, G=Green");
    console.log("        R=Red, B=Blue, Y=Yellow");
    console.log("==================================\n");
};

// Get the color of a specific position on a face
const getColor = (face: string[], index: number): string => {
    "worklet";
    return face[index];
};

// Check if a corner piece is valid across three faces
// A corner piece has 3 stickers, one on each of 3 adjacent faces
// Returns true if the three colors form a valid corner
const checkCorner = (
    color1: string,
    color2: string,
    color3: string,
): boolean => {
    "worklet";

    // Get the three colors sorted
    const colors = [color1, color2, color3].sort();
    const key = colors.join("-");

    const validCorners: { [key: string]: boolean } = {
        "blue-orange-white": true,
        "blue-red-white": true,
        "blue-orange-yellow": true,
        "blue-red-yellow": true,
        "green-orange-white": true,
        "green-red-white": true,
        "green-orange-yellow": true,
        "green-red-yellow": true,
    };

    return validCorners[key] === true;
};

const checkEdge = (
    color1: string,
    color2: string
): boolean => {
    "worklet"

    const invalidPairs: { [key: string]: string} = {
        "white": "yellow",
        "red": "orange",
        "green": "blue"
    }

    return color1 !== color2 && color1 !== invalidPairs[color2];
}

// Check if the cube orientation is valid by checking all 8 corners
const isValidOrientation = (cube: string[][]): boolean => {
    "worklet";

    // Define the 8 corners and which face positions they occupy
    // Format: [face_index, position_on_face]
    const corners = [
        // Top-front-left (white-green-orange)
        [[0, 6], [2, 0], [1, 2]],
        // Top-front-right (white-green-red)
        [[0, 8], [2, 2], [3, 0]],
        // Top-back-left (white-blue-orange)
        [[0, 0], [4, 2], [1, 0]],
        // Top-back-right (white-blue-red)
        [[0, 2], [4, 0], [3, 2]],
        // Bottom-front-left (yellow-green-orange)
        [[5, 0], [2, 6], [1, 8]],
        // Bottom-front-right (yellow-green-red)
        [[5, 2], [2, 8], [3, 6]],
        // Bottom-back-left (yellow-blue-orange)
        [[5, 6], [4, 8], [1, 6]],
        // Bottom-back-right (yellow-blue-red)
        [[5, 8], [4, 6], [3, 8]],
    ];

    const edges = [
        // white-green
        [[0, 7], [2, 1]],
        // white-orange
        [[0, 3], [1, 1]],
        // white-red
        [[0, 5], [3, 1]],
        // white-blue
        [[0, 1], [4, 1]],
        // yellow-green
        [[5, 1], [2, 7]],
        // yellow-orange
        [[5, 3], [1, 7]],
        // yellow-red
        [[5, 5], [3, 7]],
        // yellow-blue
        [[5, 7], [4, 7]],
        // green-red
        [[2, 5], [3, 3]],
        // green-orange
        [[2, 3], [1, 5]],
        // blue-red
        [[4, 3], [3, 5]],
        // blue-orange
        [[4, 5], [1, 3]],
    ]

    let countColors = [0, 0, 0, 0, 0, 0];

    // Check each corner
    for (let i = 0; i < corners.length; i++) {
        const corner = corners[i];
        const color1 = cube[corner[0][0]][corner[0][1]];
        const color2 = cube[corner[1][0]][corner[1][1]];
        const color3 = cube[corner[2][0]][corner[2][1]];

        if (!checkCorner(color1, color2, color3)) {
            return false;
        }
    }

    let seen: string[] = []

    // Check each edge 
    for (let i = 0; i < edges.length; i++) {
        const edge = edges[i];
        const color1 = cube[edge[0][0]][edge[0][1]]
        const color2 = cube[edge[1][0]][edge[1][1]]

        const colors = [color1, color2].sort();
        const key = colors.join("-");

        if (seen.some(p => p === key)) {
            return false;
        }

        seen.push(key)

        if (!checkEdge(color1, color2)) {
            return false;
        }
    }

    for (let i = 0; i < corners.length; i++) {
        const corner = corners[i];
        const color1: string = cube[corner[0][0]][corner[0][1]];
        const color2: string = cube[corner[1][0]][corner[1][1]];
        const color3: string = cube[corner[2][0]][corner[2][1]];

        countColors[COLOR_TABLE[color1 as keyof typeof COLOR_TABLE]]++;
        countColors[COLOR_TABLE[color2 as keyof typeof COLOR_TABLE]]++;
        countColors[COLOR_TABLE[color3 as keyof typeof COLOR_TABLE]]++;
    }

    console.log(countColors);

    return true;
};

// Find correct orientation by trying all rotations and checking corners
const findBestOrientation = (cube: string[][]): string[][] => {
    "worklet";

    let best: string[][] = [];

    console.log("--- Begin Test ---");

    // Try all 4 rotations of the white (top) face
    for (let whiteRot = 0; whiteRot < 4; whiteRot++) {
        // Try all 4 rotations of the green (front) face
        for (let greenRot = 0; greenRot < 4; greenRot++) {
            // Make a copy to test
            const testCube: string[][] = [[], [], [], [], [], []];
            for (let i = 0; i < 6; i++) {
                for (let j = 0; j < 9; j++) {
                    testCube[i][j] = cube[i][j];
                }
            }

            // Apply rotations to white and green
            for (let r = 0; r < whiteRot; r++) {
                rotateSideCW(testCube[0]);
            }
            for (let r = 0; r < greenRot; r++) {
                rotateSideCW(testCube[2]);
            }

            // Now orient the other 4 faces by trying all combinations
            for (let redRot = 0; redRot < 4; redRot++) {
                for (let orangeRot = 0; orangeRot < 4; orangeRot++) {
                    for (let blueRot = 0; blueRot < 4; blueRot++) {
                        for (let yellowRot = 0; yellowRot < 4; yellowRot++) {
                            // Make another copy
                            const fullTest: string[][] = [
                                [],
                                [],
                                [],
                                [],
                                [],
                                [],
                            ];
                            for (let i = 0; i < 6; i++) {
                                for (let j = 0; j < 9; j++) {
                                    fullTest[i][j] = testCube[i][j];
                                }
                            }

                            // Apply remaining rotations
                            for (let r = 0; r < redRot; r++) {
                                rotateSideCW(fullTest[3]);
                            }
                            for (let r = 0; r < orangeRot; r++) {
                                rotateSideCW(fullTest[1]);
                            }
                            for (let r = 0; r < blueRot; r++) {
                                rotateSideCW(fullTest[4]);
                            }
                            for (let r = 0; r < yellowRot; r++) {
                                rotateSideCW(fullTest[5]);
                            }

                            // Check if this orientation is valid
                            if (isValidOrientation(fullTest)) {
                                console.log("Found valid orientation!");
                                printCube(fullTest);
                                console.log(
                                    `Rotations - W:${whiteRot} O:${orangeRot} G:${greenRot} R:${redRot} B:${blueRot} Y:${yellowRot}`,
                                );
                                best = fullTest;
                            }
                        }
                    }
                }
            }
        }
    }

    console.log("----------------");

    if (best.length === 6) {
        return best;
    }

    // If no valid orientation found, return original
    console.log("WARNING: Could not find valid cube orientation!");
    return cube;
};

export const organizeCube = (scannedSides: any) => {
    "worklet";

    // Convert to proper array manually (worklet-safe)
    const sidesArray: string[][] = [];
    for (let i = 0; i < 6; i++) {
        const side = scannedSides[i];
        const sideArray: string[] = [];
        for (let j = 0; j < 9; j++) {
            sideArray[j] = side[j];
        }
        sidesArray[i] = sideArray;
    }

    // Step 1: Sort by center colors
    const sortedCube: string[][] = [[], [], [], [], [], []];

    for (let i = 0; i < sidesArray.length; i++) {
        const side = sidesArray[i];
        const centerColor = side[4];
        let index = -1;

        if (centerColor === "white") index = 0;
        else if (centerColor === "orange") index = 1;
        else if (centerColor === "green") index = 2;
        else if (centerColor === "red") index = 3;
        else if (centerColor === "blue") index = 4;
        else if (centerColor === "yellow") index = 5;

        // Deep copy the side
        for (let j = 0; j < 9; j++) {
            sortedCube[index][j] = side[j];
        }
    }

    // Step 2: Find the correct orientation using corner validation
    const orientedCube = findBestOrientation(sortedCube);

    return orientedCube;
};

export const validCubeColors = (s: any) => {
    "worklet";

    let vals = [0, 0, 0, 0, 0, 0];
    console.log("------CHECKING------");

    for (let i = 0; i < 6; i++) {
        const side = s[i];
        console.log(side);

        for (let j = 0; j < 9; j++) {
            const color = side[j];
            if (color === "orange") vals[0]++;
            else if (color === "red") vals[1]++;
            else if (color === "yellow") vals[2]++;
            else if (color === "blue") vals[3]++;
            else if (color === "green") vals[4]++;
            else if (color === "white") vals[5]++;
        }
    }

    for (let i = 0; i < vals.length; i++) {
        if (vals[i] !== 9) {
            console.log("INVALID CUBE: Resetting");
            console.log(vals);
            return false;
        }
    }
    return true;
};
