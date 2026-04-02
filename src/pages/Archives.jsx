import React, { useState, useEffect } from 'react';
import { api, formatAmount } from '../lib/apiService';
import { jsPDF } from 'jspdf';
import { FileText, Archive as ArchiveIcon } from 'lucide-react';

export default function Archives({ user }) {
  const [archives, setArchives] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setArchives(await api.getArchives());
  };

  const generatePDF = (project) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("FLOW_OS STUDIOS", 14, 20);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("14 Cyber Street, Neo City", 14, 28);
    doc.text("VAT: FR80000000000 | SIRET: 42424242400010", 14, 33);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("FACTURE / INVOICE", 140, 20);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Facture N°: INV-${project.id}-${new Date().getTime().toString().slice(-4)}`, 140, 28);
    doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 140, 33);

    // Client Info
    doc.setDrawColor(0, 242, 255);
    doc.line(14, 45, 196, 45); // Line
    
    doc.setFont("helvetica", "bold");
    doc.text("Client Information:", 14, 55);
    doc.setFont("helvetica", "normal");
    doc.text(`Ref Client ID: ${project.clientId}`, 14, 62);
    
    // Project Details table-like
    doc.setFont("helvetica", "bold");
    doc.text("Détails de la prestation", 14, 80);
    
    doc.line(14, 85, 196, 85);
    doc.text("Description", 14, 92);
    doc.text("Quantité", 140, 92);
    doc.text("Total HT", 170, 92);
    doc.line(14, 96, 196, 96);
    
    doc.setFont("helvetica", "normal");
    doc.text(project.title, 14, 105);
    doc.text("1", 145, 105);
    
    const priceHT = project.price / 1.20;
    const tva = project.price - priceHT;
    
    doc.text(formatAmount(priceHT, project.currency), 170, 105);
    
    // Totals
    doc.line(120, 130, 196, 130);
    doc.text("Sous-total HT :", 125, 138);
    doc.text(formatAmount(priceHT, project.currency), 170, 138);
    
    doc.text("TVA (20%) :", 125, 145);
    doc.text(formatAmount(tva, project.currency), 170, 145);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("TOTAL TTC :", 125, 155);
    doc.text(formatAmount(project.price, project.currency), 170, 155);
    
    // Footer
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.text("En votre aimable règlement sous 15 jours à réception.", 14, 180);
    doc.text("Pénalités de retard : 3 fois le taux d'intérêt légal. Indemnité forfaitaire de 40€.", 14, 185);

    doc.save(`Facture_FLOW_OS_${project.title.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h1 className="text-3xl font-bold text-cyber-text">Project <span className="text-cyber-neon">Archives</span></h1>
        <p className="text-cyber-muted tracking-widest mt-1 text-sm uppercase">History & Invoicing</p>
      </header>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-black/50 text-cyber-muted uppercase tracking-wider text-xs">
            <tr>
              <th className="p-4 rounded-tl-xl">Projet</th>
              <th className="p-4">Date</th>
              <th className="p-4">Client</th>
              <th className="p-4">Montant TTC</th>
              <th className="p-4 rounded-tr-xl text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cyber-border/30">
            {archives.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-cyber-muted">Aucune archive disponible.</td>
              </tr>
            ) : archives.map(a => (
              <tr key={a.id} className="hover:bg-white/5 transition-colors">
                <td className="p-4 font-bold text-white">{a.title}</td>
                <td className="p-4 text-cyber-muted">{a.archivedAt ? new Date(a.archivedAt).toLocaleDateString() : 'N/A'}</td>
                <td className="p-4 text-cyber-muted">{a.clientId}</td>
                <td className="p-4 text-cyber-neon font-mono">{formatAmount(a.price, a.currency)}</td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => generatePDF(a)}
                    className="neon-button-secondary text-xs flex items-center gap-2 ml-auto"
                  >
                    <FileText size={14} /> PDF_
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
