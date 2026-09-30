import React, { useState } from 'react';
import { X, Download, Copy, Check, Upload, FileText, AlertCircle } from 'lucide-react';
import { Character } from '../types/morkborg';

interface ExportImportModalProps {
  isOpen: boolean;
  mode: 'export' | 'import';
  character: Character;
  onClose: () => void;
  onImportCharacter: (character: Character) => void;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  mode,
  character,
  onClose,
  onImportCharacter,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>(mode);
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync tab with mode prop when opened
  React.useEffect(() => {
    setActiveTab(mode);
    setErrorMessage(null);
    setCopied(false);
  }, [mode, isOpen]);

  if (!isOpen) return null;

  const jsonString = JSON.stringify(character, null, 2);

  const handleDownload = () => {
    try {
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${character.name || 'mork_borg_scum'}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.warn('File download blocked by environment, copying to clipboard instead', err);
      handleCopy();
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select textarea
      const el = document.getElementById('export-json-textarea') as HTMLTextAreaElement;
      if (el) {
        el.select();
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setImportText(content);
        validateAndImport(content);
      };
      reader.readAsText(file);
    }
  };

  const validateAndImport = (rawJson: string) => {
    try {
      setErrorMessage(null);
      const parsed = JSON.parse(rawJson);
      if (!parsed || typeof parsed !== 'object' || !parsed.abilities) {
        setErrorMessage('Invalid MÖRK BORG character format. Must contain abilities.');
        return;
      }
      onImportCharacter(parsed as Character);
      onClose();
    } catch {
      setErrorMessage('Could not parse JSON. Please verify the format.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-mb-black border-4 border-mb-yellow shadow-brutal p-5 text-mb-white flex flex-col max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-mb-white/60 hover:text-mb-yellow p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tab Header */}
        <div className="flex items-center gap-2 border-b-2 border-mb-charcoal pb-3 mb-3">
          <button
            onClick={() => { setActiveTab('export'); setErrorMessage(null); }}
            className={`font-gothic text-xl px-3 py-1 border-b-2 transition-all ${
              activeTab === 'export'
                ? 'border-mb-yellow text-mb-yellow font-black'
                : 'border-transparent text-mb-white/60 hover:text-mb-white'
            }`}
          >
            Export Character
          </button>
          <button
            onClick={() => { setActiveTab('import'); setErrorMessage(null); }}
            className={`font-gothic text-xl px-3 py-1 border-b-2 transition-all ${
              activeTab === 'import'
                ? 'border-mb-pink text-mb-pink font-black'
                : 'border-transparent text-mb-white/60 hover:text-mb-white'
            }`}
          >
            Import Character
          </button>
        </div>

        {/* EXPORT TAB */}
        {activeTab === 'export' && (
          <div className="flex-1 flex flex-col min-h-0">
            <p className="font-punk text-xs text-mb-white/70 mb-2">
              Save your character sheet data. You can download the JSON file or copy it directly to your clipboard.
            </p>

            <textarea
              id="export-json-textarea"
              readOnly
              value={jsonString}
              className="flex-1 min-h-[220px] bg-mb-dark text-mb-yellow font-mono text-[11px] p-2 border border-mb-charcoal focus:outline-none select-all resize-none mb-3"
            />

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleDownload}
                className="flex-1 mb-btn mb-btn-yellow text-xs py-2 flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>DOWNLOAD .JSON FILE</span>
              </button>

              <button
                onClick={handleCopy}
                className="flex-1 mb-btn mb-btn-dark text-xs py-2 flex items-center justify-center gap-1.5"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'COPIED TO CLIPBOARD!' : 'COPY TO CLIPBOARD'}</span>
              </button>
            </div>
          </div>
        )}

        {/* IMPORT TAB */}
        {activeTab === 'import' && (
          <div className="flex-1 flex flex-col min-h-0">
            <p className="font-punk text-xs text-mb-white/70 mb-2">
              Paste character JSON below, or select a .json file from your computer.
            </p>

            {errorMessage && (
              <div className="mb-2 p-2 bg-mb-pink/20 border border-mb-pink text-mb-pink text-xs flex items-center gap-1.5 font-bold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <textarea
              placeholder="Paste MÖRK BORG character JSON here..."
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className="flex-1 min-h-[200px] bg-mb-dark text-mb-white font-mono text-[11px] p-2 border border-mb-charcoal focus:outline-none focus:border-mb-pink resize-none mb-3"
            />

            <div className="flex flex-wrap items-center gap-2">
              <label className="flex-1 mb-btn mb-btn-dark text-xs py-2 flex items-center justify-center gap-1.5 cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>SELECT .JSON FILE</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <button
                onClick={() => validateAndImport(importText)}
                disabled={!importText.trim()}
                className="flex-1 mb-btn mb-btn-pink text-xs py-2 flex items-center justify-center gap-1.5 disabled:opacity-40"
              >
                <FileText className="w-4 h-4" />
                <span>LOAD CHARACTER</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
