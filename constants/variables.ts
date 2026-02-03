import { Color, Range } from "./types"

export const cubeRanges = [
    {
        // High Red, very Low Green/Blue
        color: "red",
        min: { red: 160, green: 0,   blue: 0,   alpha: 0} as Color,
        max: { red: 255, green: 90,  blue: 90,  alpha: 255} as Color
    } as Range,

    {
        // High Red, MEDIUM Green (This distinguishes it from Red), Low Blue
        color: "orange",
        min: { red: 180, green: 91,  blue: 0,   alpha: 0} as Color,
        max: { red: 255, green: 170, blue: 150, alpha: 255} as Color
    } as Range,

    {
        // High Red AND High Green
        color: "yellow",
        min: { red: 180, green: 180, blue: 0,   alpha: 0} as Color,
        max: { red: 255, green: 255, blue: 150, alpha: 255} as Color
    } as Range,

    {
        // Low Red, High Green, Low/Medium Blue
        color: "green",
        min: { red: 0,   green: 160, blue: 0,   alpha: 0} as Color,
        max: { red: 110, green: 255, blue: 180, alpha: 255} as Color
    } as Range,

    {
        // Low Red, Low Green, High Blue
        color: "blue",
        min: { red: 0,   green: 0,   blue: 160, alpha: 0} as Color,
        max: { red: 100, green: 190, blue: 255, alpha: 255} as Color
    } as Range,

    {
        // High Red, High Green, High Blue (All bright)
        color: "white",
        min: { red: 160, green: 160, blue: 160, alpha: 0} as Color,
        max: { red: 255, green: 255, blue: 255, alpha: 255} as Color
    } as Range
]