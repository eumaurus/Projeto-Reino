import { useEffect } from 'react'
import Navbar from '../../shared/components/layout/Navbar'
import Footer from '../../shared/components/layout/Footer'
import HeroSection       from './sections/HeroSection'
import ValuesSection     from './sections/ValuesSection'
import ServicesSection   from './sections/ServicesSection'
import StructureSection  from './sections/StructureSection'
import TeamSection       from './sections/TeamSection'
import ContactSection    from './sections/ContactSection'

export default function LandingPage() {
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) entry.target.classList.add('visible')
            })
        }, { threshold: 0.1 })

        document.querySelectorAll('.animate-fade-in').forEach(el => observer.observe(el))
        return () => observer.disconnect()
    }, [])

    return (
        <>
            <Navbar variant="public" />
            <main>
                <HeroSection />
                <ValuesSection />
                <ServicesSection />
                <StructureSection />
                <TeamSection />
                <ContactSection />
            </main>
            <Footer />
        </>
    )
}
