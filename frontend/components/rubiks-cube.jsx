import { useGLTF } from "@react-three/drei/native";
import {
    useEffect,
    useLayoutEffect,
    useRef,
} from "react";
import { FACE_ORDER } from "@/scripts/organize-cube";

import * as THREE from "three";

function getGeometryCenter(mesh) {
    const center = new THREE.Vector3();
    mesh.geometry.computeBoundingBox();
    mesh.geometry.boundingBox.getCenter(center); // Get local center
    mesh.localToWorld(center); // Convert that specific point to World Space
    return center;
}

function applySideColors(sortedMeshes, sideColors) {
    sortedMeshes.forEach((mesh, i) => {
        mesh.material = mesh.material.clone();
        mesh.material.color.set(sideColors[i]);
    });
}

export default function RubiksCube({ modelRef, sides, currentMove, onMoveComplete }) {
    if (sides.length !== 6) {
        return (
            <mesh>...</mesh>
        );
    }

    const isColorsApplied = useRef(false);
    const isAnimating = useRef(false);
    const { scene } = useGLTF(require("../assets/models/rubiks.glb"));

    const sideMeshes = useRef({
        top: [],
        left: [],
        right: [],
        front: [],
        back: [],
        bottom: [],
    });

    useLayoutEffect(() => {
        if (!scene || isColorsApplied.current || !sides.length) return;

        // Collect all sticker meshes
        const allMeshes = [];
        scene.traverse((child) => {
            if (child.isMesh) {
                child.visible = true;
                const color = child.material.color;
                const isDark = color.r < 0.1 && color.g < 0.1 && color.b < 0.1;
                if (!isDark) allMeshes.push(child);
            }
        });

        allMeshes.forEach((m) => console.log(m.name, getGeometryCenter(m)));

        const threshold = 0.8; // tune to your model's scale

        // Up (white) - U1 is back-left, U9 is front-right
        const top = allMeshes
            .filter((m) => getGeometryCenter(m).y > threshold)
            .sort((a, b) => {
                const pa = getGeometryCenter(a), pb = getGeometryCenter(b);
                if (Math.abs(pa.z - pb.z) > 0.01) return pa.z - pb.z; // z- first (back = top row)
                return pa.x - pb.x; // x- first (left to right)
            });

        // Down (yellow) - D1 is front-left, D9 is back-right
        const bottom = allMeshes
            .filter((m) => getGeometryCenter(m).y < -threshold)
            .sort((a, b) => {
                const pa = getGeometryCenter(a), pb = getGeometryCenter(b);
                if (Math.abs(pa.z - pb.z) > 0.01) return pb.z - pa.z; // z+ first (front = top row)
                return pa.x - pb.x;
            });

        // Front (green) - F1 is top-left, F9 is bottom-right
        const front = allMeshes
            .filter((m) => getGeometryCenter(m).z > threshold)
            .sort((a, b) => {
                const pa = getGeometryCenter(a), pb = getGeometryCenter(b);
                if (Math.abs(pa.y - pb.y) > 0.01) return pb.y - pa.y; // y+ first (top row)
                return pa.x - pb.x;
            });

        // Back (blue) - B1 is top-left when facing back (x+ side)
        const back = allMeshes
            .filter((m) => getGeometryCenter(m).z < -threshold)
            .sort((a, b) => {
                const pa = getGeometryCenter(a), pb = getGeometryCenter(b);
                if (Math.abs(pa.y - pb.y) > 0.01) return pb.y - pa.y;
                return pb.x - pa.x; // x+ first (mirrored when facing back)
            });

        // Right (red) - R1 is top-left when facing right (z+ side)
        const right = allMeshes
            .filter((m) => getGeometryCenter(m).x > threshold)
            .sort((a, b) => {
                const pa = getGeometryCenter(a), pb = getGeometryCenter(b);
                if (Math.abs(pa.y - pb.y) > 0.01) return pb.y - pa.y;
                return pb.z - pa.z; // z- first (front = left side when facing right)
            });

        // Left (orange) - L1 is top-left when facing left (z- side)
        const left = allMeshes
            .filter((m) => getGeometryCenter(m).x < -threshold)
            .sort((a, b) => {
                const pa = getGeometryCenter(a), pb = getGeometryCenter(b);
                if (Math.abs(pa.y - pb.y) > 0.01) return pb.y - pa.y;
                return pa.z - pb.z; // z+ first (front = left side when facing left... mirrored)
            });

        applySideColors(top, sides[FACE_ORDER.white]);
        applySideColors(left, sides[FACE_ORDER.orange]);
        applySideColors(front, sides[FACE_ORDER.green]);
        applySideColors(right, sides[FACE_ORDER.red]);
        applySideColors(back, sides[FACE_ORDER.blue]);
        applySideColors(bottom, sides[FACE_ORDER.yellow]);

        console.log(top.length);

        sideMeshes.current.top = top;
        sideMeshes.current.bottom = bottom;
        sideMeshes.current.front = front;
        sideMeshes.current.left = left;
        sideMeshes.current.right = right;
        sideMeshes.current.back = back;

        isColorsApplied.current = true;
    }, [scene, sides]);

    useEffect(() => {
        if (currentMove !== "" && !isAnimating.current) {
            console.log("handle move");
            handleMove("R");
        }
    }, [currentMove]);

    const handleMove = (move) => {
        console.log("handle");
        const side = move[0];
        const isClockwise = move[move.length - 1] === "'";

        const angle = isClockwise ? -Math.PI / 2 : Math.PI / 2;

        const pivot = new THREE.Group();
        scene.add(pivot);

        const pieces = [];

        if (side === "U") {
            Object.values(sideMeshes.current).forEach((value) => {
                value.forEach((sticker) => {
                    if (getGeometryCenter(sticker).y > 0.5) {
                        pieces.push(sticker);
                    }
                });
            });
        } else if (side === "D") {
            Object.values(sideMeshes.current).forEach((value) => {
                value.forEach((sticker) => {
                    if (getGeometryCenter(sticker).y < -0.5) {
                        pieces.push(sticker);
                    }
                });
            });
        } else if (side === "F") {
            Object.values(sideMeshes.current).forEach((value) => {
                value.forEach((sticker) => {
                    if (getGeometryCenter(sticker).z > 0.5) {
                        pieces.push(sticker);
                    }
                });
            });
        } else if (side === "B") {
            Object.values(sideMeshes.current).forEach((value) => {
                value.forEach((sticker) => {
                    if (getGeometryCenter(sticker).z < -0.5) {
                        pieces.push(sticker);
                    }
                });
            });
        } else if (side === "L") {
            Object.values(sideMeshes.current).forEach((value) => {
                value.forEach((sticker) => {
                    if (getGeometryCenter(sticker).x < -0.5) {
                        pieces.push(sticker);
                    }
                });
            });   
        } else if (side === "R") {
            Object.values(sideMeshes.current).forEach((value) => {
                value.forEach((sticker) => {
                    if (getGeometryCenter(sticker).x > 0.5) {
                        pieces.push(sticker);
                    }
                });
            });
        }

        pieces.forEach((piece) => {
            pivot.attach(piece);
        });

        if (side === "U" || side === "D") {
            pivot.rotateY(angle);
        } else if (side === "F" || side === "B") {
            pivot.rotateZ(-angle);
        } else if (side === "L" || side === "R") {
            pivot.rotateX(angle);
        }

        console.log(pieces.length);

        pivot.updateMatrixWorld(true);

        while (pivot.children.length > 0) {
            scene.attach(pivot.children[0]);
        }

        scene.remove(pivot);

        onMoveComplete();

        console.log("done");
    };

    return <primitive object={scene} scale={0.3} />;
}