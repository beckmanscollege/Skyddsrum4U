import { useState, useMemo, useEffect, useRef } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, Line, LineChart, CartesianGrid, ReferenceDot } from 'recharts';
import React from 'react';


declare const Papa: any;

type RegionKey = 'stockholm' | 'sverige' | 'goteborg' | 'malmo';

type KommunData = {
  kommun: string;
  antalSkyddsrum: number;
  antalPlatser: number;
  befolkning: number | null;
  andel: number;
};

type HistoricalPoint = {
  år: number;
  befolkning: number;
  skyddsrum: number;
  täckningsgrad: number;
};

type AppView = 'home' | 'intro' | 'stats';

const REGION_CONFIG: Record<RegionKey, { label: string; csvUrl: string }> = {
  stockholm: {
    label: 'Stockholms län',
    csvUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vScCQX1vKneVlI9hyPK1UU1fFCi-89-Lq8-XxRLUtvaVBbAagwq0q8YonkDxAqZeX_WGJqkW-v28WGu/pub?output=csv',
  },
  sverige: {
    label: 'Sverige',
    csvUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSr8Lg6bCeYrL13voh9SmMuHCkDYQKPwreqoeDnCxDTOV1JIzV79d-rYOSIYbuUYirtAQduao5wzF1g/pub?output=csv',
  },
  goteborg: {
    label: 'Göteborg',
    csvUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSjjFFDLVLwJMYKZ6M9-zVvb3RFIbao9374Ne0YdWKHaDHbb-b0nc-I_9n88WG5Puj1AapQelb9IAVx/pub?output=csv',
  },
  malmo: {
    label: 'Malmö',
    csvUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQASsVNnSZOsd7GL8ssuBx_IL3Sn8Lcnjvtsiw6pRHOfamyrrDRII8XVKyMKRfPsuIZZJPmFNoxdqMU/pub?output=csv',
  },
};

type SortKey = 'kommun' | 'antalSkyddsrum' | 'antalPlatser' | 'andel';

const BIG_CITY_KOMMUNER = new Set(['Stockholm', 'Göteborg', 'Malmö']);
const FONT_HELVETICA = '"Helvetica Neue CE", "Inter", "Helvetica Neue LT Pro", "Helvetica Neue", Helvetica, Arial, sans-serif';
const FONT_MONO = "'Space Mono', monospace";
const ACCENT_BLUE = '#1453c2';
const ACCENT_ORANGE = '#ff7800';
const REGION_BUTTON_LABELS: Record<Exclude<RegionKey, 'sverige'>, string> = {
  stockholm: 'STOCKHOLM',
  goteborg: 'GÖTEBORG',
  malmo: 'MALMÖ',
};

const INTRO_DESCRIPTION_TEXT =
  'Dessa diagram visar hur skyddsrum är fördelade mellan olika kommuner i Sverige, både som antal skyddsrum och som andel av befolkningen. Ovanför ser du en nationell bild för alla kommuner, och under kan du jämföra enskilda län (Stockholm, Göteborg, Malmö) samt följa hur täckningsgraden har förändrats över tid.';
const HOME_HERO_TEXT = `DET HAR INTE BYGGTS NÅGRA NYA
STATLIGA SKYDDSRUM SEDAN
2002. I SVERIGE FINNS DRYGT 64
000 SKYDDSRUM MED PLATS FÖR
UNGEFÄR SJU MILJONER
MÄNNISKOR; DET RÄCKER BARA
TILL 66% AV BEFOLKNINGEN.`;

const STARTPAGE_ASSET_RUN = new URL('../../../SVG ASSETS/new piktogram_Startsida till skyddsrum.svg', import.meta.url).href;
const STARTPAGE_ASSET_EJ_HUND = new URL('../../../SVG ASSETS/piktorgramam-3.1_Ej_hund.svg', import.meta.url).href;
const STARTPAGE_ASSET_ARROW_RIGHT = new URL('../../../SVG ASSETS/new piktogram_Pil höger.svg', import.meta.url).href;
const STARTPAGE_ASSET_ARROW_SECTION = new URL('../../../SVG ASSETS/piktorgramam-3_Pil_hoger.svg', import.meta.url).href;
const STARTPAGE_ASSET_KOMMUNSKOLD = new URL('../../../SVG ASSETS/piktorgramam-3_Startsida-Diagram.svg', import.meta.url).href;
const STARTPAGE_ASSET_HINNER_DU_CARD = new URL('../../../SVG ASSETS/piktorgramam-3.1_Startsida-Hinner_du.svg', import.meta.url).href;
const STARTPAGE_ASSET_SARBARHET_RIGHT = new URL('../../../SVG ASSETS/piktorgramam-3_Sarbarhet-1.svg', import.meta.url).href;
const STARTPAGE_ASSET_TRANGSEL_RIGHT = new URL('../../../SVG ASSETS/piktorgramam-3_Startsida-Trangsel.svg', import.meta.url).href;
const STARTPAGE_ASSET_AVVISNING_RIGHT = new URL('../../../SVG ASSETS/piktorgramam-3_Startsida-Avvisning.svg', import.meta.url).href;
const HOME_HINNER_DU_QUIZ_URL = `${import.meta.env.BASE_URL}skyddsrum-quiz/skyddsrum-quiz.html`;

