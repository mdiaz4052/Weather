/** Design interface; there is no installed or runnable browser app yet. */
export type CameraState = {
  longitude: number;
  latitude: number;
  heightMeters: number;
  headingRadians: number;
  pitchRadians: number;
  rollRadians: number;
};

export type PreparedFrame = {
  executionPlanId: string;
  frameId: string;
  calendar: string;
  temporalKind: "instant" | "interval";
  validTime: string | null;
  timeBounds: readonly [string, string] | null;
  label: string;
  imagery:
    | {
        kind: "geographic-overview";
        parts: readonly {
          url: string;
          boundsWsen: readonly [number, number, number, number];
        }[];
      }
    | { kind: "geographic-xyz"; template: string; maxLevel: number };
  legend: {
    units: string;
    paletteId: string;
    range: readonly [number, number];
    baselineId: string | null;
  };
  attribution: readonly string[];
};

export type FrameHandle = { readonly id: string };

export interface MapAdapter {
  mount(container: HTMLElement): Promise<void>;
  prepareFrame(frame: PreparedFrame): Promise<FrameHandle>;
  commitFrame(handle: FrameHandle): void;
  discardFrame(handle: FrameHandle): void;
  getCamera(): CameraState;
  setCamera(camera: CameraState): void;
  onPointSelected(
    callback: (point: { latitude: number; longitude: number }) => void,
  ): () => void;
  setSelectedPoint(point: { latitude: number; longitude: number } | null): void;
  destroy(): void;
}
