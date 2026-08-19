'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2, Clock, XCircle, Palmtree } from 'lucide-react';
import { AttendanceRecord } from '../../types';

interface AttendanceCalendarProps {
  records: AttendanceRecord[];
  startDate?: string;
  endDate?: string;
}

const parseYearMonth = (dateStr?: string) => {
  if (!dateStr) return null;
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length >= 2) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1; // 0-indexed month
    if (!isNaN(y) && !isNaN(m)) {
      return { year: y, month: m };
    }
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return { year: d.getFullYear(), month: d.getMonth() };
  }
  return null;
};

export const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({ records, startDate, endDate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const startYM = parseYearMonth(startDate);
  const endYM = parseYearMonth(endDate);

  // Auto-clamp currentDate if it's out of range on mount or when props change
  useEffect(() => {
    if (startYM && (year < startYM.year || (year === startYM.year && month < startYM.month))) {
      setCurrentDate(new Date(startYM.year, startYM.month, 1));
    } else if (endYM && (year > endYM.year || (year === endYM.year && month > endYM.month))) {
      setCurrentDate(new Date(endYM.year, endYM.month, 1));
    }
  }, [startDate, endDate, year, month, startYM?.year, startYM?.month, endYM?.year, endYM?.month]);

  const isPrevDisabled = Boolean(
    startYM && (year < startYM.year || (year === startYM.year && month <= startYM.month))
  );

  const isNextDisabled = Boolean(
    endYM && (year > endYM.year || (year === endYM.year && month >= endYM.month))
  );

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Monday-first index (0 = Mon, 6 = Sun)

  const handlePrevMonth = () => {
    if (isPrevDisabled) return;
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    if (isNextDisabled) return;
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Map date string YYYY-MM-DD -> status record
  const recordsMap = new Map<string, AttendanceRecord>();
  records.forEach((r) => {
    if (r.date) {
      recordsMap.set(r.date, r);
    }
  });

  const monthFormatted = String(month + 1).padStart(2, '0');

  return (
    <Card className="border-slate-200/80 space-y-4 shadow-sm bg-white">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-5 h-5 text-indigo-600" />
            <CardTitle className="text-slate-900">
              {monthNames[month]} {year} - Monthly Attendance Calendar
            </CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevMonth}
              disabled={isPrevDisabled}
              title={isPrevDisabled ? 'Reached batch start date' : 'Previous Month'}
              className="border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs font-mono font-bold text-slate-800 px-2">
              {monthNames[month].slice(0, 3)} {year}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextMonth}
              disabled={isNextDisabled}
              title={isNextDisabled ? 'Reached batch last date' : 'Next Month'}
              className="border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Status Key Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs mb-4 pb-3 border-b border-slate-100">
          <span className="text-slate-500 font-semibold">Attendance Legend:</span>
          <div className="flex items-center space-x-1.5 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-emerald-800 font-mono text-[11px] font-medium">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>P (Present)</span>
          </div>
          <div className="flex items-center space-x-1.5 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-amber-800 font-mono text-[11px] font-medium">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>L (Late Arrival)</span>
          </div>
          <div className="flex items-center space-x-1.5 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-rose-800 font-mono text-[11px] font-medium">
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>A (Absent)</span>
          </div>
          <div className="flex items-center space-x-1.5 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded text-purple-800 font-mono text-[11px] font-medium">
            <Palmtree className="w-3 h-3 text-purple-600" />
            <span>H (Holiday)</span>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs font-bold text-slate-500 mb-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="py-1.5 bg-slate-100/80 rounded-md border border-slate-200/80 font-bold text-slate-700">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-xs">
          {/* Empty cells for preceding days */}
          {Array.from({ length: firstDayIndex }).map((_, idx) => (
            <div key={`empty-${idx}`} className="h-14 sm:h-16 rounded-md bg-slate-50/50 border border-slate-100 opacity-40" />
          ))}

          {/* Days of Month */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const dayFormatted = String(dayNum).padStart(2, '0');
            const dateStr = `${year}-${monthFormatted}-${dayFormatted}`;
            const record = recordsMap.get(dateStr);

            const isBeforeStart = startDate && dateStr < startDate;
            const isAfterEnd = endDate && dateStr > endDate;
            const isOutsideBatchDuration = isBeforeStart || isAfterEnd;

            if (isOutsideBatchDuration) {
              return (
                <div
                  key={dayNum}
                  className="h-14 sm:h-16 p-1 sm:p-1.5 rounded-md border border-slate-200/60 bg-slate-100/60 text-slate-400 opacity-60 flex flex-col justify-between"
                >
                  <span className="font-bold text-slate-400 font-mono">{dayNum}</span>
                  <span className="text-[9px] italic">Out of Duration</span>
                </div>
              );
            }

            return (
              <div
                key={dayNum}
                className={`h-14 sm:h-16 p-1 sm:p-1.5 rounded-md border flex flex-col justify-between transition-all shadow-sm ${
                  record?.status === 'PRESENT'
                    ? 'bg-emerald-50/90 border-emerald-300 text-emerald-900'
                    : record?.status === 'LATE'
                    ? 'bg-amber-50/90 border-amber-300 text-amber-900'
                    : record?.status === 'ABSENT'
                    ? 'bg-rose-50/90 border-rose-300 text-rose-900'
                    : record?.status === 'HOLIDAY'
                    ? 'bg-purple-50/90 border-purple-300 text-purple-900'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="font-bold text-slate-900">{dayNum}</span>
                  {record && (
                    <span
                      className={`px-1 rounded text-[9px] font-extrabold uppercase font-mono ${
                        record.status === 'PRESENT'
                          ? 'bg-emerald-600 text-white'
                          : record.status === 'LATE'
                          ? 'bg-amber-500 text-black'
                          : record.status === 'ABSENT'
                          ? 'bg-rose-600 text-white'
                          : record.status === 'HOLIDAY'
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-700 text-white'
                      }`}
                    >
                      {record.status === 'PRESENT' ? 'P' : record.status === 'LATE' ? 'L' : record.status === 'ABSENT' ? 'A' : record.status === 'HOLIDAY' ? 'H' : 'E'}
                    </span>
                  )}
                </div>

                {record ? (
                  <div className="text-[9px] truncate font-semibold text-slate-800">
                    {record.status}
                  </div>
                ) : (
                  <span className="text-[9px] text-slate-400 italic">No record</span>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
