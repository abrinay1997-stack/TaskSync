import { Task, Account } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Client production report (stage 5 of the agency workflow): tasks for one
 * account within a date range, with a summary block and a detailed table.
 */
export function exportClientReport(
  tasks: Task[],
  account: Account,
  from: string,
  to: string
) {
  const fromDate = new Date(`${from}T00:00`);
  const toDate = new Date(`${to}T23:59:59`);

  const inRange = tasks.filter((t) => {
    if (t.accountId !== account.id) return false;
    const due = new Date(t.dueDate);
    return due >= fromDate && due <= toDate;
  }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  if (inRange.length === 0) {
    alert('No hay tareas de esta cuenta en el rango de fechas elegido.');
    return;
  }

  const completed = inRange.filter((t) => t.completed);
  const pending = inRange.filter((t) => !t.completed);
  const onTime = completed.length; // completion timestamps aren't tracked; completed = delivered

  const doc = new jsPDF();

  doc.setFillColor(20, 16, 41);
  doc.rect(0, 0, 210, 34, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text('Informe de Producción', 14, 15);
  doc.setFontSize(12);
  doc.setTextColor(208, 188, 255);
  doc.text(`Cliente: ${account.name}`, 14, 24);
  doc.setFontSize(9);
  doc.setTextColor(180, 180, 200);
  doc.text(
    `Período: ${fromDate.toLocaleDateString('es-ES')} — ${toDate.toLocaleDateString('es-ES')}  ·  Generado: ${new Date().toLocaleDateString('es-ES')}`,
    14,
    30
  );

  doc.setTextColor(60);
  doc.setFontSize(11);
  doc.text(
    `Resumen: ${inRange.length} tareas en el período  |  ${completed.length} completadas  |  ${pending.length} pendientes  |  ${onTime} entregadas`,
    14,
    44
  );

  const tableData = inRange.map((t) => [
    new Date(t.dueDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
    t.title,
    (t.platforms || []).join(', ') || '-',
    t.priority ? t.priority.charAt(0).toUpperCase() + t.priority.slice(1) : '-',
    t.completed ? 'Completada' : 'Pendiente',
  ]);

  autoTable(doc, {
    startY: 52,
    head: [['Fecha', 'Tarea', 'Plataformas', 'Prioridad', 'Estado']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [139, 92, 246] },
    styles: { font: 'helvetica', fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 40 },
      3: { cellWidth: 22 },
      4: { cellWidth: 26 },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 4) {
        data.cell.styles.textColor = data.cell.raw === 'Completada' ? [22, 130, 93] : [180, 83, 9];
      }
    },
  });

  const safeName = account.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  doc.save(`informe-${safeName}-${from}-a-${to}.pdf`);
}

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