function CornerFrame({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  // Match the quiz "technical frame" language: longer, darker corner marks.
  const cornerStyle: React.CSSProperties = { borderColor: '#111111' };
  const cornerSize = 45;
  const bw = 1;

  return (
    <div className={`relative ${className}`}>
      <div
        className="pointer-events-none absolute left-0 top-0"
        style={{ width: cornerSize, height: cornerSize, borderLeftWidth: bw, borderTopWidth: bw, ...cornerStyle }}
      />
      <div
        className="pointer-events-none absolute right-0 top-0"
        style={{ width: cornerSize, height: cornerSize, borderRightWidth: bw, borderTopWidth: bw, ...cornerStyle }}
      />
      <div
        className="pointer-events-none absolute left-0 bottom-0"
        style={{ width: cornerSize, height: cornerSize, borderLeftWidth: bw, borderBottomWidth: bw, ...cornerStyle }}
      />
      <div
        className="pointer-events-none absolute right-0 bottom-0"
        style={{ width: cornerSize, height: cornerSize, borderRightWidth: bw, borderBottomWidth: bw, ...cornerStyle }}
      />
      {children}
    </div>
  );
}

function HomeScreen({
  onOpenIntro,
}: {
  onOpenIntro: () => void;
}) {
  const heroColumnRef = useRef<HTMLDivElement>(null);
  const consequenceItemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const farDuPlatsSectionRef = useRef<HTMLDivElement>(null);
  const rotatedArrowSectionRef = useRef<HTMLDivElement>(null);
  const consequenceTimersRef = useRef<number[]>([]);
  const deepDiveSectionRef = useRef<HTMLDivElement>(null);
  const deepDiveTimersRef = useRef<number[]>([]);
  const [heroColumnWidth, setHeroColumnWidth] = useState<number | null>(null);
  const [typedHeroChars, setTypedHeroChars] = useState(0);
  const [showHeroByline, setShowHeroByline] = useState(false);
  const [playFarDuPlatsArrowAnimation, setPlayFarDuPlatsArrowAnimation] = useState(false);
  const [showFarDuPlatsText, setShowFarDuPlatsText] = useState(false);
  const [playRotatedArrowAnimation, setPlayRotatedArrowAnimation] = useState(false);
  const [consequenceStarted, setConsequenceStarted] = useState<boolean[]>([false, false, false, false]);
  const [typedConsequenceChars, setTypedConsequenceChars] = useState<number[]>([0, 0, 0, 0]);
  const [showConsequenceDetails, setShowConsequenceDetails] = useState<boolean[]>([false, false, false, false]);
  const [showConsequenceIcons, setShowConsequenceIcons] = useState<boolean[]>([false, false, false, false]);
  const [playDeepDiveAnimation, setPlayDeepDiveAnimation] = useState(false);
  const [typedDeepDiveChars, setTypedDeepDiveChars] = useState<number[]>([0, 0]);
  const [showDeepDiveRest, setShowDeepDiveRest] = useState(false);
  const handleOpenQuizSite = () => {
    window.location.href = HOME_HINNER_DU_QUIZ_URL;
  };
  const consequenceItems = useMemo(
    () => [
      {
        title: 'SÅRBARHET',
        text: 'Ett skyddsrum är ett förstärkt rum som kan stå emot tryckvåg, splitter, brand, strålning, gas och husras, och kan därmed vara säkrare än andra platser i en krigssituation.',
        icon: STARTPAGE_ASSET_SARBARHET_RIGHT,
      },
      {
        title: 'TRÄNGSEL',
        text: 'Många människor kan komma att samlas vid samma skyddsrum, kanske fler än vad det finns plats för, antingen för att det är det närmaste eller brist på andra alternativ.',
        icon: STARTPAGE_ASSET_TRANGSEL_RIGHT,
      },
      {
        title: 'AVVISNING',
        text: 'Alla har rätt att nyttja närmaste skyddsrum i händelse av krig, men det kan uppstå problem om vissa personer känner sig mer berättigade att vistas i specifika skyddsrum, till exempel i bostadshus.',
        icon: STARTPAGE_ASSET_AVVISNING_RIGHT,
      },
      {
        title: 'HUSDJURSFÖRBUD',
        text: 'Husdjur är inte tillåtna i offentliga skyddsrum på grund av det begränsade utrymmet och ägare kan därför uppmanas att söka annan form av skydd.',
        icon: STARTPAGE_ASSET_EJ_HUND,
      },
    ],
    [],
  );
  const deepDiveTitles = useMemo(() => ['DATA & DIAGRAM', 'HINNER DU?'], []);

  useEffect(() => {
    const updateWidth = () => {
      if (!heroColumnRef.current) return;
      setHeroColumnWidth(heroColumnRef.current.offsetWidth);
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  useEffect(() => {
    setTypedHeroChars(0);
    setShowHeroByline(false);
    const totalChars = HOME_HERO_TEXT.length;
    const typingInterval = window.setInterval(() => {
      setTypedHeroChars(prev => {
        if (prev >= totalChars) {
          window.clearInterval(typingInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 15);
    return () => window.clearInterval(typingInterval);
  }, []);

  useEffect(() => {
    if (typedHeroChars < HOME_HERO_TEXT.length) return;
    const bylineDelay = window.setTimeout(() => {
      setShowHeroByline(true);
    }, 90);
    return () => window.clearTimeout(bylineDelay);
  }, [typedHeroChars]);

  useEffect(() => {
    if (!farDuPlatsSectionRef.current) return;
    let revealTimer: number | null = null;
    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) {
          // Force a visible replay each time section enters view.
          setPlayFarDuPlatsArrowAnimation(false);
          setShowFarDuPlatsText(false);
          requestAnimationFrame(() => {
            setPlayFarDuPlatsArrowAnimation(true);
            revealTimer = window.setTimeout(() => {
              setShowFarDuPlatsText(true);
            }, 560);
          });
          return;
        }
        // Reset when section leaves viewport so animation can replay.
        setPlayFarDuPlatsArrowAnimation(false);
        setShowFarDuPlatsText(false);
      },
      { threshold: 0.6, rootMargin: '0px 0px -10% 0px' },
    );
    observer.observe(farDuPlatsSectionRef.current);
    return () => {
      observer.disconnect();
      if (revealTimer !== null) window.clearTimeout(revealTimer);
    };
  }, []);

  const canShowRotatedArrow = showConsequenceDetails[3];

  useEffect(() => {
    if (!canShowRotatedArrow) {
      setPlayRotatedArrowAnimation(false);
      return;
    }
    if (!rotatedArrowSectionRef.current) return;
    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) {
          setPlayRotatedArrowAnimation(true);
          return;
        }
        // Reset so it can animate again when scrolling back.
        setPlayRotatedArrowAnimation(false);
      },
      { threshold: 0.6, rootMargin: '0px 0px -10% 0px' },
    );
    observer.observe(rotatedArrowSectionRef.current);
    return () => observer.disconnect();
  }, [canShowRotatedArrow]);

  useEffect(() => {
    const startItemAnimation = (itemIndex: number) => {
      if (consequenceStarted[itemIndex]) return;
      setConsequenceStarted(prev => {
        const next = [...prev];
        next[itemIndex] = true;
        return next;
      });
      const title = consequenceItems[itemIndex]?.title ?? '';
      const typeSpeedMs = 44;
      const revealDelayMs = 120;
      for (let charIndex = 1; charIndex <= title.length; charIndex += 1) {
        const timerId = window.setTimeout(() => {
          setTypedConsequenceChars(prev => {
            const next = [...prev];
            next[itemIndex] = charIndex;
            return next;
          });
        }, charIndex * typeSpeedMs);
        consequenceTimersRef.current.push(timerId);
      }
      const revealAt = title.length * typeSpeedMs + revealDelayMs;
      const detailsTimerId = window.setTimeout(() => {
        setShowConsequenceDetails(prev => {
          const next = [...prev];
          next[itemIndex] = true;
          return next;
        });
      }, revealAt);
      consequenceTimersRef.current.push(detailsTimerId);
      const iconTimerId = window.setTimeout(() => {
        setShowConsequenceIcons(prev => {
          const next = [...prev];
          next[itemIndex] = true;
          return next;
        });
      }, revealAt);
      consequenceTimersRef.current.push(iconTimerId);
    };

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const target = entry.target as HTMLDivElement;
          const idx = Number(target.dataset.consequenceIndex);
          if (Number.isNaN(idx)) return;
          startItemAnimation(idx);
        });
      },
      { threshold: 0.35, rootMargin: '0px 0px -10% 0px' },
    );

    consequenceItemRefs.current.forEach(itemEl => {
      if (itemEl) observer.observe(itemEl);
    });

    return () => observer.disconnect();
  }, [consequenceItems, consequenceStarted]);

  useEffect(
    () => () => {
      consequenceTimersRef.current.forEach(id => window.clearTimeout(id));
      consequenceTimersRef.current = [];
    },
    [],
  );

  useEffect(() => {
    if (!deepDiveSectionRef.current) return;
    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) {
          setPlayDeepDiveAnimation(true);
          return;
        }
        setPlayDeepDiveAnimation(false);
      },
      { threshold: 0.5, rootMargin: '0px 0px -8% 0px' },
    );
    observer.observe(deepDiveSectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    deepDiveTimersRef.current.forEach(id => window.clearTimeout(id));
    deepDiveTimersRef.current = [];
    if (!playDeepDiveAnimation) {
      setTypedDeepDiveChars([0, 0]);
      setShowDeepDiveRest(false);
      return;
    }

    setTypedDeepDiveChars([0, 0]);
    setShowDeepDiveRest(false);
    const typeSpeedMs = 44;
    const maxChars = Math.max(deepDiveTitles[0].length, deepDiveTitles[1].length);
    const typingInterval = window.setInterval(() => {
      setTypedDeepDiveChars(prev => {
        const next = [
          Math.min(prev[0] + 1, deepDiveTitles[0].length),
          Math.min(prev[1] + 1, deepDiveTitles[1].length),
        ];
        if (next[0] === deepDiveTitles[0].length && next[1] === deepDiveTitles[1].length) {
          window.clearInterval(typingInterval);
          const revealTimer = window.setTimeout(() => {
            setShowDeepDiveRest(true);
          }, 140);
          deepDiveTimersRef.current.push(revealTimer);
        }
        return next;
      });
    }, typeSpeedMs);
    deepDiveTimersRef.current.push(typingInterval);

    return () => {
      deepDiveTimersRef.current.forEach(id => window.clearTimeout(id));
      deepDiveTimersRef.current = [];
    };
  }, [deepDiveTitles, playDeepDiveAnimation]);

  const typedHeroText = HOME_HERO_TEXT.slice(0, typedHeroChars);

  return (
    <div
      className="relative h-screen w-full overflow-y-auto border border-black bg-[#ff7800] hide-scrollbar"
      style={{ fontFamily: FONT_HELVETICA }}
    >
      <div className="mx-auto w-full max-w-[1420px] px-3 pb-10 pt-16 md:px-8 md:pt-14">
        <div className="flex w-full justify-center">
          <div
            ref={heroColumnRef}
            className="inline-block uppercase"
            style={{
              color: ACCENT_BLUE,
              fontSize: 'clamp(38px, 5.9vw, 86px)',
              fontWeight: 600,
              lineHeight: 1.04,
              letterSpacing: '-0.02em',
              textAlign: 'left',
            }}
          >
            <div className="relative inline-block">
              <div aria-hidden="true" style={{ visibility: 'hidden' }}>
                {HOME_HERO_TEXT.split('\n').map((line, index) => (
                  <span key={`full-${index}`} className="block" style={{ whiteSpace: 'nowrap' }}>
                    {line}
                  </span>
                ))}
              </div>
              <div className="absolute left-0 top-0">
                {typedHeroText.split('\n').map((line, index) => (
                  <span key={`typed-${index}`} className="block" style={{ whiteSpace: 'nowrap' }}>
                    {line}
                  </span>
                ))}
              </div>
            </div>

            <div
              className="mt-2 normal-case"
              style={{
                color: '#000000',
                fontFamily: FONT_MONO,
                fontSize: '12.5px',
                letterSpacing: '-0.02em',
                fontWeight: 400,
                opacity: showHeroByline ? 1 : 0,
                transform: showHeroByline ? 'translateY(0)' : 'translateY(6px)',
                transition: 'opacity 280ms ease, transform 280ms ease',
              }}
            >
              Myndigheten för Civilt försvar (MCF)
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[1320px]">
          <div ref={farDuPlatsSectionRef} className="relative mt-20 flex items-center">
            <div
              className="bg-transparent p-0 text-left uppercase"
              style={{
                border: 'none',
                color: ACCENT_BLUE,
                fontSize: 'clamp(59px, 8.5vw, 122px)',
                fontWeight: 600,
                letterSpacing: '-0.02em',
                lineHeight: 1,
                marginTop: '130px',
                position: 'relative',
                left: 'calc(50% + (min(92%, 1148px) / 2))',
                transform: 'translateX(-100%)',
              }}
            >
              <img
                src={STARTPAGE_ASSET_ARROW_RIGHT}
                alt=""
                style={{
                  width: '640px',
                  position: 'absolute',
                  right: 'calc(100% - 192px)',
                  top: '45%',
                  transform: playFarDuPlatsArrowAnimation ? 'translate(0, -50%)' : 'translate(-140px, -50%)',
                  opacity: playFarDuPlatsArrowAnimation ? 1 : 0.45,
                  transition: 'transform 520ms cubic-bezier(0.22,1,0.36,1), opacity 520ms ease',
                  willChange: 'transform, opacity',
                  pointerEvents: 'none',
                }}
              />
              <span
                style={{
                  opacity: showFarDuPlatsText ? 1 : 0,
                  transform: showFarDuPlatsText ? 'translateY(0)' : 'translateY(8px)',
                  transition: 'opacity 300ms ease, transform 300ms ease',
                }}
              >
                FÅR DU PLATS?
              </span>
            </div>
          </div>

          <div className="relative mt-4 block w-full bg-transparent p-0 text-left" style={{ border: 'none' }}>
            <img
              src={STARTPAGE_ASSET_RUN}
              alt="Får du plats"
              className="h-auto"
              style={{
                width: '92%',
                maxWidth: '1148px',
                marginTop: '-288px',
                position: 'relative',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'block',
              }}
            />
          </div>

          <div
            className="-mt-50 uppercase"
            style={{
              color: '#000000',
              fontSize: 'clamp(40px, 5.4vw, 77px)',
              fontWeight: 600,
              letterSpacing: '-0.02em',
              lineHeight: 1.05,
              width: heroColumnWidth ? `${heroColumnWidth}px` : undefined,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            KONSEKVENSER AV FÖR FÅ SKYDDSRUM KAN VARA:
          </div>

          <div className="mt-24 flex flex-col gap-32">
            {consequenceItems.map((item, index) => {
              const isSarbarhet = item.title === 'SÅRBARHET';
              const isTrangsel = item.title === 'TRÄNGSEL';
              const isAvvisning = item.title === 'AVVISNING';
              const isHusdjur = item.title === 'HUSDJURSFÖRBUD';
              const isTrangselOrHusdjur = isTrangsel || isHusdjur;
              const isSarbarhetStyle = isSarbarhet || isAvvisning;
              const isIconLeft = isSarbarhetStyle ? false : isTrangsel || isHusdjur ? true : index % 2 === 0;
              const textMaxWidth = isIconLeft ? '816px' : '734px';
              return (
              <div
                key={item.title}
                ref={(el) => {
                  consequenceItemRefs.current[index] = el;
                }}
                data-consequence-index={index}
                className={`grid items-start gap-8 ${isIconLeft ? 'md:grid-cols-[360px_1fr]' : 'md:grid-cols-[1fr_360px]'}`}
                style={
                  isSarbarhetStyle
                    ? {
                        width: heroColumnWidth ? `${heroColumnWidth}px` : undefined,
                        marginLeft: 'auto',
                        marginRight: 'auto',
                      }
                    : undefined
                }
              >
                {isIconLeft && (
                  <img
                    src={item.icon}
                    alt=""
                    className="h-[240px] w-[240px] object-contain md:h-[360px] md:w-[360px]"
                    style={
                      {
                        ...(isTrangselOrHusdjur
                          ? {
                              transform: 'translateX(-28px) translateY(-36px) scale(1.55)',
                              transformOrigin: 'center',
                            }
                          : {}),
                        opacity: showConsequenceIcons[index] ? 1 : 0,
                        transition: 'opacity 320ms ease',
                      }
                    }
                  />
                )}

                <div
                  style={{
                    ...(isSarbarhetStyle ? { width: 'min(816px, 100%)' } : {}),
                    ...(isTrangselOrHusdjur ? { marginLeft: '120px' } : {}),
                  }}
                >
                  <div
                    className="uppercase"
                    style={{ color: ACCENT_BLUE, fontSize: 'clamp(36px, 4.6vw, 64px)', fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1, minHeight: '1em' }}
                  >
                    {item.title.slice(0, typedConsequenceChars[index])}
                  </div>
                  <div
                    className="mt-5"
                    style={{
                      color: '#000000',
                      fontSize: 'clamp(20px, 2.6vw, 36px)',
                      fontWeight: 600,
                      letterSpacing: '-0.02em',
                      lineHeight: 1.18,
                      maxWidth: textMaxWidth,
                      opacity: showConsequenceDetails[index] ? 1 : 0,
                      transform: showConsequenceDetails[index] ? 'translateY(0)' : 'translateY(8px)',
                      transition: 'opacity 320ms ease, transform 320ms ease',
                    }}
                  >
                    {item.text}
                  </div>
                </div>

                {!isIconLeft && (
                  <img
                    src={item.icon}
                    alt=""
                    className="h-[240px] w-[240px] object-contain md:h-[360px] md:w-[360px]"
                    style={
                      {
                        ...(isSarbarhetStyle
                          ? {
                              marginTop: '-32px',
                              transform: 'translateX(-140px) translateY(-8px) scale(1.55)',
                              transformOrigin: 'center',
                            }
                          : {}),
                        opacity: showConsequenceIcons[index] ? 1 : 0,
                        transition: 'opacity 320ms ease',
                      }
                    }
                  />
                )}
              </div>
            )})}
          </div>

          <div ref={rotatedArrowSectionRef} className="mt-0 flex justify-center">
            <img
              src={STARTPAGE_ASSET_ARROW_SECTION}
              alt=""
              style={{
                width: '525px',
                height: '525px',
                transform: !canShowRotatedArrow
                  ? 'translateY(-150px) rotate(90deg)'
                  : playRotatedArrowAnimation
                    ? 'translateY(0) rotate(90deg)'
                    : 'translateY(-120px) rotate(90deg)',
                opacity: !canShowRotatedArrow ? 0 : playRotatedArrowAnimation ? 1 : 0.35,
                transition: 'transform 640ms cubic-bezier(0.22,1,0.36,1), opacity 640ms ease',
                willChange: 'transform, opacity',
              }}
            />
          </div>

          <div
            className="mt-16 uppercase"
            style={{ color: '#000000', fontSize: 'clamp(40px, 5.4vw, 77px)', fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.05 }}
          >
            FÖRDJUPA DIG INOM SKYDDSRUMSSTATISTIK:
          </div>

          <div ref={deepDiveSectionRef} className="mt-14 grid gap-8 md:grid-cols-2">
            <div className="flex flex-col items-start text-left">
              <button
                onClick={onOpenIntro}
                className="inline-flex items-center justify-center bg-transparent p-0"
                style={{
                  border: 'none',
                  lineHeight: 0,
                  opacity: showDeepDiveRest ? 1 : 0,
                  transition: 'opacity 320ms ease',
                }}
              >
                <img
                  src={STARTPAGE_ASSET_KOMMUNSKOLD}
                  alt=""
                  className="h-[560px] w-[560px] object-contain transition-transform duration-200 ease-out hover:scale-[1.03]"
                  style={{ transformOrigin: 'center center' }}
                />
              </button>
              <div className="uppercase" style={{ marginTop: '-88px', marginLeft: '120px', color: ACCENT_BLUE, fontSize: 'clamp(20px, 2.5vw, 34px)', fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1, minHeight: '1em' }}>
                {deepDiveTitles[0].slice(0, typedDeepDiveChars[0])}
              </div>
              <div
                style={{
                  marginTop: '8px',
                  marginBottom: '90px',
                  marginLeft: '120px',
                  color: '#000000',
                  fontSize: 'clamp(14px, 1.6vw, 22px)',
                  fontWeight: 600,
                  letterSpacing: '-0.02em',
                  opacity: showDeepDiveRest ? 1 : 0,
                  transform: showDeepDiveRest ? 'translateY(0)' : 'translateY(8px)',
                  transition: 'opacity 320ms ease, transform 320ms ease',
                }}
              >
                Jämför kapaciteten i Sverige.
              </div>
            </div>

            <div className="flex flex-col items-start text-left">
              <button
                onClick={handleOpenQuizSite}
                className="inline-flex items-center justify-center bg-transparent p-0"
                style={{
                  border: 'none',
                  lineHeight: 0,
                  opacity: showDeepDiveRest ? 1 : 0,
                  transition: 'opacity 320ms ease',
                }}
              >
                <img
                  src={STARTPAGE_ASSET_HINNER_DU_CARD}
                  alt=""
                  className="h-[560px] w-[560px] object-contain transition-transform duration-200 ease-out hover:scale-[1.03]"
                  style={{ transformOrigin: 'center center' }}
                />
              </button>
              <div className="uppercase" style={{ marginTop: '-88px', marginLeft: '120px', color: ACCENT_BLUE, fontSize: 'clamp(20px, 2.5vw, 34px)', fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1, minHeight: '1em' }}>
                {deepDiveTitles[1].slice(0, typedDeepDiveChars[1])}
              </div>
              <div
                style={{
                  marginTop: '8px',
                  marginBottom: '22px',
                  marginLeft: '120px',
                  color: '#000000',
                  fontSize: 'clamp(14px, 1.6vw, 22px)',
                  fontWeight: 600,
                  letterSpacing: '-0.02em',
                  opacity: showDeepDiveRest ? 1 : 0,
                  transform: showDeepDiveRest ? 'translateY(0)' : 'translateY(8px)',
                  transition: 'opacity 320ms ease 40ms, transform 320ms ease 40ms',
                }}
              >
                Testa din sannolikhet till skydd.
              </div>
            </div>
          </div>

          <div className="mt-8" style={{ color: '#000000', fontFamily: FONT_MONO, fontSize: '12.5px', letterSpacing: '-0.02em' }}>
            Hemsida av Vivi Tang &amp; Ve Örnehed (VK27) i kursen Interaktiv Design II ledd av Peter Ström på Beckmans
            Designhögskola i samverkan med Reform Society 2026 © All rights reserved
          </div>
        </div>
      </div>
    </div>
  );
}

function IntroScreen({ onStart, onHome }: { onStart: () => void; onHome: () => void }) {
  const [showArrow, setShowArrow] = useState(false);
  const [showTriangles, setShowTriangles] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setShowArrow(true);
      setShowTriangles(true);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className="relative h-screen w-full overflow-hidden border border-black bg-[#ff7800]"
      style={{ fontFamily: FONT_HELVETICA, userSelect: 'none', cursor: 'default' }}
    >
      {/* Top-right home icon (same size as quiz intro) */}
      <div
        className="group absolute z-[3] flex flex-row-reverse items-center gap-[10px]"
        style={{ top: '-1px', right: '-1px', left: 'auto', cursor: 'pointer' }}
        aria-label="Hem"
        onClick={onHome}
      >
        <img
          src={`${import.meta.env.BASE_URL}skyddsrum-data/piktorgrawwadmam.svg`}
          alt="Hem"
          style={{ width: '72px', height: '72px', transition: 'transform 0.22s ease', transformOrigin: 'center' }}
          className="group-hover:scale-110"
        />
        <span
          style={{
            fontFamily: FONT_HELVETICA,
            fontSize: '20px',
            fontWeight: 500,
            letterSpacing: '0.02em',
            color: '#111111',
            background: 'rgba(255,255,255,0.88)',
            border: '1px solid #111111',
            padding: '3px 9px',
            display: 'inline-block',
            whiteSpace: 'nowrap',
            opacity: 0,
            transform: 'translateX(10px)',
            transition: 'opacity 0.2s ease, transform 0.2s ease',
            pointerEvents: 'none',
          }}
          className="group-hover:opacity-100 group-hover:translate-x-0"
        >
          HEM
        </span>
      </div>

      {/* Background blue triangles */}
      <div
        className="absolute -left-[220px] top-[40px] h-0 w-0"
        style={{
          borderLeft: '480px solid transparent',
          borderRight: '480px solid transparent',
          borderBottom: '820px solid #1453c2',
          transform: showTriangles ? 'translateY(0)' : 'translateY(36px)',
          transition: 'transform 1100ms cubic-bezier(0.22,1,0.36,1)',
        }}
      />
      <div
        className="absolute -right-[360px] -top-[320px] h-0 w-0"
        style={{
          borderLeft: '520px solid transparent',
          borderRight: '520px solid transparent',
          borderBottom: '920px solid #1453c2',
          transform: showTriangles ? 'translateY(0)' : 'translateY(-36px)',
          transition: 'transform 1100ms cubic-bezier(0.22,1,0.36,1)',
        }}
      />

      {/* Title box (same visual style as quiz intro) */}
      <div
        className="absolute z-10 border-[7px] border-black bg-white"
        style={{
          top: '8%',
          left: '39%',
          right: '2%',
          transform: 'translateX(0.7vw)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '170px',
          padding: '0 28px',
          textAlign: 'center',
        }}
      >
        <h1
          className="text-black"
          style={{
            fontFamily: FONT_HELVETICA,
            fontSize: '5.2vw',
            lineHeight: 1.15,
            fontWeight: 500,
            maxWidth: '95%',
            margin: '0 auto',
            textAlign: 'left',
            transform: 'translateY(10px)',
          }}
        >
          SKYDDSRUMSDATA
        </h1>
      </div>

      {/* Enter arrow (copied style + slide-in animation from quiz intro) */}
      <img
        src={`${import.meta.env.BASE_URL}skyddsrum-data/intro-arrow.svg`}
        alt="Visa statistik"
        onClick={onStart}
        className="absolute z-20 h-auto cursor-pointer transition-opacity duration-200 hover:opacity-75"
        style={{
          left: '60%',
          bottom: '-40%',
          width: '60%',
          transform: showArrow ? 'translateX(0)' : 'translateX(-80px)',
          opacity: showArrow ? 1 : 0,
          transitionProperty: 'transform, opacity',
          transitionDuration: '1000ms',
          transitionTimingFunction: 'cubic-bezier(0.22,1,0.36,1)',
          transitionDelay: '200ms',
        }}
      />
    </div>
  );
}

