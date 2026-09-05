import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import './Flow.css'

const ease = [0.22, 1, 0.36, 1]

const routeOptions = [
  { id: 'organic', label: 'Organik' },
  { id: 'anorganic', label: 'Anorganik' },
  { id: 'residual', label: 'Residu' },
]

const openingSteps = [
  {
    image: 'Rectangle 23.png',
    label: 'Sekolah',
    alt: 'Gedung sekolah tempat alur pengelolaan sampah dimulai',
  },
  {
    image: 'Rectangle 6.png',
    label: 'Sampah dihasilkan',
    alt: 'Siswa membuang sampah ke tempat sampah sekolah',
  },
  {
    image: 'Rectangle 7.png',
    label: 'Pemilahan',
    alt: 'Para siswa memilah sampah bersama-sama',
  },
]

const organicSteps = [
  ['Rectangle 10.png', 'Organik', 'Sisa buah, sayur, dan bahan organik'],
  ['Rectangle 11.png', 'Pengolahan organik', 'Sampah organik dimasukkan ke tempat pengolahan'],
  ['Rectangle 12.png', 'Kompos', 'Sisa makanan diolah menjadi kompos'],
  ['Rectangle 13.png', 'Dimanfaatkan', 'Kompos dimanfaatkan kembali oleh siswa'],
]

const closingSteps = [
  ['Rectangle 20.png', 'Pengangkutan', 'Sampah residu diangkut dari sekolah'],
  ['Rectangle 21.png', 'TPST Bantargebang', 'Sampah tiba di TPST Bantargebang'],
  ['Rectangle 22.png', 'Pengelolaan akhir', 'Sampah menjalani pengelolaan akhir'],
]

function reveal(reduceMotion, direction = 'up', delay = 0) {
  if (reduceMotion) return {}

  const offset = direction === 'left'
    ? { x: -42 }
    : direction === 'right'
      ? { x: 42 }
      : { y: 34 }

  return {
    initial: { opacity: 0, ...offset },
    whileInView: { opacity: 1, x: 0, y: 0 },
    viewport: { once: true, amount: 0.18 },
    transition: { duration: 0.76, delay, ease },
  }
}

function ProcessCard({ image, label, alt, size = 'regular', animate = true, delay = 0 }) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.figure
      className={`alur__card alur__card--${size}`}
      {...(animate ? reveal(reduceMotion, 'up', delay) : {})}
    >
      <img
        src={encodeURI(`/img/Alur/${image}`)}
        alt={alt}
        loading="lazy"
        decoding="async"
      />
      <figcaption>{label}</figcaption>
    </motion.figure>
  )
}

function FlowArrow({ compact = false }) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.svg
      className={`alur__arrow${compact ? ' alur__arrow--compact' : ''}`}
      viewBox="0 0 24 72"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      initial={reduceMotion ? false : { opacity: 0, scaleY: 0.2 }}
      whileInView={{ opacity: 1, scaleY: 1 }}
      viewport={{ once: true, amount: 0.7 }}
      transition={{ duration: reduceMotion ? 0 : 0.48, ease }}
    >
      <path d="M12 3V61M5 54L12 61L19 54" />
    </motion.svg>
  )
}

