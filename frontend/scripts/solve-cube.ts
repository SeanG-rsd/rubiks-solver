/**
 *           |************|
             |*U1**U2**U3*|
             |************|
             |*U4**U5**U6*|
             |************|
             |*U7**U8**U9*|
             |************|
 ************|************|************|************
 *L1**L2**L3*|*F1**F2**F3*|*R1**R2**R3*|*B1**B2**B3*
 ************|************|************|************
 *L4**L5**L6*|*F4**F5**F6*|*R4**R5**R6*|*B4**B5**B6*
 ************|************|************|************
 *L7**L8**L9*|*F7**F8**F9*|*R7**R8**R9*|*B7**B8**B9*
 ************|************|************|************
             |************|
             |*D1**D2**D3*|
             |************|
             |*D4**D5**D6*|
             |************|
             |*D7**D8**D9*|
             |************|

 LOG          G G O
 LOG          G W O
 LOG          R G B
 LOG
 LOG  R Y W  G W R  Y G Y  G R Y
 LOG  O O B  O G B  W R W  R B W
 LOG  B O W  G B W  O Y R  W B Y
 LOG
 LOG          O Y B
 LOG          Y Y R
 LOG          O R B

FFLFULRFBDFDURULDRFURLFBFBULDBDDRLRBRDULLBBLUFRDRBUUBD
 *
 */

import { COLOR_TABLE } from "./organize-cube";

const conversionTable: { [key: string]: string } = {
    "white": "U",
    "green": "F",
    "orange": "L",
    "red": "R",
    "blue": "B",
    "yellow": "D",
};

const reorder = [0, 3, 2, 5, 1, 4];

export const solveCube = async (cube: string) : Promise<string> => {
    console.log(cube)
    try {
        const response = await fetch("http://10.8.146.239:8000/solve", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ "cube": cube }),
        });

        const data = await response.json();

        return data.solution;
    } catch (e) {
        return "Error";
    }
};

export const cubeToString = (cube: string[][]) => {
    let output = [..."UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB"];

    const kociembaOrder = ["white", "red", "green", "yellow", "orange", "blue"];

    kociembaOrder.map((color, kociembaIdx) => {
        const internalIdx = COLOR_TABLE[color];
        const side = reorder[internalIdx];

        for (let i = 0; i < 9; i++) {
            let idx = kociembaIdx * 9 + i;
            output[idx] = conversionTable[cube[internalIdx][i]];
        }
    });

    return output.join("");
};
