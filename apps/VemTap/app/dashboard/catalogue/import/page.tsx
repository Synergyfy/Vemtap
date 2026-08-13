"use client";

import React, { useState, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
    UploadCloud, FileSpreadsheet, AlertCircle, CheckCircle2, ArrowLeft, ArrowRight, Download,
    Database, Loader2, X, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PageGuideButton, AICopilotButton } from '@/components/ai';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useBulkImportItems } from '@/services/catalogue/hooks';
import toast from 'react-hot-toast';

interface ImportField {
    key: 'name' | 'price' | 'shortDescription' | 'description' | 'category' | 'stockQuantity' | 'sku' | 'barcode';
    label: string;
    required: boolean;
}

const IMPORT_FIELDS: ImportField[] = [
    { key: 'name', label: 'Product Name', required: true },
    { key: 'price', label: 'Price', required: true },
    { key: 'shortDescription', label: 'Short Description', required: false },
    { key: 'description', label: 'Description', required: false },
    { key: 'category', label: 'Category', required: false },
    { key: 'stockQuantity', label: 'Stock Quantity', required: false },
    { key: 'sku', label: 'SKU', required: false },
    { key: 'barcode', label: 'Barcode', required: false },
];

const FIELD_ALIASES: Record<string, string[]> = {
    name: ['name', 'product', 'productname', 'product name', 'title', 'item'],
    price: ['price', 'amount', 'cost', 'sellingprice', 'selling price'],
    shortDescription: ['shortdescription', 'short description', 'brief', 'tagline'],
    description: ['description', 'details', 'longdescription', 'long description', 'full description'],
    category: ['category', 'categories', 'type', 'department'],
    stockQuantity: ['stockquantity', 'stock quantity', 'stock', 'quantity', 'qty', 'units'],
    sku: ['sku', 'skucode', 'sku code', 'code'],
    barcode: ['barcode', 'ean', 'upc', 'barcodenumber'],
};

function normalizeHeader(value: string): string {
    return value.trim().toLowerCase().replace(/\s+/g, ' ').replace(/[_-]+/g, ' ');
}

function parseCSV(text: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let field = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (inQuotes) {
            if (ch === '"') {
                if (text[i + 1] === '"') {
                    field += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                field += ch;
            }
        } else if (ch === '"') {
            inQuotes = true;
        } else if (ch === ',') {
            row.push(field);
            field = '';
        } else if (ch === '\n' || ch === '\r') {
            if (ch === '\r' && text[i + 1] === '\n') i++;
            row.push(field);
            field = '';
            if (row.some((c) => c.trim() !== '')) rows.push(row);
            row = [];
        } else {
            field += ch;
        }
    }
    row.push(field);
    if (row.some((c) => c.trim() !== '')) rows.push(row);
    return rows;
}

interface ParsedData {
    headers: string[];
    rawRows: string[][];
    dataRows: string[][];
    valid: number;
    invalid: number;
    errors: { row: number; message: string }[];
}

function validateRows(headers: string[], dataRows: string[][], mapping: Record<string, number>): { valid: number; invalid: number; errors: { row: number; message: string }[] } {
    const errors: { row: number; message: string }[] = [];
    let valid = 0;
    let invalid = 0;

    dataRows.forEach((row, idx) => {
        const fileRow = idx + 2;
        const nameIdx = mapping.name;
        const priceIdx = mapping.price;
        const name = nameIdx >= 0 ? (row[nameIdx] || '').trim() : '';
        const priceRaw = priceIdx >= 0 ? (row[priceIdx] || '').trim() : '';

        if (!name) {
            errors.push({ row: fileRow, message: 'Missing product name' });
            invalid++;
            return;
        }
        if (priceRaw === '' || isNaN(Number(priceRaw)) || Number(priceRaw) < 0) {
            errors.push({ row: fileRow, message: `Invalid price "${priceRaw}"` });
            invalid++;
            return;
        }
        valid++;
    });

    return { valid, invalid, errors };
}

