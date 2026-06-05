if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch(error => {
        console.warn('Service Worker registration failed:', error);
      });
  });
}

let deferredPrompt;
const showInstallPrompt = () => {
  const installButton = document.createElement('button');
  installButton.textContent = 'Install FinTrack';
  installButton.style.position = 'fixed';
  installButton.style.bottom = '1rem';
  installButton.style.right = '1rem';
  installButton.style.padding = '0.85rem 1rem';
  installButton.style.border = 'none';
  installButton.style.borderRadius = '999px';
  installButton.style.background = '#4F46E5';
  installButton.style.color = '#fff';
  installButton.style.fontWeight = '700';
  installButton.style.boxShadow = '0 10px 25px rgba(79, 70, 229, 0.2)';
  installButton.style.cursor = 'pointer';
  installButton.style.zIndex = '9999';

  installButton.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
      installButton.remove();
    }
    deferredPrompt = null;
  });

  document.body.appendChild(installButton);
};

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  deferredPrompt = event;
  showInstallPrompt();
});

window.addEventListener('appinstalled', () => {
  console.log('FinTrack installed successfully');
});
