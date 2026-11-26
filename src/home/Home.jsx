import Navbar from './Navbar'
import HeroCartoon from './HeroCartoon'
import TrustBar from './TrustBar'
import CartoonExplainer from './CartoonExplainer'
import Features from './Features'
import Edge from './Edge'
import Rewards from './Rewards'
import HowItWorks from './HowItWorks'
import Security from './Security'
import CtaBand from './CtaBand'
import Footer from './Footer'
import ScrollToTop from './ScrollToTop'
import Seo, { homeJsonLd } from '../components/Seo'

export default function Home() {
  return (
    <>
      <Seo path="/" jsonLd={homeJsonLd} />
      <Navbar />
      <HeroCartoon />
      <div id="trust-bar">
        <TrustBar />
      </div>
      <CartoonExplainer />
      <Features />
      <Edge />
      <Rewards />
      <HowItWorks />
      <Security />
      <CtaBand />
      <Footer />
      <ScrollToTop />
    </>
  )
}