export default function ConfigureBulkImportPage() {
    const [step, setStep] = useState(1);
    const [isHoveringDropzone, setIsHoveringDropzone] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { activeBranchId } = useActiveBranch();
    const bulkImport = useBulkImportItems();

    const [fileName, setFileName] = useState('');
    const [headers, setHeaders] = useState<string[]>([]);
    const [dataRows, setDataRows] = useState<string[][]>([]);
    const [mapping, setMapping] = useState<Record<string, number>>({});
    const [previewError, setPreviewError] = useState('');

    const parsed = useMemo<ParsedData | null>(() => {
        if (headers.length === 0 || dataRows.length === 0) return null;
        const { valid, invalid, errors } = validateRows(headers, dataRows, mapping);
        return { headers, rawRows: dataRows, dataRows, valid, invalid, errors };
    }, [headers, dataRows, mapping]);

    const handleDownloadTemplate = () => {
        const csvContent = "Name,Price,Short Description,Description,Category,Stock Quantity,SKU,Barcode\nExample Product,99.99,A short description,A much longer description of the product.,Electronics,50,EXMP-001,1234567890123";
        const encodedUri = encodeURI("data:text/csv;charset=utf-8,\ufeff" + csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "vemtap_catalogue_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Template downloaded');
    };

    const handleFile = (file: File) => {
        setPreviewError('');
        if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
            setPreviewError('Excel files are not supported yet. Please export your sheet as CSV (File > Save As > CSV) and upload that.');
            return;
        }
        if (!file.name.toLowerCase().endsWith('.csv') && !file.type.includes('csv')) {
            setPreviewError('Unsupported file type. Please upload a CSV file.');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = String(e.target?.result || '');
            const rows = parseCSV(text);
            if (rows.length < 2) {
                setPreviewError('The file appears to be empty or missing a header row.');
                return;
            }
            const headerRow = rows[0];
            const dataRowsOnly = rows.slice(1);
            setFileName(file.name);
            setHeaders(headerRow);
            setDataRows(dataRowsOnly);
            const autoMapping: Record<string, number> = {};
            IMPORT_FIELDS.forEach((field) => {
                const aliasSet = FIELD_ALIASES[field.key];
                let matchIdx = -1;
                headerRow.forEach((header, idx) => {
                    if (matchIdx >= 0) return;
                    const normalized = normalizeHeader(header);
                    if (normalized === field.label.toLowerCase()) {
                        matchIdx = idx;
                    } else if (aliasSet.includes(normalized)) {
                        matchIdx = idx;
                    }
                });
                autoMapping[field.key] = matchIdx;
            });
            setMapping(autoMapping);
            setStep(2);
        };
        reader.onerror = () => {
            setPreviewError('Could not read the file. Please try again.');
        };
        reader.readAsText(file);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    const setMappingField = (key: string, value: string) => {
        setMapping((prev) => ({ ...prev, [key]: value === '' ? -1 : Number(value) }));
    };

    const buildItems = () => {
        if (!parsed) return [];
        const items: Array<{ name: string; price: number; shortDescription?: string; description?: string; category?: string; stockQuantity?: number; sku?: string; barcode?: string }> = [];
        parsed.dataRows.forEach((row, idx) => {
            const get = (key: string) => {
                const colIdx = mapping[key];
                return colIdx >= 0 ? (row[colIdx] || '').trim() : '';
            };
            const name = get('name');
            const priceRaw = get('price');
            if (!name || priceRaw === '' || isNaN(Number(priceRaw))) return;
            const item: typeof items[number] = {
                name,
                price: Number(priceRaw),
            };
            const shortDescription = get('shortDescription');
            if (shortDescription) item.shortDescription = shortDescription;
            const description = get('description');
            if (description) item.description = description;
            const category = get('category');
            if (category) item.category = category;
            const stockQuantity = get('stockQuantity');
            if (stockQuantity !== '' && !isNaN(Number(stockQuantity)) && Number(stockQuantity) >= 0) item.stockQuantity = Number(stockQuantity);
            const sku = get('sku');
            if (sku) item.sku = sku;
            const barcode = get('barcode');
            if (barcode) item.barcode = barcode;
            items.push(item);
        });
        return items;
    };

    const startImport = () => {
        if (!activeBranchId) {
            toast.error('No active branch selected. Please select a branch first.');
            return;
        }
        const items = buildItems();
        if (items.length === 0) {
            toast.error('No valid rows to import.');
            return;
        }
        bulkImport.mutate({ branchId: activeBranchId, items }, {
            onSuccess: () => toast.success(`Imported ${items.length} item${items.length === 1 ? '' : 's'}`),
            onError: (error: any) => toast.error(error instanceof Error ? error.message : 'Import failed. Please try again.'),
        });
    };

    const resetAll = () => {
        setStep(1);
        setFileName('');
        setHeaders([]);
        setDataRows([]);
        setMapping({});
        setPreviewError('');
        bulkImport.reset();
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const mappedCount = IMPORT_FIELDS.filter((f) => f.required && (mapping[f.key] ?? -1) >= 0).length;
    const requiredFieldsMapped = IMPORT_FIELDS.filter((f) => f.required).every((f) => (mapping[f.key] ?? -1) >= 0);

    const importResult = bulkImport.data;
    const canContinue = (step === 1 && parsed !== null) || (step === 2 && requiredFieldsMapped);

    return (
        <div className="min-h-screen bg-gray-50/30 pb-24 md:pb-10 max-w-5xl mx-auto p-4 md:p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-12">
                <Link href="/dashboard/catalogue">
                    <Button variant="ghost" size="icon" className="size-10 rounded-xl bg-white border border-gray-100 hover:bg-gray-50 shadow-sm transition-all hover:-translate-x-1">
                        <ArrowLeft size={20} className="text-gray-400" />
                    </Button>
                </Link>
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 leading-none mb-2">Catalogue Manager</p>
                    <div className="flex items-center gap-2"><h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight leading-none">Bulk Import Wizard</h1><PageGuideButton /><AICopilotButton /></div>
                </div>
            </div>

            {/* Stepper */}
            <div className="flex items-center justify-between mb-12 relative px-4">
                <div className="absolute top-1/2 left-8 right-8 h-1 bg-gray-100 -translate-y-1/2 z-0 rounded-full" />
                <div 
                    className="absolute top-1/2 left-8 h-1 bg-[#066CF4] -translate-y-1/2 z-0 rounded-full transition-all duration-500" 
                    style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
                />
                
                {[
                    { num: 1, label: 'Upload File' },
                    { num: 2, label: 'Map Columns' },
                    { num: 3, label: 'Review & Import' }
                ].map((s) => (
                    <div key={s.num} className="relative z-10 flex flex-col items-center gap-3">
                        <div className={`size-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                            step >= s.num ? 'bg-[#066CF4] text-white shadow-md shadow-blue-500/30' : 'bg-white text-gray-300 border-2 border-gray-100'
                        }`}>
                            {step > s.num ? <CheckCircle2 size={16} /> : s.num}
                        </div>
                        <span className={`text-[10px] font-semibold uppercase tracking-wider ${step >= s.num ? 'text-gray-900' : 'text-gray-400'}`}>
                            {s.label}
                        </span>
                    </div>
                ))}
            </div>

            {/* Content Area */}
            <motion.div 
                key={step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
                {step === 1 && (
                    <div className="p-8 md:p-12 text-center">
                        <div className="size-14 md:size-16 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-6">
                            <FileSpreadsheet size={28} />
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight mb-3">Upload your catalogue data</h2>
                        <p className="text-sm font-medium text-gray-500 max-w-md mx-auto mb-8 leading-relaxed">
                            Upload a CSV file containing your products or services. Need help formatting? 
                            <button onClick={handleDownloadTemplate} className="text-[#066CF4] hover:underline ml-1 font-semibold">Download our template.</button>
                        </p>

                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            onDragEnter={() => setIsHoveringDropzone(true)}
                            onDragLeave={() => setIsHoveringDropzone(false)}
                            onDrop={(e) => {
                                e.preventDefault();
                                setIsHoveringDropzone(false);
                                const file = e.dataTransfer.files?.[0];
                                if (file) handleFile(file);
                            }}
                            onDragOver={(e) => e.preventDefault()}
                            className={`border-2 border-dashed rounded-2xl p-8 transition-all duration-300 max-w-2xl mx-auto cursor-pointer ${
                                isHoveringDropzone ? 'border-[#066CF4] bg-blue-50/50 scale-[0.98]' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                            }`}
                        >
                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv, text/csv" className="hidden" />
                            <UploadCloud size={40} className={`mx-auto mb-4 ${isHoveringDropzone ? 'text-[#066CF4] animate-bounce' : 'text-gray-400'}`} />
                            <h3 className="text-lg font-bold text-gray-900 mb-1">Drag and drop your file here</h3>
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-6">or click to browse (CSV only)</p>
                            <Button type="button" onClick={() => fileInputRef.current?.click()} className="h-10 px-6 rounded-xl bg-gray-900 text-white font-semibold text-xs uppercase tracking-wider">
                                Select File
                            </Button>
                        </div>

                        {previewError && (
                            <div className="mt-6 max-w-xl mx-auto flex items-center justify-center gap-2 text-sm font-semibold text-red-500 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
                                <AlertCircle size={16} />
                                {previewError}
                            </div>
                        )}
                    </div>
                )}

                {step === 2 && parsed && (
                    <div className="p-8 md:p-12">
                        <div className="flex items-start justify-between mb-8">
                            <div>
                                <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight mb-2">Map your columns</h2>
                                <p className="text-sm font-medium text-gray-500">Match your file columns to the standard fields in VemTap.</p>
                            </div>
                            <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5">
                                <FileText size={16} className="text-blue-500" />
                                <span className="text-xs font-semibold text-blue-700">{fileName}</span>
                            </div>
                        </div>

                        <div className="space-y-4 max-w-3xl mx-auto">
                            {IMPORT_FIELDS.map((field) => (
                                <div key={field.key} className="flex items-center gap-6 p-4 rounded-xl bg-gray-50 border border-gray-100">
                                    <div className="w-1/3 text-sm font-bold text-gray-900">
                                        {field.label} {field.required && <span className="text-red-500">*</span>}
                                    </div>
                                    <ArrowRight size={16} className="text-gray-300 shrink-0" />
                                    <select
                                        value={mapping[field.key] ?? -1}
                                        onChange={(e) => setMappingField(field.key, e.target.value)}
                                        className={`flex-1 h-10 px-4 rounded-xl border-none ring-1 focus:ring-2 focus:ring-[#066CF4] text-sm font-medium bg-white appearance-none cursor-pointer ${
                                            (mapping[field.key] ?? -1) >= 0 ? 'text-gray-900 ring-gray-200' : 'text-red-400 ring-red-200'
                                        }`}
                                    >
                                        <option value={-1}>{field.required ? 'Select a column (required)...' : 'Not in file (skip)...'}</option>
                                        {parsed.headers.map((header, idx) => (
                                            <option key={idx} value={idx}>{header}</option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>

                        {!requiredFieldsMapped && (
                            <p className="text-xs font-semibold text-amber-600 text-center mt-6">
                                {mappedCount}/{IMPORT_FIELDS.filter((f) => f.required).length} required columns mapped. Select the column for each required field to continue.
                            </p>
                        )}
                    </div>
                )}

                {step === 3 && parsed && (
                    <div className="p-8 md:p-12">
                        {!importResult && !bulkImport.isPending && (
                            <>
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="size-12 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                                        <Database size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">Ready to Import</h2>
                                        <p className="text-sm font-medium text-gray-500">{fileName}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-center gap-12 bg-gray-50 rounded-xl p-8 max-w-lg mx-auto mb-8 border border-gray-100">
                                    <div>
                                        <div className="text-2xl md:text-3xl font-bold text-gray-900">{parsed.valid}</div>
                                        <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mt-1">Valid Rows</div>
                                    </div>
                                    <div className="w-px h-12 bg-gray-200" />
                                    <div>
                                        <div className={`text-2xl md:text-3xl font-bold ${parsed.invalid > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{parsed.invalid}</div>
                                        <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mt-1">Errors</div>
                                    </div>
                                </div>

                                {parsed.invalid > 0 && (
                                    <div className="max-w-lg mx-auto mb-8 bg-red-50 border border-red-100 rounded-xl p-4">
                                        <p className="text-xs font-semibold uppercase tracking-wider text-red-500 mb-2">Rows with errors (will be skipped)</p>
                                        <div className="max-h-40 overflow-y-auto space-y-1">
                                            {parsed.errors.map((err, i) => (
                                                <p key={i} className="text-xs font-medium text-red-600">Row {err.row}: {err.message}</p>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="max-w-3xl mx-auto overflow-x-auto rounded-xl border border-gray-100">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="bg-gray-50 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                                                <th className="px-4 py-3">Row</th>
                                                <th className="px-4 py-3">Name</th>
                                                <th className="px-4 py-3">Price</th>
                                                <th className="px-4 py-3">Category</th>
                                                <th className="px-4 py-3">Stock</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {buildItems().slice(0, 5).map((item, i) => (
                                                <tr key={i} className="border-t border-gray-100">
                                                    <td className="px-4 py-3 text-gray-400 font-bold">{i + 2}</td>
                                                    <td className="px-4 py-3 font-semibold text-gray-900">{item.name}</td>
                                                    <td className="px-4 py-3 font-bold text-gray-900">₦{item.price.toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-gray-500">{item.category || '—'}</td>
                                                    <td className="px-4 py-3 text-gray-500">{item.stockQuantity ?? '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {parsed.valid > 5 && (
                                        <p className="text-xs text-gray-400 text-center py-3 border-t border-gray-100">
                                            +{parsed.valid - 5} more valid rows
                                        </p>
                                    )}
                                </div>
                            </>
                        )}

                        {bulkImport.isPending && (
                            <div className="py-16 text-center">
                                <Loader2 size={40} className="animate-spin text-[#066CF4] mx-auto mb-6" />
                                <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight mb-2">Importing your catalogue...</h2>
                                <p className="text-sm font-medium text-gray-500">This usually takes a few seconds.</p>
                            </div>
                        )}

                        {importResult && (
                            <>
                                <div className={`size-14 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ${
                                    importResult.failed === 0 ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'
                                }`}>
                                    {importResult.failed === 0 ? <CheckCircle2 size={28} /> : <AlertCircle size={28} />}
                                </div>
                                <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight text-center mb-2">
                                    {importResult.failed === 0 ? 'Import Complete!' : `Imported with ${importResult.failed} error${importResult.failed === 1 ? '' : 's'}`}
                                </h2>
                                <p className="text-sm font-medium text-gray-500 text-center max-w-md mx-auto mb-8">
                                    {importResult.created} item{importResult.created === 1 ? '' : 's'} added to your catalogue.
                                </p>

                                <div className="flex items-center justify-center gap-12 bg-gray-50 rounded-xl p-8 max-w-lg mx-auto border border-gray-100 mb-8">
                                    <div>
                                        <div className="text-2xl md:text-3xl font-bold text-emerald-500">{importResult.created}</div>
                                        <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mt-1">Created</div>
                                    </div>
                                    <div className="w-px h-12 bg-gray-200" />
                                    <div>
                                        <div className="text-2xl md:text-3xl font-bold text-red-500">{importResult.failed}</div>
                                        <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mt-1">Failed</div>
                                    </div>
                                </div>

                                {importResult.results.filter((r) => !r.success).length > 0 && (
                                    <div className="max-w-lg mx-auto bg-red-50 border border-red-100 rounded-xl p-4 mb-8">
                                        <p className="text-xs font-semibold uppercase tracking-wider text-red-500 mb-2">Failed rows</p>
                                        <div className="max-h-40 overflow-y-auto space-y-1">
                                            {importResult.results.filter((r) => !r.success).slice(0, 20).map((r, i) => (
                                                <p key={i} className="text-xs font-medium text-red-600">Row {r.row}: {r.error || 'Unknown error'}</p>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center justify-center gap-4">
                                    <Button onClick={resetAll} variant="outline" className="h-10 px-5 rounded-xl font-semibold text-xs uppercase tracking-wider text-gray-600">
                                        Import Another File
                                    </Button>
                                    <Link href="/dashboard/catalogue">
                                        <Button className="h-10 px-5 rounded-xl font-semibold text-xs uppercase tracking-wider bg-[#066CF4] hover:bg-[#4293FF] text-white shadow-sm shadow-blue-500/20">
                                            View Catalogue
                                        </Button>
                                    </Link>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Footer Actions */}
                <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <Button 
                        variant="ghost" 
                        onClick={() => {
                            if (step === 1) return;
                            if (step === 3 && (importResult || bulkImport.isPending)) return;
                            setStep(step - 1);
                        }}
                        disabled={step === 1 || (step === 3 && (!!importResult || bulkImport.isPending))}
                        className="font-semibold text-xs uppercase tracking-wider text-gray-500 disabled:opacity-50"
                    >
                        <X size={14} className="mr-1" /> Back
                    </Button>
                    {step < 3 && (
                        <Button 
                            onClick={() => {
                                if (step === 1) {
                                    if (!parsed) {
                                        toast.error('Upload a CSV file first');
                                        return;
                                    }
                                    setStep(2);
                                } else if (step === 2) {
                                    setStep(3);
                                }
                            }}
                            disabled={!canContinue}
                            className="h-10 px-5 rounded-xl font-semibold text-xs uppercase tracking-wider text-white bg-[#066CF4] hover:bg-[#4293FF] shadow-sm shadow-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Continue
                        </Button>
                    )}
                    {step === 3 && !importResult && !bulkImport.isPending && (
                        <Button 
                            onClick={startImport}
                            disabled={(parsed?.valid ?? 0) === 0}
                            className="h-10 px-5 rounded-xl font-semibold text-xs uppercase tracking-wider text-white bg-emerald-500 hover:bg-emerald-600 shadow-sm shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Start Import ({parsed?.valid ?? 0})
                        </Button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
