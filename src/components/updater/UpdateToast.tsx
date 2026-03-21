import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface UpdateInfo {
  version: string;
}

type UpdateStatus = 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'error';

export function UpdateToast() {
  const [status, setStatus] = useState<UpdateStatus>('idle');
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const api = window.electronAPI;
    if (!api?.updater) return;

    const handleCheckingForUpdate = () => {
      setStatus('checking');
      setDismissed(false);
    };

    const handleUpdateAvailable = (info: UpdateInfo) => {
      setStatus('available');
      setUpdateInfo(info);
      setDismissed(false);
    };

    const handleUpdateNotAvailable = () => {
      setStatus('idle');
    };

    const handleDownloadProgress = (progress: number) => {
      setStatus('downloading');
      setDownloadProgress(progress);
    };

    const handleUpdateDownloaded = () => {
      setStatus('downloaded');
      setDownloadProgress(100);
    };

    const handleError = (error: string) => {
      setStatus('error');
      setErrorMessage(error);
      console.error('[UpdateToast]', error);
    };

    const unsubs = [
      api.updater.onCheckingForUpdate(handleCheckingForUpdate),
      api.updater.onUpdateAvailable(handleUpdateAvailable),
      api.updater.onUpdateNotAvailable(handleUpdateNotAvailable),
      api.updater.onDownloadProgress(handleDownloadProgress),
      api.updater.onUpdateDownloaded(handleUpdateDownloaded),
      api.updater.onError(handleError),
    ];

    return () => {
      unsubs.forEach((u) => u());
    };
  }, []);

  const handleDownload = () => {
    window.electronAPI?.updater?.downloadUpdate();
  };

  const handleInstall = () => {
    window.electronAPI?.updater?.quitAndInstall();
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  if (dismissed || status === 'idle' || status === 'checking') {
    return null;
  }

  const title =
    status === 'available'
      ? 'Update available'
      : status === 'downloading'
        ? 'Downloading update'
        : status === 'downloaded'
          ? 'Ready to install'
          : status === 'error'
            ? 'Update failed'
            : '';

  const subtitle =
    status === 'available'
      ? `Version ${updateInfo?.version ?? ''} is ready`
      : status === 'downloading'
        ? `${Math.round(downloadProgress)}% complete`
        : status === 'downloaded'
          ? `Version ${updateInfo?.version ?? ''} downloaded`
          : status === 'error'
            ? (errorMessage?.slice(0, 80) ?? 'Something went wrong')
            : '';

  const showDownload = status === 'available';
  const showRestart = status === 'downloaded';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="fixed bottom-5 right-5 z-[9999] w-72 rounded-lg border p-4 shadow-lg"
        style={{
          backgroundColor: 'var(--note-bg)',
          borderColor: 'var(--note-border)',
          color: 'var(--note-title)',
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-sm font-medium" style={{ color: 'var(--note-title)' }}>
              {title}
            </p>
            <p className="text-xs" style={{ color: 'var(--note-text-muted)' }}>
              {subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="-mt-0.5 shrink-0 cursor-pointer transition-opacity hover:opacity-80"
            style={{ color: 'var(--note-control-muted)' }}
            aria-label="Dismiss"
          >
            <X size={15} strokeWidth={2} />
          </button>
        </div>

        {status === 'downloading' && (
          <div className="mt-3 h-1 overflow-hidden rounded-full" style={{ background: 'var(--note-control-bg-hover)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'var(--note-control-bg-active)' }}
              initial={{ width: 0 }}
              animate={{ width: `${downloadProgress}%` }}
              transition={{ duration: 0.2 }}
            />
          </div>
        )}

        {showDownload && (
          <button
            type="button"
            onClick={handleDownload}
            className="mt-3 cursor-pointer text-xs font-medium transition-opacity hover:opacity-80"
            style={{ color: 'var(--note-control)' }}
          >
            Download update
          </button>
        )}

        {showRestart && (
          <button
            type="button"
            onClick={handleInstall}
            className="mt-3 cursor-pointer text-xs font-medium transition-opacity hover:opacity-80"
            style={{ color: 'var(--note-control)' }}
          >
            Restart to install
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
