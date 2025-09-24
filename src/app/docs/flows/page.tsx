'use client'

import { useLanguage } from '@/context/LanguageProvider'

export default function FlowsDocsPage() {
  const { t } = useLanguage()

  return (
    <div className="max-w-3xl mx-auto px-6 py-16 text-neutral-100 space-y-12">
      {/* Title + Intro */}
      <section>
        <h1 className="text-3xl md:text-4xl font-extrabold mb-4">
          {t('docs.flows.title')}
        </h1>
        <p className="text-lg text-neutral-300 leading-relaxed">
          {t('docs.flows.intro')}
        </p>
      </section>

      {/* Active vs Passive */}
      <section>
        <h2 className="text-2xl font-bold mb-3">
          {t('docs.flows.active_vs_passive.title')}
        </h2>
        <ul className="list-disc list-inside space-y-2 text-neutral-300">
          <li>
            <span className="font-semibold text-white">
              {t('docs.flows.active_label')}
            </span>{' '}
            {t('docs.flows.active_vs_passive.active')}
          </li>
          <li>
            <span className="font-semibold text-white">
              {t('docs.flows.passive_label')}
            </span>{' '}
            {t('docs.flows.active_vs_passive.passive')}
          </li>
        </ul>
      </section>

      {/* Nodes */}
      <section>
        <h2 className="text-2xl font-bold mb-3">
          {t('docs.flows.nodes.title')}
        </h2>
        <p className="text-neutral-300 mb-4">{t('docs.flows.nodes.desc')}</p>
        <ul className="space-y-2 text-neutral-300">
          <li>
            <span className="font-semibold text-white">Pocket:</span>{' '}
            {t('docs.flows.nodes.types.pocket')}
          </li>
          <li>
            <span className="font-semibold text-white">Platform:</span>{' '}
            {t('docs.flows.nodes.types.platform')}
          </li>
          <li>
            <span className="font-semibold text-white">People:</span>{' '}
            {t('docs.flows.nodes.types.people')}
          </li>
          <li>
            <span className="font-semibold text-white">Portfolio:</span>{' '}
            {t('docs.flows.nodes.types.portfolio')}
          </li>
          <li>
            <span className="font-semibold text-white">Other:</span>{' '}
            {t('docs.flows.nodes.types.other')}
          </li>
        </ul>
      </section>

      {/* Links */}
      <section>
        <h2 className="text-2xl font-bold mb-3">
          {t('docs.flows.links.title')}
        </h2>
        <p className="text-neutral-300 mb-4">{t('docs.flows.links.desc')}</p>
        <ul className="space-y-2 text-neutral-300">
          <li>
            <span className="font-semibold text-white">Income:</span>{' '}
            {t('docs.flows.links.types.income')}
          </li>
          <li>
            <span className="font-semibold text-white">Fuel:</span>{' '}
            {t('docs.flows.links.types.fuel')}
          </li>
          <li>
            <span className="font-semibold text-white">Traffic:</span>{' '}
            {t('docs.flows.links.types.traffic')}
          </li>
        </ul>
      </section>

      {/* Why */}
      <section>
        <h2 className="text-2xl font-bold mb-3">
          {t('docs.flows.why.title')}
        </h2>
        <p className="text-neutral-300 leading-relaxed">
          {t('docs.flows.why.text')}
        </p>
      </section>
    </div>
  )
}
