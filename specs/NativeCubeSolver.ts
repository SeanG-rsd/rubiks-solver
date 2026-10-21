import {TurboModule, TurboModuleRegistry} from 'react-native';

export interface Spec extends TurboModule {
  // takes the 54 facelets in URFDLB order (e.g. "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB")
  // and resolves with the moves separated by spaces, e.g. "R U2 F' D", or "" if it's already solved.
  // rejects if the facelets aren't a solvable cube
  readonly solve: (facelets: string) => Promise<string>;
}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'NativeCubeSolver',
);
