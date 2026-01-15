
"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getYear } from "date-fns";

interface ReportFiltersProps {
    mode: 'month' | 'year';
    year: number;
    month?: number;
    onYearChange: (year: number) => void;
    onMonthChange?: (month: number) => void;
}

const currentYear = getYear(new Date());
const years = Array.from({ length: 10 }, (_, i) => currentYear - i);
const months = [
    { value: 0, label: "Tháng 1" },
    { value: 1, label: "Tháng 2" },
    { value: 2, label: "Tháng 3" },
    { value: 3, label: "Tháng 4" },
    { value: 4, label: "Tháng 5" },
    { value: 5, label: "Tháng 6" },
    { value: 6, label: "Tháng 7" },
    { value: 7, label: "Tháng 8" },
    { value: 8, label: "Tháng 9" },
    { value: 9, label: "Tháng 10" },
    { value: 10, label: "Tháng 11" },
    { value: 11, label: "Tháng 12" },
];


export function ReportFilters({ mode, year, month, onYearChange, onMonthChange }: ReportFiltersProps) {
    return (
        <div className="flex items-center gap-2">
            {mode === 'month' && onMonthChange && (
                 <Select
                    value={month?.toString()}
                    onValueChange={(value) => onMonthChange(Number(value))}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Chọn tháng" />
                    </SelectTrigger>
                    <SelectContent>
                        {months.map(m => (
                             <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}
             <Select
                value={year.toString()}
                onValueChange={(value) => onYearChange(Number(value))}
            >
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Chọn năm" />
                </SelectTrigger>
                <SelectContent>
                    {years.map(y => (
                        <SelectItem key={y} value={y.toString()}>Năm {y}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
