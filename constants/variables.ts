import { ReferenceColor } from "./types"

// Typical camera readings for each sticker. A sample is classified as whichever
// of these is closest by euclidean distance in RGB space.
// Tune these from the "Looking at" log in the scanner if colors get misread.
export const cubeColors: ReferenceColor[] = [
    { color: "red",    red: 185, green: 30,  blue: 45  },
    { color: "orange", red: 225, green: 115, blue: 55  },
    { color: "yellow", red: 210, green: 210, blue: 75  },
    { color: "green",  red: 50,  green: 190, blue: 95  },
    { color: "blue",   red: 40,  green: 95,  blue: 200 },
    { color: "white",  red: 210, green: 210, blue: 210 },
]

// Side length (in screen points) of the on-screen guide box the cube face is lined up with.
// The scanner samples a 3x3 grid inside this box, converted to frame pixels at runtime.
export const SCAN_BOX_SIZE = 250

// Fraction of each sticker (centered) that gets averaged. Keep it well below 1 so the
// patch doesn't bleed into the black gaps or neighbouring stickers.
export const SAMPLE_FRACTION = 0.4

// Samples farther than this from every reference color are rejected, so frames
// without a cube in view don't get registered as a side.
export const MAX_COLOR_DISTANCE = 100

export const SortedCubeLookup = {
    "white": 0,
    "yellow": 1,
    "blue": 2,
    "green": 3,
    "orange": 4,
    "red": 5,
}
