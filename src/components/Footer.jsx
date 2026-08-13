import React from 'react';
import { profile as defaultProfile, uiTexts as defaultUiTexts } from '../data/resume';

export default function Footer({ profile = defaultProfile, uiTexts = defaultUiTexts }) {
  return (
    <footer className="border-t" style={{ borderColor: 'rgba(96, 165, 250, 0.14)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm select-none">
            {uiTexts.footerCopyright}
          </p>
          <div className="flex items-center gap-6">
            <a href="#home" className="text-gray-500 hover:text-primary-400 text-sm transition-colors">
              {uiTexts.footerBackTop}
            </a>
            <a href={`mailto:${profile.email}`} className="text-gray-500 hover:text-primary-400 text-sm transition-colors">
              {uiTexts.footerContact}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
