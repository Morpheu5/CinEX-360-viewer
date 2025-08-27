<template>
    <!-- <aside id="debugger">
        <p>lat: {{ lat }}</p>
        <p>lon: {{ lon }}</p>
        <p>x: {{ Math.floor(pointerX) }} &nbsp; y: {{ Math.floor(pointerY) }}</p>
        <p>{{ currentIntersection }}</p>
    </aside> -->
    <div id="viewer" ref="viewer" />
</template>

<script setup lang="ts">
    import {
        DoubleSide,
        LinearToneMapping,
        MathUtils,
        Mesh,
        MeshBasicMaterial,
        PerspectiveCamera,
        PlaneGeometry,
        Quaternion,
        Raycaster,
        Scene,
        SphereGeometry,
        SRGBColorSpace,
        TextureLoader,
        Vector2,
        Vector3,
        WebGLRenderer,
    } from 'three';
    import { isDefined } from '@vueuse/core';
    import type { InstancedObject, Nullable } from '~/types/cinex';


    const data = {
        'testing_1': {
            panorama: '/photospheres/demo/demo.jpg',
            objects: [
                {
                    type: 'image',
                    path: '/photospheres/demo/images/01.jpg',
                    lat: -15,
                    lon: -30,
                },
                {
                    type: 'image',
                    path: '/photospheres/demo/images/02.jpeg',
                    lat: 0,
                    lon: 0,
                },
                {
                    type: 'image',
                    path: '/photospheres/demo/images/03.jpeg',
                    lat: 15,
                    lon: 30,
                },
            ],
            links: [
                {
                    sceneName: 'testing_1',
                    lat: 0,
                    lon: 0,
                }
            ],
        },
        'testing_2': {
            panorama: '/photospheres/demo/demo.jpg',
            objects: [
                {
                    type: 'image',
                    path: '/photospheres/demo/images/01.jpg',
                    lat: 15,
                    lon: -30,
                },
                {
                    type: 'image',
                    path: '/photospheres/demo/images/02.jpeg',
                    lat: 0,
                    lon: 0,
                },
                {
                    type: 'image',
                    path: '/photospheres/demo/images/03.jpeg',
                    lat: -15,
                    lon: 30,
                },
            ],
            links: [
                {
                    type: 'link',
                    sceneName: 'testing_2',
                    lat: 0,
                    lon: 90,
                }
            ]
        }
    }

    const objects: Array<InstancedObject> = []
    let currentScene: string = 'testing_1'
    let currentIntersection: Nullable<InstancedObject> = null

    const latLonToXYZ = (lat: number, lon: number): { x: number, y: number, z: number, phi: number, theta: number } => {
        const _lat = Math.max(-45, Math.min(45, lat))
        const phi = MathUtils.degToRad(90 - _lat)
        const theta = MathUtils.degToRad(lon)

        return {
            x: Math.sin(phi) * Math.cos(theta),
            y: Math.cos(phi),
            z: Math.sin(phi) * Math.sin(theta),
            phi,
            theta
        }
    }

    const setupScene = async (sceneName: string) => {
        currentScene = sceneName
        scene.traverse(object => {
            if (object instanceof Mesh) {
                object.removeFromParent()
            }
        })

        const sphereGeometry = new SphereGeometry(raycaster.far + 10, 60, 40) // set radius bigger than the raycaster's far param
        // invert the geometry to make all the faces point inwards (fixes x-mirroring)
        sphereGeometry.scale(-1, 1, 1)

        const texture = new TextureLoader().load(data[sceneName].panorama)
        texture.colorSpace = SRGBColorSpace
        const sphereMaterial = new MeshBasicMaterial({ map: texture })
        const sphereMesh = new Mesh(sphereGeometry, sphereMaterial)

        scene.add(sphereMesh)
        scene.add(camera)

        // Load all the photos (objects)
        const texLoader = new TextureLoader()
        /*
        for (const object of data[sceneName].objects) {
            switch(object.type) {
                case 'image': {
                    const tex = await texLoader.loadAsync(object.path)
                    const aspect = tex.width / tex.height
                    tex.colorSpace = SRGBColorSpace
                    const mat = new MeshBasicMaterial({
                        color: 0xffffff,
                        map: tex,
                        side: DoubleSide,
                    })
                    const quadGeom = new PlaneGeometry(aspect, 1) // TODO Change the size appropriately
                    const quadMesh = new Mesh(quadGeom, mat)
                    const { x, y, z, phi, theta } = latLonToXYZ(object.lat, object.lon)
                    quadMesh.position.set(3*x, 3*y, 3*z)
                    const q = new Quaternion().setFromAxisAngle(quadMesh.up, Math.PI/2 - theta )
                    const r = new Quaternion().setFromAxisAngle({ x: -1, y: 0, z: 0}, Math.PI/2 - phi)
                    const s = q.multiply(r)
                    quadMesh.setRotationFromQuaternion(s)
                    objects.push({
                        mesh: quadMesh,
                        ...object
                    })
                    scene.add(quadMesh)
                    
                    break
                }
            }
        }
        */

        for (const link of data[sceneName].links) {
            const tex = await texLoader.loadAsync('/icons/jump_point.png')
            const aspect = tex.width / tex.height
            const mat = new MeshBasicMaterial({
                color: 0xffffff,
                map: tex,
                side: DoubleSide,
                transparent: true
            })
            const iconGeom = new PlaneGeometry(aspect/2.5, 1/2.5)
            const iconMesh = new Mesh(iconGeom, mat)
            const { x, y, z, phi, theta } = latLonToXYZ(link.lat, link.lon)
            iconMesh.position.set(3*x, 3*y, 3*z)
            const q = new Quaternion().setFromAxisAngle(iconMesh.up, Math.PI/2 - theta )
            const r = new Quaternion().setFromAxisAngle({ x: -1, y: 0, z: 0}, Math.PI/2 - phi)
            const s = q.multiply(r)
            iconMesh.setRotationFromQuaternion(s)
            objects.push({
                mesh: iconMesh,
                ...link,
            })
            scene.add(iconMesh)
        }
    }

    const viewer = ref()

    let isUserInteracting = false

    const lon = ref(0), lat = ref(0)
    let onPointerDownX = 0, onPointerDownY = 0
    let onPointerDownLon = 0, onPointerDownLat = 0

    const pointerX = ref(0), pointerY = ref(0)
    const raycaster = new Raycaster(new Vector3(0,0,0), new Vector3(0, 0, 1), 0.1, 100) 

    const camera = new PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.1, 1000)
    const scene = new Scene()
    const renderer = new WebGLRenderer()
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = LinearToneMapping
    renderer.setSize(window.innerWidth, window.innerHeight)

    await setupScene('testing_1')

    const pointerGeom = new SphereGeometry(1, 8, 8)
    const pointerMat = new MeshBasicMaterial({ color: 0xff0000 })
    const pointerMesh = new Mesh(pointerGeom, pointerMat)
    pointerMesh.position.set(50, 0, 0)
    scene.add(pointerMesh)

    const resizeCanvas = () => {
        renderer.setSize(
            window.innerWidth,
            window.innerHeight
        )
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
    }

    const handlePointerDown = (event: PointerEvent) => {
        if (!event.isPrimary) return

        isUserInteracting = true

        onPointerDownX = event.clientX
        onPointerDownY = event.clientY

        onPointerDownLon = lon.value
        onPointerDownLat = lat.value
    }

    const handlePointerMove = (event: PointerEvent) => {
        pointerX.value = event.clientX
        pointerY.value = event.clientY

        if (!event.isPrimary) return

        const v = new Vector2((pointerX.value / window.innerWidth)*2-1, -((pointerY.value / window.innerHeight)*2-1))
        raycaster.setFromCamera(v, camera)
        const intersections = raycaster.intersectObjects(scene.children, false)
        const intersected = intersections[0]?.object
        if (isDefined(intersected)) {
            const o = objects.find(o => o.mesh === intersected)
            currentIntersection = o
        } else {
            currentIntersection = null
        }

        if (!isUserInteracting) return

        lon.value = (onPointerDownX - pointerX.value) * 0.1 + onPointerDownLon
        lat.value = (pointerY.value - onPointerDownY) * 0.1 + onPointerDownLat
    }

    const handlePointerUp = (event: PointerEvent) => {
        if (!event.isPrimary) return

        isUserInteracting = false
    }

    const handleClick = (event: PointerEvent) => {
        if (!event.isPrimary) return

        console.log(".", currentIntersection)
    }

    const runAnimation = () => {
        const { x, y, z } = latLonToXYZ(lat.value, lon.value)
        camera.lookAt( x, y, z );

        renderer.render(scene, camera)
        requestAnimationFrame(runAnimation)
    }

    onMounted(() => {
        resizeCanvas()

        viewer.value.appendChild(renderer.domElement)

        window.addEventListener('resize', resizeCanvas)
        window.addEventListener('pointerdown', handlePointerDown)
        window.addEventListener('pointermove', handlePointerMove)
        window.addEventListener('pointerup', handlePointerUp)
        window.addEventListener('click', handleClick)
        runAnimation()
    })
</script>

<style lang="pcss" scoped>
    /* html {
        padding: 0;
        margin: 0;
    }
    body {
        margin: 0;
        padding: 0;
        background-color: #000;
        color: #fff;
        font-family: Monospace;
        font-size: 13px;
        line-height: 24px;
        overscroll-behavior: none;
    }
    #viewer, #viewer * {
        margin: 0;
        padding: 0;
    }

    #usepointer {
        padding: 10px;
    }
    */

    aside#debugger {
        position: absolute;
        background: white;
        padding: 0.25em 1em;
        z-index: 1000;
    }
</style>