const buildXTicks = (max: number): number[] => {
  const step = 20000;
  const ticks: number[] = [];
  for (let v = 0; v <= max; v += step) {
    ticks.push(v);
  }
  return ticks;
};

export function StatisticsSection() {
  const [view, setView] = useState<AppView>('home');
  const [secondaryRegion, setSecondaryRegion] = useState<Exclude<RegionKey, 'sverige'>>('stockholm');
  const [regionData, setRegionData] = useState<Record<RegionKey, KommunData[]>>({
    stockholm: [],
    sverige: [],
    goteborg: [],
    malmo: [],
  });
  const [historicalData, setHistoricalData] = useState<HistoricalPoint[]>([]);
  const [selectedKommunSverige, setSelectedKommunSverige] = useState<string | null>(null);
  const [selectedKommunSecondary, setSelectedKommunSecondary] = useState<string | null>(null);
  const [hoveredKommunSverige, setHoveredKommunSverige] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('andel');
  const [sortAsc, setSortAsc] = useState(false);
  const [historyAnimationKey, setHistoryAnimationKey] = useState(0);
  const [historyTriangleProgress, setHistoryTriangleProgress] = useState<number[]>([]);
  const [dotsAnimationProgress, setDotsAnimationProgress] = useState(0);
  const [dotsAnimationTrigger, setDotsAnimationTrigger] = useState(0);
  const [sverigeTriangleProgress, setSverigeTriangleProgress] = useState<number[]>([]);
  const historicalRef = useRef<HTMLDivElement>(null);
  const historyInViewRef = useRef(false);
  const dotsInViewRef = useRef(false);
  const hasMountedRegionChangeRef = useRef(false);
  const historyTrianglesRafRef = useRef<number | null>(null);
  const historyDotsTimeoutRef = useRef<number | null>(null);
  const hasAnimatedSverigeScatter = useRef(false);
  const [isLoadingRegion, setIsLoadingRegion] = useState(false);
  const [regionError, setRegionError] = useState<string | null>(null);
  const secondarySectionRef = useRef<HTMLDivElement>(null);

  const currentRegionLabel = REGION_CONFIG.sverige.label;
  const canStartChartAnimations = view === 'stats';

  useEffect(() => {
    const currentState = window.history.state ?? {};
    const rawView = currentState?.skyddsrumView as AppView | undefined;
    const currentView: AppView = rawView === 'stats' || rawView === 'intro' || rawView === 'home' ? rawView : 'home';
    setView(currentView);
    if (rawView !== currentView) {
      window.history.replaceState({ ...currentState, skyddsrumView: currentView }, '');
    }

    const onPopState = (event: PopStateEvent) => {
      const raw = event.state?.skyddsrumView as AppView | undefined;
      const next: AppView = raw === 'stats' || raw === 'intro' || raw === 'home' ? raw : 'home';
      setView(next);
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    document.title = view === 'stats' ? 'Får du plats i ett Skyddsrum?' : 'Skyddsrum 4 U';
  }, [view]);

  const navigateToView = (nextView: AppView, mode: 'push' | 'replace' = 'push') => {
    setView(nextView);
    const currentState = window.history.state ?? {};
    const currentView = currentState?.skyddsrumView as AppView | undefined;
    if (currentView !== nextView) {
      if (mode === 'replace') {
        window.history.replaceState({ ...currentState, skyddsrumView: nextView }, '');
      } else {
        window.history.pushState({ ...currentState, skyddsrumView: nextView }, '');
      }
    }
  };

  const handleStartFromIntro = () => navigateToView('stats');
  const handleOpenIntroFromHome = () => navigateToView('intro');
  const handleGoHome = () => navigateToView('home');

  // Parse kommun data from Google Sheets CSV
  const loadRegionData = (key: RegionKey, options?: { silent?: boolean }) => {
    const silent = options?.silent === true;
    const cfg = REGION_CONFIG[key];
    if (!silent) {
      setIsLoadingRegion(true);
      setRegionError(null);
    }

    if (typeof Papa === 'undefined') {
      if (!silent) {
        setRegionError('CSV-biblioteket laddas inte. Försök ladda om sidan.');
        setIsLoadingRegion(false);
      }
      return;
    }
    Papa.parse(cfg.csvUrl, {
      download: true,
      skipEmptyLines: true,
      complete: (results: any) => {
        try {
          const rows: any[][] = results.data || [];
          const parsed: KommunData[] = [];

          const normalizeHeader = (raw: string) =>
            raw
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/\s+/g, '')
              .replace(/[^a-z0-9]/g, '');

          const headers = (rows[1] || []).map((h) => normalizeHeader(String(h ?? '')));
          const findHeaderIndex = (candidates: string[]) =>
            headers.findIndex((h) => candidates.some((c) => h.includes(c)));

          const idxKommun = findHeaderIndex(['kommun']);
          const idxSkyddsrum = findHeaderIndex(['antalskyddsrum', 'skyddsrum']);
          const idxPlatser = findHeaderIndex(['antalplatser', 'skyddsrumsplats', 'platser']);
          // Important: avoid matching "andel av befolkningen..." by excluding headers
          // that also look like percentage/place columns.
          const idxBefolkning = headers.findIndex(
            (h) =>
              (h.includes('befolkning') || h.includes('invanare') || h.includes('personer') || h.includes('population')) &&
              !h.includes('andel') &&
              !h.includes('procent') &&
              !h.includes('plats')
          );
          const idxAndel = findHeaderIndex(['andel', 'tackningsgrad', 'procent']);

          const colKommun = idxKommun >= 0 ? idxKommun : 0;
          const colSkyddsrum = idxSkyddsrum >= 0 ? idxSkyddsrum : 1;
          const colPlatser = idxPlatser >= 0 ? idxPlatser : 2;
          const colBefolkning = idxBefolkning >= 0 ? idxBefolkning : 3;
          const colAndel = idxAndel >= 0 ? idxAndel : 4;

          for (let i = 2; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length < 2) continue;
            const kommun = String(row[colKommun] ?? '').trim();
            if (!kommun) continue;

            const rawSkyddsrum = String(row[colSkyddsrum] ?? '');
            const rawPlatser = String(row[colPlatser] ?? '');
            const rawBefolkning = String(row[colBefolkning] ?? '');
            const rawAndel = String(row[colAndel] ?? '');

            const parseNumberLike = (raw: string): number => {
              const cleaned = raw
                .replace(/\s/g, '')
                .replace('%', '')
                .replace(',', '.')
                .replace(/[^0-9.\-]/g, '');
              const n = Number(cleaned);
              return Number.isFinite(n) ? n : NaN;
            };

            const nSkyddsrum = parseNumberLike(rawSkyddsrum);
            const nPlatser = parseNumberLike(rawPlatser);
            const nBefolkning = parseNumberLike(rawBefolkning);
            const nAndel = parseNumberLike(rawAndel);

            if (!Number.isFinite(nSkyddsrum)) continue;

            const antalSkyddsrum = nSkyddsrum;
            const antalPlatser = Number.isFinite(nPlatser) ? nPlatser : nSkyddsrum;
            const befolkning = Number.isFinite(nBefolkning) ? nBefolkning : null;
            const andel =
              Number.isFinite(nAndel)
                ? nAndel
                : befolkning && befolkning > 0
                  ? (antalPlatser / befolkning) * 100
                  : NaN;

            if (!Number.isFinite(andel)) continue;

            parsed.push({ kommun, antalSkyddsrum, antalPlatser, befolkning, andel });
          }

          setRegionData(prev => ({ ...prev, [key]: parsed }));
        } catch (e: any) {
          if (!silent) {
            setRegionError('Kunde inte tolka CSV-datat för ' + cfg.label);
          }
        } finally {
          if (!silent) {
            setIsLoadingRegion(false);
          }
        }
      },
      error: (err: any) => {
        if (!silent) {
          setRegionError('Fel vid hämtning av data: ' + (err?.message || String(err)));
          setIsLoadingRegion(false);
        }
      },
    });
  };

  // Parse historical CSV from local file
  useEffect(() => {
    const url =
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vS1eiM20oa912DKzBduprT0NFFSfs3oya_Gq9EfbpH3bHwKPXn_smuCe49EUzpJ1e9hLvnFlmSyx5K5/pub?output=csv';

    const parseNumberLike = (raw: string): number => {
      if (!raw) return NaN;

      const normalize = (s: string): number => {
        const cleaned = s
          .replace(/\s/g, '')
          .replace('milj', '')
          .replace('<', '')
          .replace('ca', '')
          .replace('%', '')
          .replace(',', '.')
          .replace(/[^0-9.]/g, '');
        const n = Number(cleaned);
        return Number.isFinite(n) ? n : NaN;
      };

      // Handle ranges like "15 000-20 000" or "21-29%"
      const rangeMatch = raw.match(/(\d[\d\s.,]*)\s*-\s*(\d[\d\s.,]*)/);
      if (rangeMatch) {
        const a = normalize(rangeMatch[1]);
        const b = normalize(rangeMatch[2]);
        if (Number.isFinite(a) && Number.isFinite(b)) {
          return (a + b) / 2;
        }
        if (Number.isFinite(a)) return a;
        if (Number.isFinite(b)) return b;
      }

      // Fallback: single value
      return normalize(raw);
    };

    Papa.parse(url, {
      download: true,
      skipEmptyLines: true,
      complete: (results: any) => {
        const rows: any[][] = results.data || [];
        const points: HistoricalPoint[] = [];

        // Expect header row: år, befolkning, uppskattade skyddsrum, uppskattad täcknigsgrad
        // Then each following row is one year.
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length < 4) continue;

          const yearStr = String(row[0] ?? '').trim();
          const befolkningStr = String(row[1] ?? '').trim();
          const skyddsrumStr = String(row[2] ?? '').trim();
          const täckningStr = String(row[3] ?? '').trim();

          const år = Number(yearStr);
          if (!Number.isFinite(år)) continue;

          const befolkning = parseNumberLike(befolkningStr);
          const skyddsrum = parseNumberLike(skyddsrumStr);
          const täckningsgrad = parseNumberLike(täckningStr);

          // Skip rows where we can't parse coverage
          if (!Number.isFinite(täckningsgrad)) continue;

          points.push({ år, befolkning, skyddsrum, täckningsgrad });
        }

        setHistoricalData(points);
      },
      error: (err: any) => {
        console.error('Fel vid hämtning av historikdata:', err);
      },
    });
  }, []);

  // Load initial region data
  useEffect(() => {
    if (!regionData.sverige || regionData.sverige.length === 0) {
      loadRegionData('sverige');
    }
  }, [regionData]);

  useEffect(() => {
    if (!regionData[secondaryRegion] || regionData[secondaryRegion].length === 0) {
      loadRegionData(secondaryRegion);
    }
  }, [secondaryRegion, regionData]);

  // Prefetch all secondary regions so switches feel instant.
  useEffect(() => {
    (['stockholm', 'goteborg', 'malmo'] as Exclude<RegionKey, 'sverige'>[]).forEach((key) => {
      if (!regionData[key] || regionData[key].length === 0) {
        loadRegionData(key, { silent: true });
      }
    });
  }, [regionData.stockholm.length, regionData.goteborg.length, regionData.malmo.length]);

  const sverigeData = regionData.sverige || [];
  const secondaryBaseData = regionData[secondaryRegion] || [];

  // Do not preselect any kommun on load; selection happens on hover or search

  const sverigeMaxSkyddsrum = useMemo(() => {
    if (!sverigeData.length) return 0;
    const maxVal = Math.max(...sverigeData.map(d => d.antalSkyddsrum));
    const step = 5000;
    return Math.ceil(maxVal / step) * step;
  }, [sverigeData]);

  const sverigeXAxisMax = useMemo(() => (sverigeMaxSkyddsrum > 0 ? sverigeMaxSkyddsrum : 10000), [sverigeMaxSkyddsrum]);

  const sverigeXTicks = useMemo(() => buildXTicks(sverigeXAxisMax), [sverigeXAxisMax]);

  const sverigeFilteredData = useMemo(() => {
    let result = [...sverigeData];
    result.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortAsc ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
    return result;
  }, [sverigeData, sortKey, sortAsc]);

  const secondaryFilteredData = useMemo(() => {
    // Always include the main city in its own region (Stockholm in Stockholm, Göteborg in Göteborg, Malmö in Malmö).
    // Filter out other big cities to keep region plots comparable.
    const mainCity = secondaryRegion === 'stockholm' ? 'Stockholm' : secondaryRegion === 'goteborg' ? 'Göteborg' : 'Malmö';
    const base = secondaryBaseData.filter(d => {
      if (BIG_CITY_KOMMUNER.has(d.kommun)) return d.kommun === mainCity;
      return true;
    });
    const result = [...base];

    result.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortAsc ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
    return result;
  }, [secondaryBaseData, secondaryRegion, sortKey, sortAsc]);

  // Retrigger history line animation when chart enters viewport.
  useEffect(() => {
    if (!canStartChartAnimations) return;

    const runHistoryAnimations = () => {
      setHistoryAnimationKey((v) => v + 1);
      if (historyTrianglesRafRef.current !== null) {
        cancelAnimationFrame(historyTrianglesRafRef.current);
      }
      if (historyDotsTimeoutRef.current !== null) {
        clearTimeout(historyDotsTimeoutRef.current);
      }

      const count = historicalData.length;
      if (!count) return;
      setHistoryTriangleProgress(new Array(count).fill(0));

      // Start triangle stagger shortly after line starts drawing.
      historyDotsTimeoutRef.current = window.setTimeout(() => {
        let start: number | null = null;
        const staggerMs = 38;
        const perTriangleMs = 280;
        const animateTriangles = (timestamp: number) => {
          if (!start) start = timestamp;
          const elapsed = timestamp - start;
          const next = new Array(count).fill(0).map((_, i) => {
            const local = (elapsed - i * staggerMs) / perTriangleMs;
            return Math.max(0, Math.min(1, local));
          });
          setHistoryTriangleProgress(next);
          const done = next.every((p) => p >= 1);
          if (!done) {
            historyTrianglesRafRef.current = requestAnimationFrame(animateTriangles);
          } else {
            historyTrianglesRafRef.current = null;
          }
        };
        historyTrianglesRafRef.current = requestAnimationFrame(animateTriangles);
        historyDotsTimeoutRef.current = null;
      }, 520);
    };

    const checkHistoryInView = () => {
      if (!historicalRef.current) return;
      const rect = historicalRef.current.getBoundingClientRect();
      const inViewNow = rect.top < window.innerHeight * 0.8 && rect.bottom > window.innerHeight * 0.2;
      if (inViewNow && !historyInViewRef.current) {
        historyInViewRef.current = true;
        runHistoryAnimations();
      } else if (!inViewNow && historyInViewRef.current) {
        historyInViewRef.current = false;
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !historyInViewRef.current) {
            historyInViewRef.current = true;
            runHistoryAnimations();
          } else if (!entry.isIntersecting && historyInViewRef.current) {
            historyInViewRef.current = false;
          }
        });
      },
      { threshold: 0.22 }
    );

    if (historicalRef.current) {
      observer.observe(historicalRef.current);
    }

    // Start history animation as soon as intro typewriter is done.
    if (!historyInViewRef.current) {
      historyInViewRef.current = true;
      runHistoryAnimations();
    }

    const onScroll = () => checkHistoryInView();
    const onResize = () => checkHistoryInView();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    checkHistoryInView();

    return () => {
      if (historyTrianglesRafRef.current !== null) {
        cancelAnimationFrame(historyTrianglesRafRef.current);
      }
      if (historyDotsTimeoutRef.current !== null) {
        clearTimeout(historyDotsTimeoutRef.current);
      }
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (historicalRef.current) {
        observer.unobserve(historicalRef.current);
      }
    };
  }, [historicalData, canStartChartAnimations]);

  // Animate Sverige scatter triangles on first load with random stagger.
  useEffect(() => {
    if (!canStartChartAnimations) return;
    if (!sverigeFilteredData.length || hasAnimatedSverigeScatter.current) return;
    hasAnimatedSverigeScatter.current = true;

    const count = sverigeFilteredData.length;
    setSverigeTriangleProgress(new Array(count).fill(0));

    const timeoutIds: number[] = [];
    const duration = 480;

    sverigeFilteredData.forEach((item, index) => {
      // Deterministic "random" delay based on kommun name for consistent re-renders.
      const seed = item.kommun.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
      const delay = 80 + (seed % 1200);

      const timeoutId = window.setTimeout(() => {
        let start: number | null = null;

        const animateOne = (timestamp: number) => {
          if (!start) start = timestamp;
          const progress = Math.min((timestamp - start) / duration, 1);

          setSverigeTriangleProgress((prev) => {
            const next = [...prev];
            next[index] = progress;
            return next;
          });

          if (progress < 1) {
            requestAnimationFrame(animateOne);
          }
        };

        requestAnimationFrame(animateOne);
      }, delay);

      timeoutIds.push(timeoutId);
    });

    return () => {
      timeoutIds.forEach((id) => window.clearTimeout(id));
    };
  }, [sverigeFilteredData.length, canStartChartAnimations]);

  // Animate dots only when explicitly triggered (region switch or entering viewport)
  useEffect(() => {
    if (!canStartChartAnimations) return;
    setDotsAnimationProgress(0.12);
    let start: number | null = null;
    const duration = 360; // snappier region transitions

    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const t = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDotsAnimationProgress(0.12 + eased * 0.88);
      
      if (t < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [dotsAnimationTrigger, canStartChartAnimations]);

  // Trigger dots animation when region changes.
  useEffect(() => {
    if (!canStartChartAnimations) return;
    if (!hasMountedRegionChangeRef.current) {
      hasMountedRegionChangeRef.current = true;
      return;
    }
    // Only animate immediately on region switch if the dots section is visible.
    if (!dotsInViewRef.current) return;
    setDotsAnimationTrigger((v) => v + 1);
  }, [secondaryRegion, canStartChartAnimations]);

  // Start dots animation right after intro typewriter completes.
  useEffect(() => {
    if (!canStartChartAnimations) return;
    setDotsAnimationTrigger((v) => v + 1);
  }, [canStartChartAnimations]);

  // Trigger dots animation when section scrolls into view.
  useEffect(() => {
    if (!canStartChartAnimations) return;
    const target = secondarySectionRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !dotsInViewRef.current) {
            dotsInViewRef.current = true;
            setDotsAnimationTrigger((v) => v + 1);
          } else if (!entry.isIntersecting && dotsInViewRef.current) {
            dotsInViewRef.current = false;
          }
        });
      },
      { threshold: 0.22 }
    );

    observer.observe(target);
    const rect = target.getBoundingClientRect();
    const inViewNow = rect.top < window.innerHeight * 0.8 && rect.bottom > window.innerHeight * 0.2;
    if (inViewNow && !dotsInViewRef.current) {
      dotsInViewRef.current = true;
      setDotsAnimationTrigger((v) => v + 1);
    }
    return () => observer.disconnect();
  }, [canStartChartAnimations]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const handleSearchKommunSverige = (event: React.FormEvent) => {
    event.preventDefault();
    const raw = searchQuery.trim();
    const query = raw.toLowerCase();

    const normalizeRegionQuery = (q: string) =>
      q
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '')
        .replace(/[^a-z]/g, '');

    const qNorm = normalizeRegionQuery(query);
    const regionMatch: Exclude<RegionKey, 'sverige'> | null =
      qNorm === 'stockholm'
        ? 'stockholm'
        : qNorm === 'goteborg' || qNorm === 'gothenburg'
          ? 'goteborg'
          : qNorm === 'malmo'
            ? 'malmo'
            : null;

    if (!query) {
      setSearchError(null);
      setSelectedKommunSverige(null);
      return;
    }

    const exactMatch = sverigeData.find(d => d.kommun.toLowerCase() === query);
    const partialMatch = sverigeData.find(d => d.kommun.toLowerCase().includes(query));
    const found = exactMatch || partialMatch || null;

    if (found || regionMatch) {
      setSelectedKommunSverige(found ? found.kommun : null);
      setSearchError(null);
    } else {
      setSearchError('Hittade ingen kommun med det namnet.');
    }

    // If user searched for Stockholm/Göteborg/Malmö, switch the region view and scroll down.
    if (regionMatch) {
      setSecondaryRegion(regionMatch);
      setSelectedKommunSecondary(regionMatch === 'stockholm' ? 'Stockholm' : regionMatch === 'goteborg' ? 'Göteborg' : 'Malmö');
      requestAnimationFrame(() => {
        secondarySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  };

  if (view === 'home') {
    return <HomeScreen onOpenIntro={handleOpenIntroFromHome} />;
  }

  if (view === 'intro') {
    return <IntroScreen onStart={handleStartFromIntro} onHome={handleGoHome} />;
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_HELVETICA }}>
      <div
        className="group fixed z-20 flex flex-row-reverse items-center gap-[10px]"
        style={{ top: '-1px', right: '-1px', left: 'auto', cursor: 'pointer' }}
        aria-label="Hem"
        onClick={handleGoHome}
      >
        <img
          src={`${import.meta.env.BASE_URL}skyddsrum-data/piktorgrawwadmam.svg`}
          alt="Hem"
          style={{ width: '72px', height: '72px', transition: 'transform 0.22s ease', transformOrigin: 'center' }}
          className="group-hover:scale-110"
        />
        <span
          style={{
            fontFamily: FONT_HELVETICA,
            fontSize: '20px',
            fontWeight: 500,
            letterSpacing: '0.02em',
            color: '#111111',
            background: 'rgba(255,255,255,0.88)',
            border: '1px solid #111111',
            padding: '3px 9px',
            display: 'inline-block',
            whiteSpace: 'nowrap',
            opacity: 0,
            transform: 'translateX(10px)',
            transition: 'opacity 0.2s ease, transform 0.2s ease',
            pointerEvents: 'none',
          }}
          className="group-hover:opacity-100 group-hover:translate-x-0"
        >
          HEM
        </span>
      </div>
      <div className="mx-auto w-full max-w-[1680px] px-6 py-10 md:px-16 md:py-14">
      {/* Intro text */}
      <div className="mt-10 mb-16 max-w-[980px] text-[18px] md:text-[19px] leading-[1.35] uppercase" style={{ color: ACCENT_BLUE, fontFamily: FONT_HELVETICA, fontWeight: 700 }}>
        {INTRO_DESCRIPTION_TEXT}
      </div>

      {/* Visualization */}
      <div className="mb-12 flex flex-col gap-10">
        
        {/* Top section: Kommune data - full width */}
        <div className="flex flex-col">

          {isLoadingRegion && (
            <div className="mb-4 text-xs" style={{ color: '#000000', fontFamily: FONT_MONO }}>
              Laddar data...
            </div>
          )}
          {regionError && (
            <div className="mb-4 text-xs text-red-700" style={{ fontFamily: FONT_MONO }}>
              {regionError}
            </div>
          )}
          {/* Sverige scatter only (no dots view) */}
          <CornerFrame className="p-6 md:p-10">
            <div className="mb-8 flex flex-col gap-3">
              <div
                className="uppercase tracking-[0.04em]"
                style={{ color: ACCENT_BLUE, fontFamily: FONT_HELVETICA, fontSize: 'clamp(22px, 2.8vw, 44px)', lineHeight: 1.05, fontWeight: 500 }}
              >
                SVERIGES KOMMUNER
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="max-w-[620px] text-[12px] leading-[1.45]" style={{ color: '#000000', fontFamily: FONT_MONO }}>
                  Visar alla kommuner i Sverige med antal skyddsrum på x-axeln och uppskattad täckningsgrad av befolkningen på y-axeln.
                </div>

                <div className="w-full md:w-auto md:flex-shrink-0">
                <form onSubmit={handleSearchKommunSverige} className="flex items-center justify-end gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Sök kommun..."
                    className="w-[220px] md:w-[260px] border px-3 py-[10px] text-[12px] leading-none outline-none"
                    style={{
                      borderColor: '#111111',
                      backgroundColor: '#ffffff',
                      fontFamily: FONT_MONO,
                      color: '#000000',
                    }}
                  />
                  <button
                    type="submit"
                    className="px-4 py-[10px] text-[11px] tracking-[0.08em] transition-colors bg-white hover:bg-[#f5f5f5]"
                    style={{
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderColor: '#111111',
                      color: '#111111',
                      whiteSpace: 'nowrap',
                      fontFamily: FONT_MONO,
                    }}
                  >
                    SÖK
                  </button>
                </form>
                {searchError && (
                  <div className="mt-2 text-[11px] md:text-right" style={{ fontFamily: FONT_MONO, color: ACCENT_ORANGE }}>
                    {searchError}
                  </div>
                )}
              </div>
              </div>
            </div>
            <div className="w-full flex justify-center">
              <div className="w-full max-w-[1400px]">
                <ResponsiveContainer width="100%" height={680}>
                <ScatterChart margin={{ top: 30, right: 80, bottom: 70, left: 40 }} style={{ fontFamily: FONT_MONO }}>
                  <CartesianGrid strokeDasharray="0" stroke="#00000010" strokeWidth={0.5} />
                  <XAxis
                    type="number"
                    dataKey="antalSkyddsrum"
                    name="Antal skyddsrum"
                    domain={[0, sverigeXAxisMax]}
                    ticks={sverigeXTicks}
                    tickFormatter={(value: number) => value.toLocaleString('sv-SE')}
                    tick={{ fill: '#000000', fontSize: 9, fontFamily: FONT_MONO }}
                    angle={-90}
                    textAnchor="end"
                    stroke="#000000"
                    strokeWidth={0.5}
                    label={{
                      value: 'Antal skyddsrum',
                      position: 'bottom',
                      dy: 30,
                      fill: '#000000',
                      fontSize: 10,
                      fontFamily: FONT_MONO,
                    }}
                  />
                  <YAxis
                    type="number"
                    dataKey="andel"
                    name="Andel %"
                    tick={{ fill: '#000000', fontSize: 10, fontFamily: FONT_MONO }}
                    stroke="#000000"
                    strokeWidth={0.5}
                    domain={[0, 140]}
                    label={{ value: 'Andel av befolkningen (%)', angle: -90, position: 'insideLeft', fill: '#000000', fontSize: 10, fontFamily: FONT_MONO }}
                  />
                  <ZAxis range={[100, 100]} />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3', stroke: '#00000040', strokeWidth: 0.5 }}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #000000',
                      borderRadius: 0,
                      fontSize: 11,
                      fontFamily: FONT_MONO,
                    }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div
                            className="border border-black/20 p-3 text-xs"
                            style={{ backgroundColor: '#ffffff', fontFamily: FONT_MONO }}
                          >
                            <div className="text-black mb-2" style={{ fontFamily: FONT_HELVETICA }}>{data.kommun}</div>
                            <div className="space-y-1">
                              <div className="flex justify-between gap-4">
                                <span className="text-black">Andel:</span>
                                <span className="text-black">{data.andel}%</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-black">Skyddsrumsplats:</span>
                                <span className="text-black">{data.antalPlatser.toLocaleString('sv-SE')}</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-black">Befolkning:</span>
                                <span className="text-black">
                                  {Number.isFinite(data.befolkning) ? data.befolkning.toLocaleString('sv-SE') : '-'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter
                    data={sverigeFilteredData}
                    onMouseEnter={(data) => setHoveredKommunSverige(data.kommun)}
                    onMouseLeave={() => setHoveredKommunSverige(null)}
                    shape={(props: any) => {
                      const { cx, cy, payload } = props;
                      const isSelected = selectedKommunSverige === payload.kommun;
                      const isHovered = hoveredKommunSverige === payload.kommun;
                      const isActive = isSelected || isHovered;
                      const size = isActive ? 7.6 : 4.8;
                      const triHeight = size * 0.8660254;
                      const yOffset = -0.2;
                      // Match icon proportions: square only slightly larger than triangle.
                      const squarePadding = size * (isActive ? 0.3 : 0.26);
                      const triangleIndex =
                        typeof props.index === 'number'
                          ? props.index
                          : sverigeFilteredData.findIndex((d) => d.kommun === payload.kommun);
                      const progress =
                        sverigeTriangleProgress[triangleIndex] ??
                        (hasAnimatedSverigeScatter.current ? 1 : 0);
                      const scale = 0.55 + progress * 0.45;

                      return (
                        <g>
                          {isActive && (
                            <rect
                              x={cx - (size + squarePadding)}
                              y={cy - (size + squarePadding)}
                              width={(size + squarePadding) * 2}
                              height={(size + squarePadding) * 2}
                              fill={ACCENT_ORANGE}
                              fillOpacity={1}
                              stroke="none"
                              style={{
                                opacity: 1,
                                transform: `scale(${scale})`,
                                transformOrigin: `${cx}px ${cy}px`,
                              }}
                            />
                          )}
                          <polygon
                            points={`${cx},${cy + yOffset - triHeight} ${cx + size},${cy + yOffset + triHeight} ${cx - size},${cy + yOffset + triHeight}`}
                            fill={ACCENT_BLUE}
                            stroke="none"
                            style={{
                              opacity: isActive ? 1 : 0.6 * progress,
                              transform: `scale(${scale})`,
                              transformOrigin: `${cx}px ${cy}px`,
                              transition: 'opacity 0.25s ease-out',
                            }}
                          />
                        </g>
                      );
                    }}
                  />

                  {/* Search-selected kommun info box anchored next to its point (hover-like) */}
                  {selectedKommunSverige && (() => {
                    const selected = sverigeData.find(d => d.kommun === selectedKommunSverige);
                    if (!selected) return null;
                    return (
                      <ReferenceDot
                        x={selected.antalSkyddsrum}
                        y={selected.andel}
                        r={0}
                        isFront
                        ifOverflow="extendDomain"
                        label={(props: any) => {
                          const x = props?.x;
                          const y = props?.y;
                          if (typeof x !== 'number' || typeof y !== 'number') return <g />;

                          const width = 190;
                          const height = 86;
                          const offsetX = 14;
                          const offsetY = -10;

                          return (
                            <g style={{ pointerEvents: 'none' }}>
                              <foreignObject
                                x={x + offsetX}
                                y={y + offsetY - height / 2}
                                width={width}
                                height={height}
                                style={{
                                  overflow: 'visible',
                                  opacity: 1,
                                  transition: 'opacity 200ms ease-out, transform 200ms ease-out',
                                }}
                              >
                                <div
                                  style={{
                                    background: '#ffffff',
                                    border: '1px solid rgba(0,0,0,0.2)',
                                    borderRadius: 0,
                                    fontFamily: FONT_MONO,
                                    fontSize: '12px',
                                    padding: '10px 12px',
                                    boxSizing: 'border-box',
                                  }}
                                >
                                  <div style={{ color: '#000000', marginBottom: 8, fontFamily: FONT_HELVETICA }}>{selected.kommun}</div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
                                    <span style={{ color: '#000000' }}>Andel:</span>
                                    <span style={{ color: '#000000' }}>{selected.andel}%</span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                                    <span style={{ color: '#000000' }}>Skyddsrumsplats:</span>
                                    <span style={{ color: '#000000' }}>
                                      {selected.antalPlatser.toLocaleString('sv-SE')}
                                    </span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 4 }}>
                                    <span style={{ color: '#000000' }}>Befolkning:</span>
                                    <span style={{ color: '#000000' }}>
                                      {Number.isFinite(selected.befolkning) ? selected.befolkning.toLocaleString('sv-SE') : '-'}
                                    </span>
                                  </div>
                                </div>
                              </foreignObject>
                            </g>
                          );
                        }}
                      />
                    );
                  })()}
                </ScatterChart>
              </ResponsiveContainer>
              </div>
            </div>
          </CornerFrame>

          {/* Secondary region charts (Stockholm/Göteborg/Malmö) under Sverige */}
          <div className="mt-12 flex flex-col" ref={secondarySectionRef}>
            <CornerFrame className="p-6 md:p-10">
              <div className="mb-6 flex flex-wrap gap-2">
                {(['stockholm', 'goteborg', 'malmo'] as Exclude<RegionKey, 'sverige'>[]).map(key => {
                  const isSelected = secondaryRegion === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setSecondaryRegion(key)}
                      className="flex h-[52px] items-center gap-3 px-5 text-sm tracking-wider transition-colors"
                      style={{
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderColor: isSelected ? 'transparent' : '#111111',
                        color: isSelected ? ACCENT_BLUE : '#111111',
                        backgroundColor: isSelected ? ACCENT_ORANGE : '#ffffff',
                        fontFamily: FONT_HELVETICA,
                        fontWeight: 700,
                        lineHeight: 1,
                      }}
                    >
                      <span className="inline-flex items-center h-full leading-none" style={{ fontFamily: FONT_HELVETICA, fontWeight: 700 }}>{REGION_BUTTON_LABELS[key]}</span>
                      <span className="inline-flex items-center justify-center h-full leading-none">
                        <svg viewBox="-1 -1 12 10.66" width="12" height="11" style={{ display: 'block' }} xmlns="http://www.w3.org/2000/svg">
                          <polygon points="5,0 10,8.66 0,8.66" fill="none" stroke={isSelected ? ACCENT_BLUE : '#111111'} strokeWidth="1.3" strokeLinejoin="miter" />
                          <polygon points="5,0 10,8.66 0,8.66" fill={isSelected ? ACCENT_BLUE : '#111111'} style={{ opacity: isSelected ? 1 : 0 }} />
                        </svg>
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="relative mb-6">
                <div className="max-w-[620px] text-[12px] leading-[1.45]" style={{ color: '#000000', fontFamily: FONT_MONO }}>
                  Visar varje kommun i valt område som en vertikal linje där höjden motsvarar uppskattad andel av befolkningen som har skyddsrumsplats.
                </div>

                {selectedKommunSecondary && (() => {
                  const selected = secondaryBaseData.find(d => d.kommun === selectedKommunSecondary);
                  if (!selected) return null;
                  return (
                    <div
                      className="absolute right-0 top-0 border px-6 h-[52px] flex items-center gap-10 text-xs"
                      style={{ borderColor: '#000000', fontFamily: FONT_HELVETICA, backgroundColor: '#ffffff', lineHeight: 1 }}
                    >
                      <div className="flex items-center gap-2 h-full">
                        <span className="tracking-wider" style={{ color: '#000000', fontFamily: FONT_HELVETICA, fontWeight: 500 }}>KOMMUN:</span>
                        <span className="text-black inline-flex items-center min-w-[120px]" style={{ fontFamily: FONT_HELVETICA }}>{selected.kommun}</span>
                      </div>
                      <div className="flex items-center gap-2 h-full">
                        <span className="tracking-wider" style={{ color: '#000000', fontFamily: FONT_HELVETICA, fontWeight: 500 }}>ANDEL:</span>
                        <span className="text-black inline-flex items-center min-w-[40px]" style={{ fontFamily: FONT_MONO }}>{selected.andel}%</span>
                      </div>
                      <div className="flex items-center gap-2 h-full">
                        <span className="tracking-wider" style={{ color: '#000000', fontFamily: FONT_HELVETICA, fontWeight: 500 }}>SKYDDSRUMSPLATSER:</span>
                        <span className="text-black inline-flex items-center min-w-[60px]" style={{ fontFamily: FONT_MONO }}>{selected.antalPlatser.toLocaleString('sv-SE')}</span>
                      </div>
                      <div className="flex items-center gap-2 h-full">
                        <span className="tracking-wider" style={{ color: '#000000', fontFamily: FONT_HELVETICA, fontWeight: 500 }}>BEFOLKNING:</span>
                        <span className="text-black inline-flex items-center min-w-[60px]" style={{ fontFamily: FONT_MONO }}>
                          {Number.isFinite(selected.befolkning) ? selected.befolkning.toLocaleString('sv-SE') : '-'}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
              
              <div style={{ height: '500px', position: 'relative' }}>
                <div style={{ 
                  height: '400px', 
                  display: 'flex', 
                  alignItems: 'flex-end', 
                  gap: '2px',
                  paddingBottom: '20px'
                }}>
                  {secondaryFilteredData.map((item) => {
                    const maxAndel = 130;
                    const lineHeight = (item.andel / maxAndel) * 100;
                    const isSelected = selectedKommunSecondary === item.kommun;
                    const renderedHeightPercent = Math.max(0.6, lineHeight * dotsAnimationProgress);
                    const triangleWidth = isSelected ? 16 : 14;
                    const triangleHeight = triangleWidth * 0.8660254; // keep equilateral ratio
                    
                    return (
                      <div
                        key={item.kommun}
                        style={{
                          flex: 1,
                          position: 'relative',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          cursor: 'pointer',
                          height: '100%'
                        }}
                        onMouseEnter={() => setSelectedKommunSecondary(item.kommun)}
                      >
                        <div
                          style={{
                            width: isSelected ? '26px' : '24px',
                            height: `${renderedHeightPercent}%`,
                            backgroundColor: isSelected ? ACCENT_ORANGE : '#ffffff',
                            border: `1px solid ${isSelected ? ACCENT_ORANGE : '#000000'}`,
                            transition: 'all 0.3s ease',
                            position: 'relative',
                            zIndex: 1,
                          }}
                        >
                          <svg
                            width={triangleWidth}
                            height={triangleHeight}
                            viewBox="0 0 10 8.660254"
                            style={{
                              position: 'absolute',
                              left: '50%',
                              bottom: '4px',
                              transform: 'translateX(-50%)',
                              transition: 'all 0.3s ease',
                            }}
                          >
                            <polygon
                              points="5,0 10,8.660254 0,8.660254"
                              fill={isSelected ? ACCENT_BLUE : '#111111'}
                              opacity={1}
                            />
                          </svg>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div style={{ 
                  height: '60px', 
                  display: 'flex', 
                  gap: '2px',
                  marginTop: '8px'
                }}>
                  {secondaryFilteredData.map((item) => {
                    const isSelected = selectedKommunSecondary === item.kommun;
                    return (
                      <div
                        key={`name-${item.kommun}`}
                        style={{
                          flex: 1,
                          display: 'flex',
                          justifyContent: 'center'
                        }}
                      >
                        <div
                          style={{
                            fontSize: '10px',
                            writingMode: 'vertical-rl',
                            transform: 'rotate(180deg)',
                            color: isSelected ? ACCENT_BLUE : '#000000',
                            transition: 'color 0.3s ease',
                            position: 'relative',
                            padding: '3px',
                            fontFamily: FONT_HELVETICA,
                            fontWeight: 400
                          }}
                        >
                          {item.kommun}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CornerFrame>
          </div>
        </div>

        {/* Bottom section: Historical data - same width and placement as other diagrams */}
        <div className="flex flex-col" ref={historicalRef}>
          <CornerFrame className="p-6 md:p-10">
            <div className="mb-6 space-y-1">
              <div
                className="uppercase tracking-[0.04em]"
                style={{ color: ACCENT_BLUE, fontFamily: FONT_HELVETICA, fontSize: 'clamp(22px, 2.8vw, 44px)', lineHeight: 1.05, fontWeight: 500 }}
              >
                HISTORISK UTVECKLING 1950-2025
              </div>
              <div className="text-[11px] max-w-xl leading-relaxed" style={{ color: '#000000', fontFamily: FONT_MONO }}>
                Visar hur den uppskattade täckningsgraden för skyddsrum i Sverige har förändrats över tid, från 1950 till 2025.
              </div>
            </div>
            <div className="w-full flex justify-center">
              <div className="w-full max-w-[1400px]">
                <ResponsiveContainer width="100%" height={500}>
                  <LineChart key={`history-${historyAnimationKey}`} data={historicalData} margin={{ top: 20, right: 70, bottom: 60, left: 40 }} style={{ fontFamily: FONT_MONO }}>
                  <CartesianGrid strokeDasharray="0" stroke="#00000010" strokeWidth={0.5} />
                  <XAxis
                    dataKey="år"
                    tick={{ fill: '#000000', fontSize: 10, fontFamily: FONT_MONO }}
                    stroke="#000000"
                    strokeWidth={0.5}
                    label={{ value: 'År', position: 'bottom', fill: '#000000', fontSize: 10, fontFamily: FONT_MONO }}
                  />
                  <YAxis
                    tick={{ fill: '#000000', fontSize: 10, fontFamily: FONT_MONO }}
                    stroke="#000000"
                    strokeWidth={0.5}
                    label={{ value: 'Täckningsgrad (%)', angle: -90, position: 'insideLeft', fill: '#000000', fontSize: 10, fontFamily: FONT_MONO }}
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3', stroke: '#00000040', strokeWidth: 0.5 }}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #000000',
                      borderRadius: 0,
                      fontSize: 11,
                      fontFamily: FONT_MONO,
                    }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div
                            className="border border-black/20 p-3 text-xs"
                            style={{ backgroundColor: '#ffffff', fontFamily: FONT_MONO }}
                          >
                            <div className="text-black mb-2" style={{ fontFamily: FONT_HELVETICA, fontWeight: 700 }}>{data.år}</div>
                            <div className="space-y-1">
                              <div className="flex justify-between gap-4">
                                <span className="text-black">Täckningsgrad:</span>
                                <span className="text-black">{data.täckningsgrad}%</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-black">Skyddsrum:</span>
                                <span className="text-black">{data.skyddsrum.toLocaleString('sv-SE')}</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-black">Befolkning:</span>
                                <span className="text-black">{data.befolkning} milj</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="täckningsgrad"
                    stroke="#000000"
                    strokeWidth={0.8}
                    strokeOpacity={0.9}
                    isAnimationActive={canStartChartAnimations}
                    animationDuration={1800}
                    animationEasing="ease-out"
                    dot={(props: any) => {
                      const { cx, cy, payload, index } = props;
                      if (!payload.täckningsgrad) return <g key={`dot-${index}`} />;

                      const pointIndex =
                        typeof index === 'number'
                          ? index
                          : historicalData.findIndex((p) => p.år === payload.år);
                      if (pointIndex < 0) return <g key={`dot-${index}`} />;
                      const progress = historyTriangleProgress[pointIndex] ?? (canStartChartAnimations ? 1 : 0);
                      if (progress <= 0) return <g key={`dot-${index}`} />;

                      const size = 5;
                      const triHeight = size * 0.8660254;
                      return (
                        <polygon
                          key={`dot-${historyAnimationKey}-${pointIndex}`}
                          points={`${cx},${cy - triHeight} ${cx + size},${cy + triHeight} ${cx - size},${cy + triHeight}`}
                          fill={ACCENT_BLUE}
                          stroke="none"
                          style={{
                            opacity: progress,
                            transform: `scale(${0.86 + progress * 0.14})`,
                            transformOrigin: `${cx}px ${cy}px`,
                          }}
                        />
                      );
                    }}
                    activeDot={(props: any) => {
                      const { cx, cy, index } = props;
                      const size = 7;
                      const triHeight = size * 0.8660254;
                      const yOffset = -0.2;
                      const squareSize = size * 1.26;
                      return (
                        <g key={`active-dot-${index}`}>
                          <rect
                            x={cx - squareSize}
                            y={cy - squareSize}
                            width={squareSize * 2}
                            height={squareSize * 2}
                            fill={ACCENT_ORANGE}
                            fillOpacity={1}
                            stroke="none"
                          />
                          <polygon
                            points={`${cx},${cy + yOffset - triHeight} ${cx + size},${cy + yOffset + triHeight} ${cx - size},${cy + yOffset + triHeight}`}
                            fill={ACCENT_BLUE}
                            stroke="none"
                          />
                        </g>
                      );
                    }}
                    connectNulls={false}
                  />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CornerFrame>
        </div>
      </div>

      </div>
    </div>
  );
}