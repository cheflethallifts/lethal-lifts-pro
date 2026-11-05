import React, { useState, useEffect } from 'react';
import { Smartphone, Share, X as XIcon } from 'lucide-react';

const DISMISSED_KEY = 'lethal_install_tip_dismissed';

// Chrome offers its install prompt once, usually before the Hub is on screen, so it's kept here until needed.
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredPrompt = event;
  window.dispatchEvent(new Event('lethal-install-available'));
});

const isInstalled = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;

const ua = window.navigator.userAgent;
// iPads report themselves as Macs, so touch support tells them apart.
const isIOS = /iPhone|iPad|iPod/.test(ua) || (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
const isAndroid = /Android/.test(ua);

const wasDismissed = () => {
  try { return localStorage.getItem(DISMISSED_KEY) === '1'; } catch (e) { return false; }
};

function InstallTip() {
  const [dismissed, setDismissed] = useState(wasDismissed);
  const [installed, setInstalled] = useState(isInstalled);
  const [canPrompt, setCanPrompt] = useState(() => !!deferredPrompt);

  useEffect(() => {
    const onAvailable = () => setCanPrompt(true);
    const onInstalled = () => setInstalled(true);
    window.addEventListener('lethal-install-available', onAvailable);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('lethal-install-available', onAvailable);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (dismissed || installed || !(isIOS || isAndroid)) return null;

  const handleDismiss = () => {
    try { localStorage.setItem(DISMISSED_KEY, '1'); } catch (e) {}
    setDismissed(true);
  };

  const handleInstall = async () => {
    // Chrome only allows each prompt to be shown once.
    const installPrompt = deferredPrompt;
    deferredPrompt = null;
    setCanPrompt(false);
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setInstalled(true);
  };

  return (
    <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl p-4 shadow-lg shadow-cyan-500/5 relative">
      <button onClick={handleDismiss} aria-label="Dismiss" className="absolute top-3 right-3 p-1 text-cyan-500/60 hover:text-white transition-colors">
        <XIcon size={18} />
      </button>
      <div className="flex items-start gap-3 pr-6">
        <div className="bg-cyan-500/20 p-2 rounded-full text-cyan-400 shrink-0">
          <Smartphone size={20} />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-cyan-400 text-sm">Add Lethal Lifts to your home screen</h3>
          <p className="text-xs text-cyan-100/70 leading-relaxed">It opens full screen like an app and works best offline.</p>
          {isIOS ? (
            <p className="text-xs text-cyan-100/90 leading-relaxed">
              Tap <Share size={13} className="inline -mt-0.5 mx-0.5" /> <span className="font-bold">Share</span>, then <span className="font-bold">Add to Home Screen</span>.
            </p>
          ) : canPrompt ? (
            <button onClick={handleInstall} className="mt-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors active:scale-95">
              Install App
            </button>
          ) : (
            <p className="text-xs text-cyan-100/90 leading-relaxed">
              Open your browser menu <span className="font-bold">(⋮)</span>, then tap <span className="font-bold">Install app</span> or <span className="font-bold">Add to Home screen</span>.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default InstallTip;
