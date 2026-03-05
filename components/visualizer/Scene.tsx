'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import type { Palette } from '@/hooks/usePalette'
import type { AudioFeatures } from '@/hooks/useNowPlaying'

interface SceneProps {
  palette: Palette
  audioFeatures: AudioFeatures | null
  albumArtUrl: string | null
  shaderSrc: string
}

export function Scene({ palette, audioFeatures, albumArtUrl, shaderSrc }: SceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const composerRef = useRef<EffectComposer | null>(null)
  const materialRef = useRef<THREE.ShaderMaterial | null>(null)
  const clockRef = useRef(new THREE.Clock())
  const beatRef = useRef(0)
  const beatTimerRef = useRef(0)
  const rafRef = useRef<number | null>(null)

  // Build scene once on mount
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const renderer = new THREE.WebGLRenderer({
      canvas,
      preserveDrawingBuffer: true,
      antialias: true,
    })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    rendererRef.current = renderer

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    const geometry = new THREE.PlaneGeometry(2, 2)
    const material = new THREE.ShaderMaterial({
      vertexShader: `void main() { gl_Position = vec4(position, 1.0); }`,
      fragmentShader: shaderSrc,
      uniforms: {
        u_time: { value: 0 },
        u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        u_energy: { value: 0.5 },
        u_tempo: { value: 120 },
        u_beat: { value: 0 },
        u_color_a: { value: new THREE.Color('#7c3aed') },
        u_color_b: { value: new THREE.Color('#4c1d95') },
        u_color_c: { value: new THREE.Color('#1e0045') },
        u_album_tex: { value: null },
      },
    })
    materialRef.current = material

    scene.add(new THREE.Mesh(geometry, material))

    const composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))
    composer.addPass(
      new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0.4,
        0.4,
        0.85
      )
    )
    composerRef.current = composer

    const onResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight)
      composer.setSize(window.innerWidth, window.innerHeight)
      material.uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    const animate = () => {
      rafRef.current = requestAnimationFrame(animate)
      const elapsed = clockRef.current.getElapsedTime()
      material.uniforms.u_time.value = elapsed

      // Beat decay
      beatRef.current *= 0.92
      material.uniforms.u_beat.value = beatRef.current

      composer.render()
    }
    animate()

    return () => {
      window.removeEventListener('resize', onResize)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      renderer.dispose()
    }
    // shaderSrc not in deps intentionally — handled by key prop on parent
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update palette uniforms when palette changes
  useEffect(() => {
    const mat = materialRef.current
    if (!mat) return
    mat.uniforms.u_color_a.value = new THREE.Color(palette.vibrant)
    mat.uniforms.u_color_b.value = new THREE.Color(palette.muted)
    mat.uniforms.u_color_c.value = new THREE.Color(palette.darkVibrant)
  }, [palette])

  // Update audio feature uniforms + drive BPM beat timer
  useEffect(() => {
    const mat = materialRef.current
    if (!mat || !audioFeatures) return
    mat.uniforms.u_energy.value = audioFeatures.energy
    mat.uniforms.u_tempo.value = audioFeatures.tempo

    const beatInterval = (60 / audioFeatures.tempo) * 1000
    clearInterval(beatTimerRef.current)
    beatTimerRef.current = window.setInterval(() => {
      beatRef.current = 1.0
    }, beatInterval) as unknown as number

    return () => clearInterval(beatTimerRef.current)
  }, [audioFeatures])

  // Load album art texture
  useEffect(() => {
    const mat = materialRef.current
    if (!mat || !albumArtUrl) return
    const loader = new THREE.TextureLoader()
    let currentTex: THREE.Texture | null = null
    loader.load(albumArtUrl, (tex) => {
      const oldTex = mat.uniforms.u_album_tex.value as THREE.Texture | null
      oldTex?.dispose()
      mat.uniforms.u_album_tex.value = tex
      currentTex = tex
    })
    return () => {
      currentTex?.dispose()
    }
  }, [albumArtUrl])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full"
      style={{ zIndex: 0 }}
    />
  )
}
