import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion'
import Earth3D from './Earth3D'
import './Hero.css'

const letters = [1, 2, 3, 4, 5, 6]
const cloudSrc = '/img/Hero/cloud-transparent-png-0.webp'

export default function Hero() {
  const reduceMotion = useReducedMotion()
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const smoothX = useSpring(mouseX, { stiffness: 70, damping: 24, mass: 0.8 })
  const smoothY = useSpring(mouseY, { stiffness: 70, damping: 24, mass: 0.8 })
  const cloudLeftX = useTransform(smoothX, [-1, 1], [10, -10])
  const cloudRightX = useTransform(smoothX, [-1, 1], [-10, 10])
  const cloudY = useTransform(smoothY, [-1, 1], [5, -5])

  function handlePointerMove(event) {
    if (reduceMotion || event.pointerType === 'touch') return
    mouseX.set((event.clientX / window.innerWidth - 0.5) * 2)
    mouseY.set((event.clientY / window.innerHeight - 0.5) * 2)
  }

  function resetPointer() {
    mouseX.set(0)
    mouseY.set(0)
  }

  return (
    <section
      id="top"
      className="hero"
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
      aria-label="Daurin, solusi ekonomi sirkular"
    >
      <motion.div
        className="hero__cloud-shell hero__cloud-shell--left"
        aria-hidden="true"
        initial={reduceMotion ? false : { opacity: 0, x: -90 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1.45, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.img
          src={cloudSrc}
          alt=""
          className="hero__cloud"
          style={reduceMotion ? undefined : { x: cloudLeftX, y: cloudY }}
        />
      </motion.div>

      <motion.div
        className="hero__cloud-shell hero__cloud-shell--right"
        aria-hidden="true"
        initial={reduceMotion ? false : { opacity: 0, x: 90 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1.45, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="hero__cloud-mirror">
          <motion.img
            src={cloudSrc}
            alt=""
            className="hero__cloud"
            style={reduceMotion ? undefined : { x: cloudRightX, y: cloudY }}
          />
        </div>
      </motion.div>

      <div className="hero__center">
        <motion.div
          className="hero__earth-wrap"
          initial={reduceMotion ? false : { opacity: 0, y: 40, scale: 0.88, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 1.25, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <Earth3D />
          <motion.div
            className="hero__earth-shadow"
            initial={reduceMotion ? false : { opacity: 0, scaleX: 0.5 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 1.2, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
          />
        </motion.div>

        <motion.h1
          className="hero__title-art"
          aria-label="Daurin"
          initial={reduceMotion ? false : { opacity: 0, y: 50, scale: 0.93, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 1.05, delay: 0.68, ease: [0.16, 1, 0.3, 1] }}
        >
          {letters.map((number) => (
            <img
              key={number}
              src={`/img/Hero/Berita%20Terkini%20${number}.webp`}
              alt=""
              aria-hidden="true"
              draggable="false"
            />
          ))}
        </motion.h1>
      </div>

      <motion.div
        className="hero__scroll-indicator"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        aria-hidden="true"
      >
        <span />
      </motion.div>
    </section>
  )
}
