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
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            {columns.map((column, index) => (
                                <th
                                    key={index}
                                    className={`text-left py-3 px-4 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-text-secondary ${column.className || ''}`}
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
                                    <td key={index} className={`py-3 px-4 text-xs md:text-sm ${column.className || ''}`}>
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
    );
}