function ForkConnector({ selectedRoute, onSelect }) {
  const reduceMotion = useReducedMotion()

  function handleKeyDown(event, currentIndex) {
    const keyMoves = {
      ArrowRight: 1,
      ArrowDown: 1,
      ArrowLeft: -1,
      ArrowUp: -1,
    }

    let nextIndex
    if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = routeOptions.length - 1
    else if (keyMoves[event.key]) {
      nextIndex = (currentIndex + keyMoves[event.key] + routeOptions.length) % routeOptions.length
    } else return

    event.preventDefault()
    const nextRoute = routeOptions[nextIndex].id
    onSelect(nextRoute)
    window.requestAnimationFrame(() => document.getElementById(`alur-tab-${nextRoute}`)?.focus())
  }

  return (
    <motion.div
      className="alur__fork"
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.55 }}
      transition={{ duration: reduceMotion ? 0 : 0.65, ease }}
    >
      <svg viewBox="0 0 1200 110" preserveAspectRatio="none" focusable="false" aria-hidden="true">
        <path d="M600 2V35H200V101M600 35V101M600 35H1000V101" />
        <path d="M192 93L200 101L208 93M592 93L600 101L608 93M992 93L1000 101L1008 93" />
      </svg>
      <div className="alur__route-picker">
        <p>Pilih jalur hasil pemilahan</p>
        <div className="alur__route-buttons" role="tablist" aria-label="Pilih jenis sampah">
          {routeOptions.map((route, index) => {
            const isSelected = selectedRoute === route.id

            return (
              <button
                id={`alur-tab-${route.id}`}
                key={route.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-controls={`alur-route-${route.id}`}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => onSelect(route.id)}
                onKeyDown={(event) => handleKeyDown(event, index)}
              >
                {route.label}
              </button>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}

function SplitConnector() {
  return (
    <div className="alur__split-fork" aria-hidden="true">
      <svg viewBox="0 0 340 78" preserveAspectRatio="none" focusable="false">
        <path d="M170 2V26H85V69M170 26H255V69" />
        <path d="M78 62L85 69L92 62M248 62L255 69L262 62" />
      </svg>
    </div>
  )
}

export default function Flow() {
  const reduceMotion = useReducedMotion()
  const [selectedRoute, setSelectedRoute] = useState('organic')

  return (
    <section
      id="alur"
      className="alur"
      aria-labelledby="alur-title"
      data-mobile-route={selectedRoute}
    >
      <motion.header className="alur__header" {...reveal(reduceMotion)}>
        <h2 id="alur-title" className="alur__title">
          <span>Alur Pembuangan Sampah</span>
        </h2>
        <p>
          Ayo kita lihat bagaimana alur pembuangan sampah dari sekolah sampai
          pembuangan akhir.
        </p>
      </motion.header>

      <div className="alur__spine" aria-label="Tahap awal pengelolaan sampah">
        {openingSteps.map((step, index) => (
          <div className="alur__step" key={step.label}>
            <ProcessCard {...step} size="large" delay={index * 0.08} />
            {index < openingSteps.length - 1 && <FlowArrow />}
          </div>
        ))}
      </div>

      <ForkConnector selectedRoute={selectedRoute} onSelect={setSelectedRoute} />

      <div className="alur__branches" aria-label="Hasil pemilahan sampah">
        <motion.div
          id="alur-route-organic"
          className={`alur__branch alur__branch--organic${selectedRoute === 'organic' ? ' alur__branch--selected' : ''}`}
          {...reveal(reduceMotion, 'left')}
        >
          <div className="alur__mobile-entry"><FlowArrow compact /></div>
          {organicSteps.map(([image, label, alt], index) => (
            <div className="alur__branch-step" key={label}>
              <ProcessCard image={image} label={label} alt={alt} animate={false} />
              {index < organicSteps.length - 1 && <FlowArrow compact />}
            </div>
          ))}
        </motion.div>

        <motion.div
          id="alur-route-anorganic"
          className={`alur__branch alur__branch--anorganic${selectedRoute === 'anorganic' ? ' alur__branch--selected' : ''}`}
          {...reveal(reduceMotion, 'up', 0.08)}
        >
          <div className="alur__mobile-entry"><FlowArrow compact /></div>
          <ProcessCard
            image="Rectangle 8.png"
            label="Anorganik"
            alt="Sampah plastik dan kemasan anorganik"
            animate={false}
          />
          <FlowArrow compact />
          <ProcessCard
            image="Rectangle 14.png"
            label="Pengolahan berdasarkan jenis dan nilai"
            alt="Sampah anorganik dipilah berdasarkan jenis dan nilainya"
            animate={false}
          />

          <SplitConnector />

          <div className="alur__split" aria-label="Pemilahan berdasarkan nilai guna">
            <div className="alur__split-column">
              <ProcessCard
                image="Rectangle 15.png"
                label="Bernilai"
                alt="Sampah anorganik yang masih bernilai"
                size="small"
                animate={false}
              />
              <FlowArrow compact />
              <ProcessCard
                image="Rectangle 17.png"
                label={<>Bank sampah/<br />daur ulang</>}
                alt="Bank sampah sebagai tujuan bahan yang dapat didaur ulang"
                size="small"
                animate={false}
              />
            </div>

            <div className="alur__split-column alur__split-column--residual">
              <ProcessCard
                image="Rectangle 16.png"
                label="Tidak bernilai"
                alt="Kemasan yang tidak lagi memiliki nilai guna"
                size="small"
                animate={false}
              />
              <FlowArrow compact />
              <ProcessCard
                image="Rectangle 18.png"
                label="Residu"
                alt="Tumpukan sampah residu"
                size="small"
                animate={false}
              />
            </div>
          </div>
          <div className="alur__route-tail alur__route-tail--anorganic" aria-hidden="true" />
        </motion.div>

        <motion.div
          id="alur-route-residual"
          className={`alur__branch alur__branch--residual${selectedRoute === 'residual' ? ' alur__branch--selected' : ''}`}
          {...reveal(reduceMotion, 'right', 0.14)}
        >
          <div className="alur__mobile-entry"><FlowArrow compact /></div>
          <ProcessCard
            image="Rectangle 9.png"
            label="Residu"
            alt="Botol kaca dan sampah residu lainnya"
            animate={false}
          />
          <div className="alur__route-tail alur__route-tail--residual" aria-hidden="true" />
        </motion.div>
      </div>

      <div className="alur__merge" aria-hidden="true">
        <svg className="alur__merge-desktop" viewBox="0 0 1200 104" preserveAspectRatio="none" focusable="false">
          <path d="M700 0V38M1000 0V38H600V101M700 38H600" />
          <path d="M592 93L600 101L608 93" />
        </svg>
        <svg className="alur__merge-mobile" viewBox="0 0 24 72" preserveAspectRatio="none" focusable="false">
          <path d="M12 3V61M5 54L12 61L19 54" />
        </svg>
        <span>Jalur residu menuju pengangkutan</span>
      </div>

      <div className="alur__spine alur__spine--closing" aria-label="Tahap akhir sampah residu">
        {closingSteps.map(([image, label, alt], index) => (
          <div className="alur__step" key={label}>
            <ProcessCard image={image} label={label} alt={alt} size="large" />
            {index < closingSteps.length - 1 && <FlowArrow />}
          </div>
        ))}
      </div>
    </section>
  )
}
