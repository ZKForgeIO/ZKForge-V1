import { useState } from 'react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import Background3DGrid from './Background3DGrid';

const CoreFeatures = () => {
  const [activeCards, setActiveCards] = useState<boolean[]>([true, true, true]);
  const { elementRef: headerRef, isVisible: headerVisible } = useScrollAnimation();
  const { elementRef: cardsRef, isVisible: cardsVisible } = useScrollAnimation();

  const toggleCard = (index: number) => {
    const newActiveCards = [...activeCards];
    newActiveCards[index] = !newActiveCards[index];
    setActiveCards(newActiveCards);
  };

  return (
    <div className="relative px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
      <Background3DGrid />
      <div className="w-full max-w-7xl mx-auto relative z-10">
        <div
          ref={headerRef}
          className={`text-center space-y-4 mb-12 sm:mb-16 scroll-fade-in ${headerVisible ? 'visible' : ''}`}
        >
          <p className="text-xs sm:text-sm font-medium tracking-widest text-gray-400 uppercase">
            Core Features
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight">
            Three Pillars of Privacy
          </h2>
          <p className="max-w-4xl mx-auto text-sm sm:text-base lg:text-lg text-gray-300 leading-relaxed pt-2">
            ZKForge delivers complete privacy through three interconnected features powered by quantum-resistant zkSTARK proofs and Fully Homomorphic Encryption.
          </p>
        </div>

        <div
          ref={cardsRef}
          className={`grid lg:grid-cols-3 gap-6 lg:gap-8 scroll-fade-up ${cardsVisible ? 'visible' : ''}`}
        >
          {/* Card 1: Encrypted Messenger */}
          <div className={`lumen-card ${activeCards[0] ? 'active' : ''}`}>
            <div className="card-border"></div>
            <div className="light-layer">
              <div className="slit"></div>
              <div className="lumen">
                <div className="min"></div>
                <div className="mid"></div>
                <div className="hi"></div>
              </div>
              <div className="darken">
                <div className="sl"></div>
                <div className="ll"></div>
                <div className="slt"></div>
                <div className="srt"></div>
              </div>
            </div>
            <div className="content">
              <div className="icon">
                <svg className="w-12 h-12 sm:w-14 sm:h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <defs>
                    <linearGradient id="iconGradient1" x1="0" x2="0" y1="-1" y2="0.8">
                      <stop offset="0%" stopColor="#bbb" />
                      <stop offset="100%" stopColor="#555" />
                    </linearGradient>
                    <filter id="strong-inner1">
                      <feFlood floodColor="#17ff9a22" />
                      <feComposite operator="out" in2="SourceGraphic" />
                      <feMorphology operator="dilate" radius="2" />
                      <feGaussianBlur stdDeviation="8" />
                      <feComposite operator="atop" in2="SourceGraphic" />
                    </filter>
                  </defs>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} stroke="url(#iconGradient1)" filter="url(#strong-inner1)" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="bottom">
                <h4 className="text-xl sm:text-2xl font-bold text-white mb-3">Encrypted Messenger</h4>
                <p className="text-xs sm:text-sm text-gray-400 mb-4 pb-3 border-b border-gray-800">
                  Quantum-resistant zkSTARK messaging<br />with blockchain verification
                </p>
                <div className="toggle" onClick={() => toggleCard(0)}>
                  <div className="handle"></div>
                  <span className="text-xs text-gray-500">Activate Lumen</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Privacy dApps */}
          <div className={`lumen-card ${activeCards[1] ? 'active' : ''}`}>
            <div className="card-border"></div>
            <div className="light-layer">
              <div className="slit"></div>
              <div className="lumen">
                <div className="min"></div>
                <div className="mid"></div>
                <div className="hi"></div>
              </div>
              <div className="darken">
                <div className="sl"></div>
                <div className="ll"></div>
                <div className="slt"></div>
                <div className="srt"></div>
              </div>
            </div>
            <div className="content">
              <div className="icon">
                <svg className="w-12 h-12 sm:w-14 sm:h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <defs>
                    <linearGradient id="iconGradient2" x1="0" x2="0" y1="-1" y2="0.8">
                      <stop offset="0%" stopColor="#bbb" />
                      <stop offset="100%" stopColor="#555" />
                    </linearGradient>
                    <filter id="strong-inner2">
                      <feFlood floodColor="#17ff9a22" />
                      <feComposite operator="out" in2="SourceGraphic" />
                      <feMorphology operator="dilate" radius="2" />
                      <feGaussianBlur stdDeviation="8" />
                      <feComposite operator="atop" in2="SourceGraphic" />
                    </filter>
                  </defs>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} stroke="url(#iconGradient2)" filter="url(#strong-inner2)" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <div className="bottom">
                <h4 className="text-xl sm:text-2xl font-bold text-white mb-3">Privacy dApps</h4>
                <p className="text-xs sm:text-sm text-gray-400 mb-4 pb-3 border-b border-gray-800">
                  FHE smart contracts<br />for confidential computing
                </p>
                <div className="toggle" onClick={() => toggleCard(1)}>
                  <div className="handle"></div>
                  <span className="text-xs text-gray-500">Activate Lumen</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: x402 Protocol */}
          <div className={`lumen-card ${activeCards[2] ? 'active' : ''}`}>
            <div className="card-border"></div>
            <div className="light-layer">
              <div className="slit"></div>
              <div className="lumen">
                <div className="min"></div>
                <div className="mid"></div>
                <div className="hi"></div>
              </div>
              <div className="darken">
                <div className="sl"></div>
                <div className="ll"></div>
                <div className="slt"></div>
                <div className="srt"></div>
              </div>
            </div>
            <div className="content">
              <div className="icon">
                <svg className="w-12 h-12 sm:w-14 sm:h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <defs>
                    <linearGradient id="iconGradient3" x1="0" x2="0" y1="-1" y2="0.8">
                      <stop offset="0%" stopColor="#bbb" />
                      <stop offset="100%" stopColor="#555" />
                    </linearGradient>
                    <filter id="strong-inner3">
                      <feFlood floodColor="#17ff9a22" />
                      <feComposite operator="out" in2="SourceGraphic" />
                      <feMorphology operator="dilate" radius="2" />
                      <feGaussianBlur stdDeviation="8" />
                      <feComposite operator="atop" in2="SourceGraphic" />
                    </filter>
                  </defs>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} stroke="url(#iconGradient3)" filter="url(#strong-inner3)" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="bottom">
                <h4 className="text-xl sm:text-2xl font-bold text-white mb-3">x402 Protocol Layer</h4>
                <p className="text-xs sm:text-sm text-gray-400 mb-4 pb-3 border-b border-gray-800">
                  Anonymous payments<br />for AI agent economy
                </p>
                <div className="toggle" onClick={() => toggleCard(2)}>
                  <div className="handle"></div>
                  <span className="text-xs text-gray-500">Activate Lumen</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          .lumen-card {
            position: relative;
            background: radial-gradient(circle at 50% 0%, #3a3a3a 0%, #1a1a1a 64%);
            box-shadow:
              inset 0 1.01rem 0.2rem -1rem transparent,
              inset 0 -1.01rem 0.2rem -1rem #0000,
              0 -1.02rem 0.2rem -1rem transparent,
              0 1rem 0.2rem -1rem #0000,
              0 0 0 1px rgba(255, 255, 255, 0.2),
              0 4px 4px 0 rgba(0, 0, 0, 0.3),
              0 0 0 1px #333;
            border-radius: 1.8rem;
            color: #fff;
            padding: 1rem;
            display: flex;
            flex-direction: column;
            justify-content: end;
            transition: all 0.4s ease-in-out, translate 0.4s ease-out;
            height: 24rem;
          }

          .card-border {
            content: "";
            display: block;
            width: calc(100% + 2rem);
            height: calc(100% + 2rem);
            position: absolute;
            left: -1rem;
            right: -1rem;
            top: -1rem;
            bottom: -1rem;
            margin: auto;
            box-shadow: inset 0 0 0px 0.06rem rgba(255, 255, 255, 0.15);
            border-radius: 2.6rem;
            clip-path: polygon(
              4rem 0, 0 0, 0 4rem, 4rem 4rem, 4rem calc(100% - 4rem),
              0 calc(100% - 4rem), 0 100%, 4rem 100%, 4rem calc(100% - 4rem),
              calc(100% - 4rem) calc(100% - 4rem), calc(100% - 4rem) 100%,
              100% 100%, 100% calc(100% - 4rem), calc(100% - 4rem) calc(100% - 4rem),
              calc(100% - 4rem) 4rem, 100% 4rem, 100% 0, calc(100% - 4rem) 0,
              calc(100% - 4rem) 4rem, 4rem 4rem
            );
            transition: all 0.4s ease-in-out;
            pointer-events: none;
          }

          .lumen-card:hover {
            translate: 0 -0.2rem;
          }

          .lumen-card:hover .card-border {
            width: calc(100% + 1rem);
            height: calc(100% + 1rem);
            left: -0.5rem;
            right: -0.5rem;
            top: -0.5rem;
            bottom: -0.5rem;
            border-radius: 2.2rem;
            box-shadow: inset 0 0 0 0.08rem rgba(255, 255, 255, 0.1);
            clip-path: polygon(
              8rem 0, 0 0, 0 8rem, 8rem 8rem, 8rem calc(100% - 8rem),
              0 calc(100% - 8rem), 0 100%, 8rem 100%, 8rem calc(100% - 8rem),
              calc(100% - 8rem) calc(100% - 8rem), calc(100% - 8rem) 100%,
              100% 100%, 100% calc(100% - 8rem), calc(100% - 8rem) calc(100% - 8rem),
              calc(100% - 8rem) 8rem, 100% 8rem, 100% 0, calc(100% - 8rem) 0,
              calc(100% - 8rem) 8rem, 8rem 8rem
            );
          }

          .light-layer {
            position: absolute;
            left: 0;
            top: 0;
            height: 100%;
            width: 100%;
            transform-style: preserve-3d;
            perspective: 400px;
            pointer-events: none;
          }

          .slit {
            position: absolute;
            left: 0;
            right: 0;
            top: 0;
            bottom: 0;
            margin: auto;
            width: 64%;
            height: 1.2rem;
            transform: rotateX(-76deg);
            background: #121212;
            box-shadow: 0 0 4px 0 transparent;
            transition: all 0.4s ease-in-out;
          }

          .lumen {
            position: absolute;
            left: 0;
            right: 0;
            top: 0;
            bottom: 0;
            margin: auto;
            width: 100%;
            height: 100%;
            pointer-events: none;
            perspective: 400px;
            opacity: 0;
            transition: opacity 0.4s ease-in-out;
          }

          .min {
            width: 70%;
            height: 3rem;
            background: linear-gradient(transparent, rgba(23, 255, 154, 0.6));
            position: absolute;
            left: 0;
            right: 0;
            top: 0;
            bottom: 2.5rem;
            margin: auto;
            transform: rotateX(-42deg);
            opacity: 0.4;
          }

          .mid {
            width: 74%;
            height: 13rem;
            background: linear-gradient(transparent, rgba(23, 255, 154, 0.6));
            position: absolute;
            left: 0;
            right: 0;
            top: 0;
            bottom: 10em;
            margin: auto;
            transform: rotateX(-42deg);
            filter: blur(1rem);
            opacity: 0.8;
            border-radius: 100% 100% 0 0;
          }

          .hi {
            width: 50%;
            height: 13rem;
            background: linear-gradient(transparent, rgba(23, 255, 154, 0.6));
            position: absolute;
            left: 0;
            right: 0;
            top: 0;
            bottom: 12em;
            margin: auto;
            transform: rotateX(22deg);
            filter: blur(1rem);
            opacity: 0.6;
            border-radius: 100% 100% 0 0;
          }

          .darken {
            position: absolute;
            left: 0;
            right: 0;
            top: 0;
            bottom: 0;
            margin: auto;
            width: 100%;
            height: 100%;
            pointer-events: none;
            perspective: 400px;
            transition: opacity 0.4s ease-in-out;
            opacity: 0.5;
          }

          .darken > * {
            transition: opacity 0.4s ease-in-out;
          }

          .sl {
            width: 64%;
            height: 10rem;
            background: linear-gradient(#000, transparent);
            position: absolute;
            left: 0;
            right: 0;
            top: 9.6em;
            bottom: 0;
            margin: auto;
            filter: blur(0.2rem);
            opacity: 0.1;
            border-radius: 0 0 100% 100%;
            transform: rotateX(-22deg);
          }

          .ll {
            width: 62%;
            height: 10rem;
            background: linear-gradient(rgba(0, 0, 0, 0.6), transparent);
            position: absolute;
            left: 0;
            right: 0;
            top: 11em;
            bottom: 0;
            margin: auto;
            filter: blur(0.8rem);
            opacity: 0.4;
            border-radius: 0 0 100% 100%;
            transform: rotateX(22deg);
          }

          .slt {
            width: 0.5rem;
            height: 4rem;
            background: linear-gradient(rgba(0, 0, 0, 0.3), transparent);
            position: absolute;
            left: 0;
            right: 11.5rem;
            top: 3.9em;
            bottom: 0;
            margin: auto;
            opacity: 0.6;
            border-radius: 0 0 100% 100%;
            transform: skewY(42deg);
          }

          .srt {
            width: 0.5rem;
            height: 4rem;
            background: linear-gradient(rgba(0, 0, 0, 0.3), transparent);
            position: absolute;
            right: 0;
            left: 11.5rem;
            top: 3.9em;
            bottom: 0;
            margin: auto;
            opacity: 0.6;
            border-radius: 0 0 100% 100%;
            transform: skewY(-42deg);
          }

          .content {
            position: relative;
            z-index: 10;
          }

          .icon {
            position: absolute;
            top: -11rem;
            left: 0;
            right: 0;
            margin: auto;
            width: fit-content;
            filter: drop-shadow(0 -1.2rem 1px transparent);
            transition: filter 0.4s ease-in-out;
            color: #aaa;
          }

          .bottom {
            position: relative;
          }

          .toggle {
            position: absolute;
            right: 0;
            bottom: 0;
            height: 2rem;
            width: 4.8rem;
            border-radius: 0.6rem;
            background: #000;
            box-shadow:
              inset 0 -8px 8px 0.3rem rgba(0, 0, 0, 0.3),
              inset 0 0 1px 0.3rem #ddd,
              inset 0 -2px 1px 0.3rem #fff,
              inset 0 1px 2px 0.3rem rgba(0, 0, 0, 0.4),
              inset 0 0 1px 0.8rem #aaa;
            cursor: pointer;
            transition: all 0.4s ease-in-out;
          }

          .toggle::before {
            content: "";
            display: block;
            position: absolute;
            left: 0;
            right: 0;
            top: 0;
            bottom: 0;
            margin: auto;
            width: 3.4rem;
            height: 0.68rem;
            border-radius: 0.2rem;
            background: #000;
            transition: all 0.4s ease-in-out;
          }

          .handle {
            position: absolute;
            top: 0;
            bottom: 0.04rem;
            margin: auto;
            left: 0.68rem;
            width: 40%;
            height: 30%;
            background: #aaa;
            border-radius: 0.2rem;
            box-shadow:
              inset 0 1px 4px 0 #fff,
              inset 0 -1px 1px 0 rgba(0, 0, 0, 0.6),
              0 0 1px 1px rgba(0, 0, 0, 0.2),
              1px 3px 6px 1px rgba(0, 0, 0, 0.6);
            transition: all 0.4s ease-in-out;
          }

          .toggle span {
            pointer-events: none;
            text-align: center;
            position: absolute;
            left: 0;
            right: 0;
            margin: auto;
            bottom: calc(100% + 0.4rem);
            font-size: 0.6rem;
            font-weight: 100;
            opacity: 0;
            transition: opacity 0.4s ease-in-out;
          }

          .toggle:hover span {
            opacity: 1;
          }

          .toggle:hover .handle {
            transform: translateX(0.2rem);
          }

          .lumen-card.active .toggle .handle {
            transform: translateX(1.58rem);
          }

          .lumen-card.active {
            box-shadow:
              inset 0 1.01rem 0.1rem -1rem rgba(23, 255, 154, 0.6),
              inset 0 -4rem 3rem -3rem rgba(0, 0, 0, 0.6),
              0 -1.02rem 0.2rem -1rem rgba(23, 255, 154, 0.6),
              0 1rem 0.2rem -1rem #000,
              0 0 0 1px rgba(23, 255, 154, 0.15),
              0 4px 4px 0 rgba(0, 0, 0, 0.3),
              0 0 0 1px #333;
          }

          .lumen-card.active .slit {
            background: #17ff9a;
            box-shadow: 0 0 4px 0 #17ff9a;
          }

          .lumen-card.active .lumen {
            opacity: 0.5;
          }

          .lumen-card.active .darken {
            opacity: 0.8;
          }

          .lumen-card.active .darken .sl {
            opacity: 0.2;
          }

          .lumen-card.active .darken .ll {
            opacity: 1;
          }

          .lumen-card.active .darken .slt {
            opacity: 1;
          }

          .lumen-card.active .darken .srt {
            opacity: 1;
          }

          .lumen-card.active .icon {
            filter: drop-shadow(0 -1.2rem 2px rgba(0, 0, 0, 0.2)) brightness(1.64);
          }

          .lumen-card.active .toggle::before {
            background: rgba(23, 255, 154, 0.8);
            box-shadow: 0 0 0.3rem 0.2rem rgba(23, 255, 154, 0.4);
          }

          .lumen-card.active .handle {
            box-shadow:
              inset 0 1px 12px 0 #fff,
              inset 0 -1px 1px 0 rgba(23, 255, 154, 0.6),
              0 0 2px 1px rgba(68, 68, 51, 0.2),
              1px 3px 6px 1px rgba(0, 0, 0, 0.3);
          }
        `}</style>
      </div>
    </div>
  );
};

export default CoreFeatures;
