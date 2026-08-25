import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'

function EarthMesh() {
  const earthRef = useRef(null)
  const colorMap = useTexture('/img/Hero/texture/bumi3.jpg')

  useFrame((state, delta) => {
    if (!earthRef.current) return

    const coarsePointer = window.matchMedia('(pointer: coarse)').matches
    earthRef.current.rotation.y += delta * 0.072
    earthRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.75) * 0.035

    const targetX = coarsePointer ? 0 : state.pointer.y * 0.07
    const targetZ = coarsePointer ? 0 : -state.pointer.x * 0.04
    earthRef.current.rotation.x = THREE.MathUtils.lerp(
      earthRef.current.rotation.x,
      0.11 + targetX,
      0.025,
    )
    earthRef.current.rotation.z = THREE.MathUtils.lerp(
      earthRef.current.rotation.z,
      targetZ,
      0.025,
    )
  })

  return (
    <mesh ref={earthRef} rotation={[0.11, -0.45, 0]}>
      <sphereGeometry args={[1.55, 96, 96]} />
      <meshStandardMaterial map={colorMap} roughness={0.7} metalness={0.025} />
    </mesh>
  )
}

function Atmosphere() {
  return (
    <mesh scale={1.025} rotation={[0.11, 0, 0]}>
      <sphereGeometry args={[1.55, 64, 64]} />
      <meshBasicMaterial
        color="#bcebd2"
        transparent
        opacity={0.055}
        side={THREE.BackSide}
      />
    </mesh>
  )
}

export default function Earth3D() {
  return (
    <div className="earth-canvas" aria-hidden="true">
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0.05, 4.8], fov: 40 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <ambientLight intensity={1.35} />
        <directionalLight position={[-3, 4, 5]} intensity={2.4} />
        <directionalLight position={[4, 0, 2]} intensity={1} />
        <pointLight position={[0, -3, 2]} intensity={0.38} />
        <Suspense fallback={null}>
          <EarthMesh />
          <Atmosphere />
        </Suspense>
      </Canvas>
    </div>
  )
}
