import React, { useState, useEffect } from 'react';
import { api, formatAmount } from '../lib/apiService';
import { jsPDF } from 'jspdf';
import { FileText, Archive as ArchiveIcon, Search, Filter, Download } from 'lucide-react';

export default function Archives({ user }) {
  const [archives, setArchives] = useState([]);
  const [clients, setClients] = useState([]);
  const [settings, setSettings] = useState({});
  const [search, setSearch] = useState('');
  const [filterMonth, setFilterMonth] = useState('');

  useEffect(() => {
    const unsub = api.subscribeArchives(setArchives);
    api.subscribeClients(setClients); // Pour récupérer les vrais noms des clients
    api.getSettings().then(setSettings);
    return () => unsub();
  }, []);

  const generatePDF = (project) => {
    const doc = new jsPDF();
    const client = clients.find(c => c.id === project.clientId);
    const clientName = client ? client.name : (project.clientName || project.clientId || 'Client inconnu');

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text(settings.studioName || "STUDIO", 14, 20);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    if (settings.studioAddress) doc.text(settings.studioAddress, 14, 28);
    if (settings.studioEmail) doc.text(settings.studioEmail, 14, 33);
    if (settings.studioPhone) doc.text(settings.studioPhone, 14, 38);
    if (settings.studioSiret) doc.text(`SIRET: ${settings.studioSiret}`, 14, 43);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("FACTURE", 140, 20);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const prefix = settings.invoicePrefix || 'FAC';
    const num = `${prefix}-${(project.archivedAt || '').slice(0, 4)}-${project.id.slice(-4).toUpperCase()}`;
    doc.text(`N°: ${num}`, 140, 28);
    doc.text(`Date: ${project.archivedAt ? new Date(project.archivedAt).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR')}`, 140, 33);

    // Client Info
    doc.setDrawColor(0, 242, 255);
    doc.line(14, 55, 196, 55);
    
    doc.setFont("helvetica", "bold");
    doc.text("Facturé à:", 14, 65);
    doc.setFont("helvetica", "normal");
    doc.text(clientName, 14, 72);
    if (client && client.email) doc.text(client.email, 14, 77);
    
    // Project Details table
    doc.setFont("helvetica", "bold");
    doc.text("Détails de la prestation", 14, 95);
    
    doc.line(14, 100, 196, 100);
    doc.text("Description", 14, 107);
    doc.text("Quantité", 140, 107);
    doc.text("Total", 170, 107);
    doc.line(14, 111, 196, 111);
    
    doc.setFont("helvetica", "normal");
    doc.text(project.title || 'Prestation vidéo', 14, 120);
    doc.text("1", 145, 120);
    doc.text(formatAmount(project.price, project.currency), 170, 120);
    
    // Totals
    doc.line(120, 140, 196, 140);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("TOTAL NET :", 125, 150);
    doc.text(formatAmount(project.price, project.currency), 170, 150);
    
    // Footer
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.text(settings.invoiceFooter || "TVA non applicable, art. 293 B du CGI.", 14, 280);

    doc.save(`${prefix}_${project.title.replace(/\s+/g, '_')}.pdf`);
  };

  const filteredArchives = archives.filter(a => {
    const matchSearch = a.title?.toLowerCase().includes(search.toLowerCase()) || a.clientId?.toLowerCase().includes(search.toLowerCase());
    const matchMonth = filterMonth ? a.archivedAt?.startsWith(filterMonth) : true;
    return matchSearch && matchMonth;
  }).sort((a, b) => b.archivedAt?.localeCompare(a.archivedAt));

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <header className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <ArchiveIcon className="text-cyber-neon" size={28} /> Archives & <span className="text-cyber-neon">Factures</span>
          </h1>
          <p className="text-cyber-muted text-sm mt-1 uppercase tracking-widest">{archives.length} projets archivés</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-muted" size={16} />
            <input 
              type="text" 
              placeholder="Chercher une archive..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-black/50 border border-cyber-border text-white pl-9 pr-4 py-2 rounded-lg focus:border-cyber-neon outline-none text-sm"
            />
          </div>
          <input 
            type="month" 
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="bg-black/50 border border-cyber-border text-white px-3 py-2 rounded-lg focus:border-cyber-neon outline-none text-sm"
          />
        </div>
      </header>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-black/50 text-cyber-muted uppercase tracking-wider text-xs">
              <tr>
                <th className="p-4">Projet / Titre</th>
                <th className="p-4">Date de clôture</th>
                <th className="p-4">Client</th>
                <th className="p-4">Montant</th>
                <th className="p-4 text-right">Facture</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyber-border/30">
              {filteredArchives.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-cyber-muted">
                    <ArchiveIcon size={32} className="mx-auto mb-3 opacity-20" />
                    Aucune archive trouvée.
                  </td>
                </tr>
              ) : filteredArchives.map(a => {
                const client = clients.find(c => c.id === a.clientId);
                return (
                  <tr key={a.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-4">
                      <p className="font-bold text-white truncate max-w-[250px]">{a.title}</p>
                      {a.payment_status && <p className="text-[10px] text-green-400 mt-1 uppercase tracking-widest">{a.payment_status}</p>}
                    </td>
                    <td className="p-4 text-cyber-muted">
                      {a.archivedAt ? new Date(a.archivedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="p-4 text-cyber-muted">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 text-xs font-bold border border-purple-500/20">
                          {client ? client.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        {client ? client.name : a.clientId}
                      </div>
                    </td>
                    <td className="p-4 text-cyber-neon font-mono font-bold">
                      {formatAmount(a.price, a.currency)}
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => generatePDF(a)}
                        className="neon-button-secondary text-xs flex items-center gap-2 ml-auto py-1.5 px-3 opacity-60 group-hover:opacity-100 transition-opacity"
                        title="Télécharger la facture"
                      >
                        <Download size={14} /> PDF
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
