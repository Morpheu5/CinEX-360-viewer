import type {
    Object3D
} from 'three';

export type Nullable<T> = T | null | undefined
export type GalleryImage = {
    type: string,
    path: string
}
export type GalleryDescription = Array<GalleryImage>
export type InstancedObject = {
    mesh: Object3D,
    type: string,
    gallery?: GalleryDescription,
    sceneName?: string,
}
