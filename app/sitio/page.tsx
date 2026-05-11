'use client'
import { useState } from 'react'

const NAV_LINKS = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Nosotros', href: '#nosotros' },
  { label: 'Productos', href: '#productos' },
  { label: 'Certificaciones', href: '#certificaciones' },
  { label: 'Contacto', href: '#contacto' },
]

const PRODUCTOS = [
  {
    nombre: 'Cerezas',
    variedades: 'Santina, Bing, Lapins, Royal Dawn, Stella, Regina, Kordia, Sweet Aryana, Sweet Heart',
    img: 'https://exportadoradisfruta.cl/wp-content/uploads/2025/11/fresh-04.png',
    emoji: '🍒',
    color: 'from-red-900 to-red-700',
  },
  {
    nombre: 'Kiwis',
    variedades: 'Hayward',
    img: 'https://exportadoradisfruta.cl/wp-content/uploads/2025/11/fresh-03.png',
    emoji: '🥝',
    color: 'from-green-800 to-green-600',
  },
  {
    nombre: 'Ciruelas',
    variedades: 'Autumn Pride, Angeleno, Sugar Plums',
    img: 'https://exportadoradisfruta.cl/wp-content/uploads/2025/11/fresh-09-04.png',
    emoji: '🍑',
    color: 'from-purple-900 to-purple-700',
  },
  {
    nombre: 'Nueces',
    variedades: 'Chandler',
    img: null,
    emoji: '🥜',
    color: 'from-amber-800 to-amber-600',
  },
  {
    nombre: 'Nectarinas',
    variedades: 'Nectacrest, Giant Pearl, Magique, Sunrise, Sweet Giant, Arctic Mist, Arctic Snow',
    img: null,
    emoji: '🍑',
    color: 'from-orange-700 to-orange-500',
  },
]

const CERTIFICACIONES = [
  {
    nombre: 'GlobalGAP',
    desc: 'Huertos certificados bajo los estándares internacionales de buenas prácticas agrícolas.',
    img: 'https://exportadoradisfruta.cl/wp-content/uploads/2025/11/Logo_GlobalGAP1.png',
  },
  {
    nombre: 'HACCP',
    desc: 'Sistema de análisis de peligros y puntos críticos de control para garantizar la inocuidad alimentaria.',
    img: 'https://exportadoradisfruta.cl/wp-content/uploads/2025/11/logohaccp.png',
  },
  {
    nombre: 'BPM',
    desc: 'Buenas Prácticas de Manufactura aplicadas en todos nuestros procesos de producción y embalaje.',
    img: 'https://exportadoradisfruta.cl/wp-content/uploads/2025/11/bpm.png',
  },
]

const VALORES = [
  { titulo: 'Sentido de Pertenencia', desc: 'Cada miembro del equipo es parte fundamental de nuestra historia.' },
  { titulo: 'Convicción', desc: 'Actuamos con decisión y compromiso en cada etapa del proceso.' },
  { titulo: 'Transparencia', desc: 'Relaciones basadas en honestidad y comunicación abierta con nuestros clientes.' },
  { titulo: 'Respeto', desc: 'Valoramos a las personas, el medioambiente y las comunidades donde operamos.' },
]

