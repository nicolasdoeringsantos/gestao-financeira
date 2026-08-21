export const formatBRL = (value) => {
  const num = Number(value) || 0;
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export const formatNumber = (value, decimals = 0) => {
  const num = Number(value) || 0;
  return num.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export const formatPercent = (value, decimals = 1) => {
  const num = Number(value) || 0;
  return `${num.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}%`;
};

export const formatDateBR = (dateStr) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr;
  return `${day}/${month}/${year}`;
};

export const downloadCSV = (filename, rows) => {
  const processRow = (row) =>
    row
      .map((val) => {
        let text = val === null || val === undefined ? '' : String(val);
        if (text.includes('"') || text.includes(',') || text.includes(';') || text.includes('\n')) {
          text = `"${text.replace(/"/g, '""')}"`;
        }
        return text;
      })
      .join(';');

  const csvContent = '\uFEFF' + rows.map(processRow).join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const monthNames = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

export const monthNamesFull = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export const chartPalette = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#6366f1', // indigo
];
