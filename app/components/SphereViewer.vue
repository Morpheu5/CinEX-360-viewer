<template>
    <div id="viewer" ref="viewer" />
</template>

<script setup lang="ts">
    import { usePointer } from '@vueuse/core';
import {
        LinearToneMapping,
        MathUtils,
        Mesh,
        MeshBasicMaterial,
        PerspectiveCamera,
        Scene,
        SphereGeometry,
        SRGBColorSpace,
        TextureLoader,
        WebGLRenderer,
    } from 'three';

    const viewer = ref()

    let isUserInteracting = false

    let onPointerDownX = 0, onPointerDownY = 0,
        lon = 0, onPointerDownLon = 0,
        lat = 0, onPointerDownLat = 0,
        phi = 0, theta = 0;

    const camera = new PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.1, 1000)
    const scene = new Scene()
    const renderer = new WebGLRenderer()
    renderer.setPixelRatio(window.devicePixelRatio);
    // renderer.setSize
    renderer.toneMapping = LinearToneMapping
    // renderer.toneMappingExposure = 2.5

    const sphereGeometry = new SphereGeometry(500, 60, 40)
    // invert the geometry to make all the faces point inwards (fixes x-mirroring)
    sphereGeometry.scale(-1, 1, 1)

    const texture = new TextureLoader().load('/photospheres/demo/demo.jpg')
    texture.colorSpace = SRGBColorSpace
    const sphereMaterial = new MeshBasicMaterial({ map: texture })
    const sphereMesh = new Mesh(sphereGeometry, sphereMaterial)

    const resizeCanvas = () => {
        renderer.setSize(window.innerWidth, window.innerHeight)
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
    }

    const handlePointerDown = (event: PointerEvent) => {
        if (!event.isPrimary) return

        isUserInteracting = true

        onPointerDownX = event.clientX
        onPointerDownY = event.clientY

        onPointerDownLon = lon
        onPointerDownLat = lat
    }

    const handlePointerMove = (event: PointerEvent) => {
        if (!event.isPrimary) return
        if (!isUserInteracting) return

        lon = (onPointerDownX - event.clientX) * 0.1 + onPointerDownLon
        lat = (event.clientY - onPointerDownY) * 0.1 + onPointerDownLat
    }

    const handlePointerUp = (event: PointerEvent) => {
        if (!event.isPrimary) return

        isUserInteracting = false
    }

    const handleClick = (event: PointerEvent) => {
        if (!event.isPrimary) return

    }

    const runAnimation = () => {
        // lon = -x.value * 0.1;
        lat = Math.max( - 85, Math.min( 85, lat ) );
        phi = MathUtils.degToRad( 90 - lat );
        theta = MathUtils.degToRad( lon );

        const cx = 500 * Math.sin( phi ) * Math.cos( theta );
        const cy = 500 * Math.cos( phi );
        const cz = 500 * Math.sin( phi ) * Math.sin( theta );

        camera.lookAt( cx, cy, cz );
        renderer.render(scene, camera)
        requestAnimationFrame(runAnimation)
    }

    onMounted(() => {
        scene.add(sphereMesh)
        scene.add(camera)
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
    html {
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
</style>

