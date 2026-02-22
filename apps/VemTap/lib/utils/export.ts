/**
 * Utility to export JSON data to CSV and trigger a download in the browser.
 */

export const exportToCSV = (data: any[], filename: string, headers?: string[]) => {
  if (!data || !data.length) {
    console.error('No data provided for export');
    return;
  }

  // Use keys from the first object as headers if not provided
  const actualHeaders = headers || Object.keys(data[0]);
  
  const csvRows = [];
  
  // Add Header Row
  csvRows.push(actualHeaders.join(','));
  
  // Add Data Rows
  for (const row of data) {
    const values = actualHeaders.map(header => {
      const val = row[header];
      // Handle values with commas by wrapping in quotes
      const escaped = ('' + (val ?? '')).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }
  
  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  if (link.download !== undefined) {
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
