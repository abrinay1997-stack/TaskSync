import { Task } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportToPDF(tasks: Task[]) {
  if (tasks.length === 0) {
    alert("No hay tareas para exportar");
    return;
  }

  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text("Reporte de Productividad", 14, 22);
  
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generado el: ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}`, 14, 30);

  const pendingCount = tasks.filter(t => !t.completed).length;
  const completedCount = tasks.filter(t => t.completed).length;

  doc.text(`Total: ${tasks.length} | Pendientes: ${pendingCount} | Completadas: ${completedCount}`, 14, 38);

  const tableData = tasks.map(t => [
    t.title,
    t.priority ? t.priority.charAt(0).toUpperCase() + t.priority.slice(1) : '-',
    t.completed ? 'Completada' : 'Pendiente',
    new Date(t.dueDate).toLocaleDateString('es-ES') + ' ' + new Date(t.dueDate).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'}),
    t.description || '-'
  ]);

  autoTable(doc, {
    startY: 45,
    head: [['Tarea', 'Prioridad', 'Estado', 'Vencimiento', 'Descripción']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [147, 51, 234] }, // Purple-600
    styles: { font: 'helvetica', fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 20 },
      2: { cellWidth: 25 },
      3: { cellWidth: 35 },
      4: { cellWidth: 'auto' }
    }
  });

  doc.save(`reporte-productividad-${new Date().toISOString().split('T')[0]}.pdf`);
}

export function copyReportToClipboard(tasks: Task[]) {
  if (tasks.length === 0) {
    alert("No hay tareas para copiar");
    return;
  }

  const pendingCount = tasks.filter(t => !t.completed).length;
  const completedCount = tasks.filter(t => t.completed).length;

  let reportText = `📋 REPORTE DE PRODUCTIVIDAD\n`;
  reportText += `Fecha: ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}\n`;
  reportText += `Resumen: ${tasks.length} Tareas | ${pendingCount} Pendientes | ${completedCount} Completadas\n\n`;

  reportText += `🔴 PENDIENTES:\n`;
  const pending = tasks.filter(t => !t.completed);
  if (pending.length > 0) {
    pending.forEach(t => {
      const prio = t.priority ? `[${t.priority.toUpperCase()}] ` : '';
      reportText += `- [ ] ${prio}${t.title} (Vence: ${new Date(t.dueDate).toLocaleString('es-ES')})\n`;
    });
  } else {
    reportText += `¡No hay tareas pendientes!\n`;
  }

  reportText += `\n🟢 COMPLETADAS:\n`;
  const completed = tasks.filter(t => t.completed);
  if (completed.length > 0) {
    completed.forEach(t => {
      const prio = t.priority ? `[${t.priority.toUpperCase()}] ` : '';
      reportText += `- [x] ${prio}${t.title}\n`;
    });
  } else {
    reportText += `No hay tareas completadas aún.\n`;
  }

  navigator.clipboard.writeText(reportText).then(() => {
    alert("¡Informe copiado al portapapeles!");
  }).catch(err => {
    console.error("Error al copiar:", err);
    alert("No se pudo copiar el informe.");
  });
}
