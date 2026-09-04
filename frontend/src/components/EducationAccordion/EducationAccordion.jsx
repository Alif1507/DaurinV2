import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import './EducationAccordion.css'

const ease = [0.22, 1, 0.36, 1]

const educationItems = [
  {
    id: 1,
    title: 'Kenapa sekarang hanya residu yang diterima?',
    paragraphs: [
      'Bayangin setiap hari sekolah menghasilkan ratusan kilo sampah. Kalau semuanya langsung dicampur dan dikirim ke Bantargebang, sampah yang sebenarnya masih bisa dimanfaatkan ikut menumpuk di sana.',
      'Padahal, botol plastik masih bisa didaur ulang, sisa makanan bisa diolah, dan kardus masih punya nilai. Karena itu, sampah perlu dipilah dan diolah terlebih dahulu. Yang benar-benar tersisa dan sudah tidak bisa dimanfaatkan lagi barulah menjadi residu untuk dibawa ke tahap pengelolaan akhir.',
    ],
    highlight: 'Jadi, bukan sampahnya yang langsung dibuang—kita harus kasih kesempatan sampah untuk dipakai kembali.',
  },
  {
    id: 2,
    title: 'Jadi, apa sebenarnya sampah residu?',
    paragraphs: [
      'Setelah sampah dipilah, ternyata nggak semuanya bisa diselamatkan.',
      'Ada sampah yang sudah terlalu kotor, tercampur, atau memang sulit untuk diolah kembali. Nah, sampah yang tersisa inilah yang disebut residu.',
      'Contohnya seperti tisu kotor, popok sekali pakai, atau kemasan yang sudah terkontaminasi dan tidak punya jalur daur ulang.',
    ],
    highlight: 'Residu adalah “sisa terakhir” setelah kita melakukan yang terbaik untuk mengolah sampah.',
  },
  {
    id: 3,
    title: 'Kenapa kita harus mengurangi residu?',
    paragraphs: [
      'Karena setiap sampah yang berhasil kita pilah berarti satu bagian sampah yang tidak perlu berakhir sebagai residu.',
      'Bayangkan dari 100 kg sampah sekolah, 70 kg masih bisa diolah atau didaur ulang. Berarti hanya 30 kg yang menjadi residu.',
      'Kalau satu sekolah bisa mengurangi residunya setiap hari, bayangkan kalau dilakukan oleh ratusan sekolah.',
    ],
    highlight: 'Perubahan besar sebenarnya dimulai dari satu hal sederhana: tahu harus membuang sampah ke mana.',
  },
]

function AccordionItem({ item, isOpen, onToggle, index }) {
  const reduceMotion = useReducedMotion()
  const buttonId = `education-trigger-${item.id}`
  const panelId = `education-panel-${item.id}`

  return (
    <motion.article
      className={`education__item${isOpen ? ' is-open' : ''}`}
      initial={reduceMotion ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.28 }}
      transition={{ duration: reduceMotion ? 0 : 0.66, delay: reduceMotion ? 0 : index * 0.1, ease }}
    >
      <motion.button
        id={buttonId}
        type="button"
        className="education__trigger"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={onToggle}
        whileHover={reduceMotion ? undefined : { y: -2, scale: 1.002 }}
        whileTap={reduceMotion ? undefined : { scale: 0.995 }}
        transition={{ duration: 0.28, ease }}
      >
        <span>{item.title}</span>
        <motion.span
          className="education__chevron"
          aria-hidden="true"
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.35, ease }}
        >
          <ChevronRight />
        </motion.span>
      </motion.button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={panelId}
            className="education__panel-wrap"
            role="region"
            aria-labelledby={buttonId}
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: reduceMotion ? 0 : 0.5, ease },
              opacity: { duration: reduceMotion ? 0 : 0.25 },
            }}
          >
            <motion.div
              className="education__content"
              initial={reduceMotion ? false : { opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: reduceMotion ? 0 : 0.34, delay: reduceMotion ? 0 : 0.1, ease }}
            >
              <div className="education__copy">
                {item.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              <p className="education__highlight">{item.highlight}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  )
}

export default function EducationAccordion() {
  const [openId, setOpenId] = useState(null)
  const reduceMotion = useReducedMotion()

  function toggleItem(id) {
    setOpenId((current) => (current === id ? null : id))
  }

  return (
    <section id="edukasi" className="education" aria-labelledby="education-title">
      <div className="education__inner">
        <motion.h2
          id="education-title"
          className="education__title"
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.8 }}
          transition={{ duration: reduceMotion ? 0 : 0.72, ease }}
        >
          <span>Edukasi</span>
        </motion.h2>

        <div className="education__list">
          {educationItems.map((item, index) => (
            <AccordionItem
              key={item.id}
              item={item}
              index={index}
              isOpen={openId === item.id}
              onToggle={() => toggleItem(item.id)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
