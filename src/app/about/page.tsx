'use client'

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-black text-white px-6 py-20">
      <section className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold mb-6">About Papaya</h1>
        <p className="text-lg md:text-xl text-gray-400 mb-12">
          Papaya is a modern platform built for creators and entrepreneurs
          to map, track, and grow their digital empires. It blends clarity
          with design, giving you one place to connect income, traffic,
          and opportunities.
        </p>
      </section>

      <section className="max-w-3xl mx-auto space-y-16">
        <div>
          <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
          <p className="text-gray-400 leading-relaxed">
            We want to make complexity simple. Whether you’re managing a
            handful of projects or an entire network of platforms, Papaya
            gives you a visual map that’s intuitive to navigate and powerful
            enough to grow with you.
          </p>
        </div>

        <div>
          <h2 className="text-3xl font-bold mb-4">Who’s Behind Papaya</h2>
          <p className="text-gray-400 leading-relaxed">
            Papaya was created by Link 林沛儒, a music producer, author, and
            builder. After years of juggling multiple projects across music,
            teaching, and tech, he designed Papaya as the tool he wished he
            had — something that could keep everything connected.
          </p>
        </div>

        <div>
          <h2 className="text-3xl font-bold mb-4">Why It Matters</h2>
          <p className="text-gray-400 leading-relaxed">
            Creative work often drowns in scattered tools and endless
            spreadsheets. Papaya helps you reclaim focus by bringing
            everything together. Less admin, more making. Less stress,
            more clarity.
          </p>
        </div>
      </section>
    </main>
  )
}