export default function SitioPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [form, setForm] = useState({ nombre: '', email: '', mensaje: '' })
  const [enviado, setEnviado] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setEnviado(true)
  }

  return (
    <div className="font-sans text-gray-800 bg-white">

      {/* TOP BAR */}
      <div style={{ backgroundColor: '#1a3a1a' }} className="text-white text-xs py-2 hidden md:block">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex gap-6">
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
              </svg>
              +56 7 2239 1344
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
              </svg>
              contacto@exportadoradisfruta.cl
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
              </svg>
              Ruta H-40 N°1740, Olivar, Chile
            </span>
          </div>
          <div className="text-gray-400 text-xs">Exportando lo mejor de Chile al mundo</div>
        </div>
      </div>

      {/* HEADER */}
      <header style={{ backgroundColor: '#fff' }} className="sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* LOGO */}
          <a href="#inicio" className="flex items-center gap-3 no-underline">
            <div style={{ backgroundColor: '#2d6a2d' }} className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg">D</div>
            <div>
              <div style={{ color: '#2d6a2d' }} className="font-bold text-xl leading-none">DISFRUTA</div>
              <div className="text-gray-500 text-xs tracking-widest uppercase">Fresh Fruit Export</div>
            </div>
          </a>

          {/* DESKTOP NAV */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                style={{ color: '#333' }}
                className="px-4 py-2 text-sm font-medium hover:text-green-700 transition-colors rounded no-underline"
              >
                {l.label}
              </a>
            ))}
            <a
              href="#contacto"
              style={{ backgroundColor: '#2d6a2d' }}
              className="ml-4 px-5 py-2 text-white text-sm font-semibold rounded hover:opacity-90 transition-opacity no-underline"
            >
              Contactar
            </a>
          </nav>

          {/* MOBILE MENU TOGGLE */}
          <button
            className="md:hidden p-2 rounded text-gray-600"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menú"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
              }
            </svg>
          </button>
        </div>

        {/* MOBILE MENU */}
        {menuOpen && (
          <div style={{ backgroundColor: '#1a3a1a' }} className="md:hidden px-6 pb-4">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="block py-2 text-white text-sm font-medium border-b border-green-800 no-underline"
                onClick={() => setMenuOpen(false)}
              >
                {l.label}
              </a>
            ))}
          </div>
        )}
      </header>

      {/* HERO */}
      <section
        id="inicio"
        style={{
          background: 'linear-gradient(135deg, #1a3a1a 0%, #2d6a2d 40%, #4a8a3a 100%)',
          minHeight: '90vh',
        }}
        className="relative flex items-center overflow-hidden"
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} className="w-full h-full" />
        </div>

        {/* Decorative circles */}
        <div className="absolute right-0 top-0 w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
        <div className="absolute left-0 bottom-0 w-72 h-72 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }} />

        <div className="relative max-w-7xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-12 items-center">
          <div className="text-white">
            <div className="inline-block bg-white bg-opacity-20 text-white text-xs font-semibold tracking-widest uppercase px-4 py-2 rounded-full mb-6">
              40 años de experiencia
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              Fruta Chilena
              <span className="block" style={{ color: '#a8e06a' }}>de Calidad</span>
              <span className="block">Superior</span>
            </h1>
            <p className="text-green-100 text-lg mb-8 leading-relaxed max-w-lg">
              Exportamos lo mejor de Chile al mundo. Empresa familiar con décadas de experiencia en producción y embalaje de fruta fresca de calidad superior.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="#productos"
                style={{ backgroundColor: '#a8e06a', color: '#1a3a1a' }}
                className="px-8 py-3 font-bold rounded-full hover:opacity-90 transition-opacity no-underline text-sm"
              >
                Ver Productos
              </a>
              <a
                href="#nosotros"
                className="px-8 py-3 font-bold rounded-full border-2 border-white text-white hover:bg-white hover:text-green-900 transition-colors no-underline text-sm"
              >
                Conocenos
              </a>
            </div>

            {/* Stats */}
            <div className="mt-14 grid grid-cols-3 gap-6 border-t border-white border-opacity-20 pt-8">
              {[
                { num: '40+', label: 'Años de Experiencia' },
                { num: '6', label: 'Variedades de Fruta' },
                { num: '100%', label: 'Calidad Certificada' },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-3xl font-bold" style={{ color: '#a8e06a' }}>{s.num}</div>
                  <div className="text-green-200 text-xs mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero image area */}
          <div className="hidden md:flex items-center justify-center relative">
            <div className="relative">
              {/* Main fruit image */}
              <div className="w-80 h-80 rounded-full overflow-hidden border-8 border-white border-opacity-20 shadow-2xl">
                <img
                  src="https://exportadoradisfruta.cl/wp-content/uploads/2025/11/fresh-04.png"
                  alt="Fruta fresca Disfruta"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const t = e.target as HTMLImageElement
                    t.style.display = 'none'
                  }}
                />
                {/* Fallback visual */}
                <div className="w-full h-full flex items-center justify-center text-9xl">🍒</div>
              </div>

              {/* Floating badges */}
              <div className="absolute -top-4 -right-8 bg-white rounded-2xl shadow-xl px-4 py-3">
                <div className="text-xs font-semibold text-gray-500">Certificado</div>
                <div className="text-sm font-bold text-green-700">GlobalGAP ✓</div>
              </div>
              <div className="absolute -bottom-4 -left-8 bg-white rounded-2xl shadow-xl px-4 py-3">
                <div className="text-xs font-semibold text-gray-500">Empresa Familiar</div>
                <div className="text-sm font-bold text-green-700">Agroelite Ltda.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* ABOUT */}
      <section id="nosotros" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Images collage */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl overflow-hidden shadow-lg h-56 bg-green-50 flex items-center justify-center">
                  <img
                    src="https://exportadoradisfruta.cl/wp-content/uploads/2025/11/fresh-03.png"
                    alt="Kiwi fresco"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const t = e.target as HTMLImageElement
                      t.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-6xl bg-green-50">🥝</div>'
                    }}
                  />
                </div>
                <div className="rounded-2xl overflow-hidden shadow-lg h-56 mt-8 bg-red-50 flex items-center justify-center">
                  <img
                    src="https://exportadoradisfruta.cl/wp-content/uploads/2025/11/fresh-09-04.png"
                    alt="Fruta fresca"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const t = e.target as HTMLImageElement
                      t.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-6xl bg-red-50">🍒</div>'
                    }}
                  />
                </div>
                <div className="col-span-2 rounded-2xl overflow-hidden shadow-lg h-40 bg-amber-50 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2d6a2d, #4a8a3a)' }}>
                  <div className="text-center text-white p-6">
                    <div className="text-4xl font-bold">40+</div>
                    <div className="text-green-200 text-sm">Años produciendo la mejor fruta de Chile</div>
                  </div>
                </div>
              </div>

              {/* Decorative element */}
              <div style={{ backgroundColor: '#a8e06a' }} className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full opacity-40 -z-10" />
              <div style={{ backgroundColor: '#2d6a2d' }} className="absolute -top-6 -left-6 w-16 h-16 rounded-full opacity-20 -z-10" />
            </div>

            {/* Text */}
            <div>
              <div style={{ color: '#2d6a2d' }} className="text-sm font-bold uppercase tracking-widest mb-3">Quiénes Somos</div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
                Empresa familiar con pasión por la fruta de calidad
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                Disfruta es la división exportadora de <strong>Agroelite Ltda.</strong>, empresa familiar con más de 40 años de trayectoria en la producción y embalaje de fruta fresca.
              </p>
              <p className="text-gray-600 leading-relaxed mb-8">
                Nuestros huertos se ubican en la sexta y séptima región de Chile, zonas privilegiadas por su clima ideal para producir fruta de exportación. Combinamos experiencia generacional con estándares internacionales de calidad para llevar lo mejor de Chile a los mercados más exigentes del mundo.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                {VALORES.map((v) => (
                  <div key={v.titulo} className="p-4 rounded-xl bg-green-50 border border-green-100">
                    <div style={{ color: '#2d6a2d' }} className="font-semibold text-sm mb-1">{v.titulo}</div>
                    <div className="text-gray-500 text-xs leading-relaxed">{v.desc}</div>
                  </div>
                ))}
              </div>

              {/* Mission & Vision */}
              <div className="space-y-4">
                <div style={{ borderLeft: '4px solid #2d6a2d' }} className="pl-4">
                  <div className="font-bold text-gray-900 text-sm mb-1">Misión</div>
                  <div className="text-gray-600 text-sm">Entregar fruta de calidad producida bajo los más altos estándares a través de un servicio de excelencia.</div>
                </div>
                <div style={{ borderLeft: '4px solid #a8e06a' }} className="pl-4">
                  <div className="font-bold text-gray-900 text-sm mb-1">Visión</div>
                  <div className="text-gray-600 text-sm">Exportar la mejor fruta de Chile al mundo.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section id="productos" style={{ backgroundColor: '#f5faf5' }} className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div style={{ color: '#2d6a2d' }} className="text-sm font-bold uppercase tracking-widest mb-3">Nuestros Productos</div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Fruta Fresca de Exportación</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Producimos y exportamos una amplia variedad de frutas frescas, cultivadas en los mejores suelos de Chile bajo estrictos estándares de calidad internacional.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {PRODUCTOS.slice(0, 3).map((p) => (
              <div key={p.nombre} className="group rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow bg-white">
                {/* Image / color header */}
                <div className={`bg-gradient-to-br ${p.color} h-52 flex items-center justify-center relative overflow-hidden`}>
                  {p.img ? (
                    <img
                      src={p.img}
                      alt={p.nombre}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const t = e.target as HTMLImageElement
                        t.parentElement!.innerHTML = `<div class="text-7xl">${p.emoji}</div>`
                      }}
                    />
                  ) : (
                    <div className="text-7xl">{p.emoji}</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white font-bold text-2xl">{p.nombre}</div>
                </div>
                <div className="p-6">
                  <div style={{ color: '#2d6a2d' }} className="text-xs font-bold uppercase tracking-wider mb-2">Variedades</div>
                  <p className="text-gray-600 text-sm leading-relaxed">{p.variedades}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {PRODUCTOS.slice(3).map((p) => (
              <div key={p.nombre} className="group rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow bg-white flex">
                <div className={`bg-gradient-to-br ${p.color} w-32 flex-shrink-0 flex items-center justify-center`}>
                  <div className="text-5xl">{p.emoji}</div>
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-gray-900 text-xl mb-2">{p.nombre}</h3>
                  <div style={{ color: '#2d6a2d' }} className="text-xs font-bold uppercase tracking-wider mb-2">Variedades</div>
                  <p className="text-gray-600 text-sm leading-relaxed">{p.variedades}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Availability table */}
          <div className="mt-12 rounded-2xl overflow-hidden shadow-md bg-white p-6">
            <h3 className="font-bold text-gray-900 text-xl mb-4 text-center">Tabla de Disponibilidad</h3>
            <div className="flex justify-center">
              <img
                src="https://exportadoradisfruta.cl/wp-content/uploads/2025/11/tabla-disfruta-v2-scaled.png"
                alt="Tabla de disponibilidad de productos Disfruta"
                className="max-w-full rounded-xl"
                onError={(e) => {
                  const t = e.target as HTMLImageElement
                  t.style.display = 'none'
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* BRANDS */}
      <section className="py-16 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <div style={{ color: '#2d6a2d' }} className="text-sm font-bold uppercase tracking-widest mb-2">Nuestras Marcas</div>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-12">
            {[
              'https://exportadoradisfruta.cl/wp-content/uploads/2025/11/756144be42a3a8aca874a333228283fc162f7482.png',
              'https://exportadoradisfruta.cl/wp-content/uploads/2025/11/a023e6e3d2379e59ae75091359fe45e2f4c8913a.png',
              'https://exportadoradisfruta.cl/wp-content/uploads/2025/11/atlas.png',
            ].map((src, i) => (
              <div key={i} className="h-16 flex items-center">
                <img
                  src={src}
                  alt={`Marca ${i + 1}`}
                  className="h-12 object-contain grayscale hover:grayscale-0 transition-all"
                  onError={(e) => {
                    const t = e.target as HTMLImageElement
                    t.parentElement!.style.display = 'none'
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CERTIFICATIONS */}
      <section id="certificaciones" style={{ background: 'linear-gradient(135deg, #1a3a1a 0%, #2d6a2d 100%)' }} className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="text-green-300 text-sm font-bold uppercase tracking-widest mb-3">Garantía de Calidad</div>
            <h2 className="text-4xl font-bold text-white mb-4">Certificaciones Internacionales</h2>
            <p className="text-green-200 max-w-2xl mx-auto">
              Nuestros procesos cumplen con los más altos estándares internacionales para garantizar la calidad e inocuidad de cada fruta que exportamos.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {CERTIFICACIONES.map((c) => (
              <div key={c.nombre} className="bg-white bg-opacity-10 backdrop-blur rounded-2xl p-8 text-center border border-white border-opacity-20 hover:bg-opacity-20 transition-colors">
                <div className="h-20 flex items-center justify-center mb-6">
                  <img
                    src={c.img}
                    alt={c.nombre}
                    className="h-full object-contain brightness-0 invert"
                    onError={(e) => {
                      const t = e.target as HTMLImageElement
                      t.parentElement!.innerHTML = `<div class="text-4xl text-white font-bold">${c.nombre}</div>`
                    }}
                  />
                </div>
                <h3 className="text-white font-bold text-xl mb-3">{c.nombre}</h3>
                <p className="text-green-200 text-sm leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>

          {/* Additional certs note */}
          <div className="mt-12 text-center bg-white bg-opacity-10 rounded-2xl p-6 border border-white border-opacity-20">
            <p className="text-green-100 text-sm">
              Adicionalmente contamos con <strong className="text-white">Resolución Sanitaria</strong> vigente y cumplimos con todos los requisitos fitosanitarios exigidos por los países de destino.
            </p>
          </div>
        </div>
      </section>

      {/* WHY US */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div style={{ color: '#2d6a2d' }} className="text-sm font-bold uppercase tracking-widest mb-3">¿Por qué Disfruta?</div>
            <h2 className="text-4xl font-bold text-gray-900">Nuestra Diferencia</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: '🌿', titulo: 'Producción Propia', desc: 'Controlamos cada etapa desde el huerto hasta el embalaje, garantizando la cadena de calidad.' },
              { icon: '🌍', titulo: 'Mercado Global', desc: 'Exportamos a los mercados más exigentes de Europa, Asia y América, cumpliendo sus estándares.' },
              { icon: '🏆', titulo: 'Calidad Certificada', desc: 'Múltiples certificaciones internacionales respaldan nuestros procesos y productos.' },
              { icon: '👨‍👩‍👧', titulo: 'Empresa Familiar', desc: 'Más de 40 años de historia familiar con valores de compromiso, respeto y trabajo.' },
            ].map((item) => (
              <div key={item.titulo} className="text-center group">
                <div
                  style={{ backgroundColor: '#f0faf0' }}
                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-5 group-hover:scale-110 transition-transform"
                >
                  {item.icon}
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-3">{item.titulo}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contacto" style={{ backgroundColor: '#f5faf5' }} className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div style={{ color: '#2d6a2d' }} className="text-sm font-bold uppercase tracking-widest mb-3">Hablemos</div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Contáctenos</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              ¿Interesado en nuestros productos? Contáctenos y le responderemos a la brevedad.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact info */}
            <div className="space-y-8">
              <div>
                <h3 className="font-bold text-gray-900 text-xl mb-6">Información de Contacto</h3>
                <div className="space-y-5">
                  {[
                    {
                      icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                      ),
                      label: 'Dirección',
                      value: 'Ruta H-40 N°1740, Olivar, Chile',
                    },
                    {
                      icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                        </svg>
                      ),
                      label: 'Teléfono',
                      value: '+56 7 2239 1344',
                    },
                    {
                      icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                        </svg>
                      ),
                      label: 'Email',
                      value: 'contacto@exportadoradisfruta.cl',
                    },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-4">
                      <div style={{ backgroundColor: '#2d6a2d', color: 'white' }} className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
                        {item.icon}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{item.label}</div>
                        <div className="text-gray-800 font-medium">{item.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Map placeholder */}
              <div className="rounded-2xl overflow-hidden shadow-md h-48 bg-green-100 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)' }}>
                <div className="text-center text-green-700">
                  <div className="text-4xl mb-2">📍</div>
                  <div className="font-semibold text-sm">Olivar, Región del Libertador</div>
                  <div className="text-xs text-green-600">VI Región de Chile</div>
                </div>
              </div>
            </div>

            {/* Contact form */}
            <div className="bg-white rounded-2xl shadow-md p-8">
              {enviado ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">✅</div>
                  <h3 className="font-bold text-gray-900 text-xl mb-2">¡Mensaje enviado!</h3>
                  <p className="text-gray-500">Nos pondremos en contacto con usted a la brevedad.</p>
                  <button
                    onClick={() => { setEnviado(false); setForm({ nombre: '', email: '', mensaje: '' }) }}
                    style={{ color: '#2d6a2d' }}
                    className="mt-6 text-sm font-semibold underline"
                  >
                    Enviar otro mensaje
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h3 className="font-bold text-gray-900 text-xl mb-6">Envíenos un mensaje</h3>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre</label>
                    <input
                      type="text"
                      required
                      value={form.nombre}
                      onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-300 text-sm"
                      placeholder="Su nombre completo"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-300 text-sm"
                      placeholder="su@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Mensaje</label>
                    <textarea
                      required
                      rows={5}
                      value={form.mensaje}
                      onChange={(e) => setForm({ ...form, mensaje: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-300 text-sm resize-none"
                      placeholder="¿En qué podemos ayudarle?"
                    />
                  </div>
                  <button
                    type="submit"
                    style={{ backgroundColor: '#2d6a2d' }}
                    className="w-full py-3 text-white font-bold rounded-xl hover:opacity-90 transition-opacity text-sm"
                  >
                    Enviar Mensaje
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ backgroundColor: '#111f11' }} className="text-white pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div style={{ backgroundColor: '#2d6a2d' }} className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg">D</div>
                <div>
                  <div className="font-bold text-xl leading-none text-white">DISFRUTA</div>
                  <div className="text-green-400 text-xs tracking-widest uppercase">Fresh Fruit Export</div>
                </div>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                División exportadora de Agroelite Ltda. Exportamos fruta de calidad superior desde Chile al mundo con más de 40 años de experiencia.
              </p>
            </div>

            {/* Navigation */}
            <div>
              <div className="text-green-400 text-xs font-bold uppercase tracking-widest mb-4">Navegación</div>
              <ul className="space-y-2">
                {NAV_LINKS.map((l) => (
                  <li key={l.href}>
                    <a href={l.href} className="text-gray-400 text-sm hover:text-white transition-colors no-underline">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <div className="text-green-400 text-xs font-bold uppercase tracking-widest mb-4">Contacto</div>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>Ruta H-40 N°1740</li>
                <li>Olivar, Chile</li>
                <li className="pt-2">+56 7 2239 1344</li>
                <li>contacto@exportadoradisfruta.cl</li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
            <div>© 2026 Disfruta Fresh Fruit · Agroelite Ltda. Todos los derechos reservados.</div>
            <div className="flex gap-3">
              {[
                { cert: 'GlobalGAP', img: 'https://exportadoradisfruta.cl/wp-content/uploads/2025/11/Logo_GlobalGAP1.png' },
                { cert: 'HACCP', img: 'https://exportadoradisfruta.cl/wp-content/uploads/2025/11/logohaccp.png' },
                { cert: 'BPM', img: 'https://exportadoradisfruta.cl/wp-content/uploads/2025/11/bpm.png' },
              ].map((c) => (
                <img
                  key={c.cert}
                  src={c.img}
                  alt={c.cert}
                  className="h-8 object-contain brightness-0 invert opacity-60"
                  onError={(e) => {
                    const t = e.target as HTMLImageElement
                    t.style.display = 'none'
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
