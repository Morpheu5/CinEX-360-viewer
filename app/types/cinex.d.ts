import type {
    Object3D
} from 'three';

export type Nullable<T> = T | null | undefined
export type InstancedObject = {
    mesh: Object3D,
    path?: string,
    sceneName?: string,
}
