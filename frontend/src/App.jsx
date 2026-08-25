import { useLayoutEffect } from 'react'
import Navbar from './components/Navbar/Navbar'
import Hero from './components/Hero/Hero'
import About from './components/About/About'
import Flow from './components/Flow/Flow'
import EducationAccordion from './components/EducationAccordion/EducationAccordion'

export default function App() {
  useLayoutEffect(() => {
    const targetId = window.location.hash.slice(1)
    if (!targetId) return undefined

    document.getElementById(targetId)?.scrollIntoView({
      behavior: 'auto',
      block: 'start',
    })

    return undefined
  }, [])

  return (
    <main>
      <Navbar />
      <Hero />
      <About />
      <Flow />
      <EducationAccordion />
    </main>
  )
}
