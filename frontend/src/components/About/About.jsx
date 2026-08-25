import { motion, useReducedMotion } from 'framer-motion'
import './About.css'

const revealEase = [0.22, 1, 0.36, 1]

export default function About() {
  const reduceMotion = useReducedMotion()

  const imageMotion = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, x: -72, y: 28, scale: 0.96 },
        whileInView: { opacity: 1, x: 0, y: 0, scale: 1 },
        viewport: { once: true, amount: 0.28 },
        transition: { duration: 0.95, ease: revealEase },
      }

  const copyMotion = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, x: 64, y: 20 },
        whileInView: { opacity: 1, x: 0, y: 0 },
        viewport: { once: true, amount: 0.32 },
        transition: { duration: 0.9, delay: 0.12, ease: revealEase },
      }

  return (
    <section id="tentang" className="about" aria-labelledby="about-title">
      <div className="about__layout">
        <motion.figure className="about__visual" {...imageMotion}>
          <img
            src="/img/Tentang/Frame%206.png"
            alt="Petugas kebersihan membawa sampah organik dan alat berkebun"
            loading="lazy"
            decoding="async"
          />
        </motion.figure>

        <motion.div className="about__content" {...copyMotion}>
          <h2 id="about-title" className="about__title">
            <span className="about__initial" aria-hidden="true">T</span>
            <span>entang Kami</span>
          </h2>

          <div className="about__description">
            <p>
              Daurin merupakan web application monitoring yang membantu para siswa
              dalam mengolah sampah, terkhususnya sampah residu. Hal ini membantu
              pengolahan pada penumpukan sampah yang terdapat di Bantar Gebang.
              Karena itu, Daurin memberikan edukasi dan membantu monitoring sistem
              untuk sekolah dalam mengelola sampah.
            </p>
          </div>

          <motion.a
            className="about__cta"
            href="#edukasi"
            whileHover={reduceMotion ? undefined : { y: -3 }}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
          >
            Edukasi Diri Sekarang
          </motion.a>
        </motion.div>
      </div>
    </section>
  )
}
