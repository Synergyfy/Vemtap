import { Loader2 } from 'lucide-react';

export interface Column<T> {
    header: string;
    accessor: keyof T | ((item: T) => React.ReactNode);
    className?: string;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    onRowClick?: (item: T) => void;
    isLoading?: boolean;
    emptyState?: React.ReactNode;
}

export default function DataTable<T extends { id: string | number }>({
    columns,
    data,
    onRowClick,
    isLoading,
    emptyState
}: DataTableProps<T>) {
    if (isLoading) {
        return (
            <div className="w-full h-64 flex items-center justify-center bg-white rounded-xl border border-gray-200">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    if (data.length === 0 && emptyState) {
        return <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">{emptyState}</div>;
    }

    return (
        <div className="w-full">
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                {columns.map((column, index) => (
                                    <th
                                        key={index}
                                        className={`text-left py-4 px-6 text-[10px] font-black uppercase tracking-widest text-text-secondary ${column.className || ''}`}
                                    >
                                        {column.header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item) => (
                                <tr
                                    key={item.id}
                                    onClick={() => onRowClick?.(item)}
                                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                                >
                                    {columns.map((column, index) => (
                                        <td key={index} className={`py-4 px-6 text-sm ${column.className || ''}`}>
                                            {typeof column.accessor === 'function'
                                                ? column.accessor(item)
                                                : (item[column.accessor] as React.ReactNode)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {data.map((item) => (
                    <div
                        key={item.id}
                        onClick={() => onRowClick?.(item)}
                        className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden active:scale-[0.98] transition-transform"
                    >
                        {/* Header Section (First Column) */}
                        <div className="p-4 bg-gray-50/50 border-b border-gray-100">
                            {typeof columns[0].accessor === 'function'
                                ? columns[0].accessor(item)
                                : (item[columns[0].accessor as keyof T] as React.ReactNode)}
                        </div>

                        {/* Body Section (Remaining Columns) */}
                        <div className="p-4 space-y-3">
                            {columns.slice(1).map((column, index) => {
                                const content = typeof column.accessor === 'function'
                                    ? column.accessor(item)
                                    : (item[column.accessor as keyof T] as React.ReactNode);

                                // Skip if content is null/undefined or it's an action button (often Send/Send message)
                                if (content === null || content === undefined) return null;

                                return (
                                    <div key={index} className="flex justify-between items-start gap-4">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary mt-1 shrink-0">
                                            {column.header}
                                        </span>
                                        <div className="text-xs font-bold text-text-main text-right break-words">
                                            {content}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
