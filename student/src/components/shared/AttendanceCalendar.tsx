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

  const todayStr = new Date().toISOString().split('T')[0];
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
    <Card className="border-zinc-800 space-y-4">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-5 h-5 text-white" />
            <CardTitle>
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
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs font-mono font-bold text-white px-2">
              {monthNames[month].slice(0, 3)} {year}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextMonth}
              disabled={isNextDisabled}
              title={isNextDisabled ? 'Reached batch last date' : 'Next Month'}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Status Key Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs mb-4 pb-3 border-b border-zinc-900">
          <span className="text-zinc-400 font-semibold">Attendance Legend:</span>
          <div className="flex items-center space-x-1.5 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded text-emerald-300 font-mono text-[11px]">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>P (Present)</span>
          </div>
          <div className="flex items-center space-x-1.5 bg-amber-950/60 border border-amber-800/80 px-2 py-0.5 rounded text-amber-300 font-mono text-[11px]">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>L (Late Arrival)</span>
          </div>
          <div className="flex items-center space-x-1.5 bg-rose-950/60 border border-rose-800/80 px-2 py-0.5 rounded text-rose-300 font-mono text-[11px]">
            <XCircle className="w-3 h-3 text-rose-400" />
            <span>A (Absent)</span>
          </div>
          <div className="flex items-center space-x-1.5 bg-purple-950/60 border border-purple-800/80 px-2 py-0.5 rounded text-purple-300 font-mono text-[11px]">
            <Palmtree className="w-3 h-3 text-purple-400" />
            <span>H (Holiday)</span>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs font-bold text-zinc-400 mb-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="py-1 bg-zinc-900/80 rounded border border-zinc-800/80">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-xs">
          {/* Empty cells for preceding days */}
          {Array.from({ length: firstDayIndex }).map((_, idx) => (
            <div key={`empty-${idx}`} className="h-14 sm:h-16 rounded bg-zinc-950/40 border border-zinc-900/40 opacity-30" />
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
            const isFutureDate = dateStr > todayStr;

            if (isOutsideBatchDuration) {
              return (
                <div
                  key={dayNum}
                  className="h-14 sm:h-16 p-1 sm:p-1.5 rounded border border-zinc-900/40 bg-zinc-950/20 text-zinc-600 opacity-40 flex flex-col justify-between"
                >
                  <span className="font-bold text-zinc-600 font-mono">{dayNum}</span>
                  <span className="text-[9px] italic">Out of Duration</span>
                </div>
              );
            }

            if (isFutureDate) {
              return (
                <div
                  key={dayNum}
                  className="h-14 sm:h-16 p-1 sm:p-1.5 rounded border border-zinc-900/60 bg-zinc-900/20 text-zinc-500 opacity-60 flex flex-col justify-between"
                >
                  <span className="font-bold text-zinc-400 font-mono">{dayNum}</span>
                  <span className="text-[9px] italic text-zinc-500">Upcoming</span>
                </div>
              );
            }

            return (
              <div
                key={dayNum}
                className={`h-14 sm:h-16 p-1 sm:p-1.5 rounded border flex flex-col justify-between transition-all ${record?.status === 'PRESENT'
                    ? 'bg-emerald-950/30 border-emerald-800/80 text-emerald-200'
                    : record?.status === 'LATE'
                      ? 'bg-amber-950/30 border-amber-800/80 text-amber-200'
                      : record?.status === 'ABSENT'
                        ? 'bg-rose-950/30 border-rose-800/80 text-rose-200'
                        : record?.status === 'HOLIDAY'
                          ? 'bg-purple-950/30 border-purple-800/80 text-purple-200'
                          : 'bg-zinc-900/40 border-zinc-800/60 text-zinc-400'
                  }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="font-bold text-white">{dayNum}</span>
                  {record && (
                    <span
                      className={`px-1 rounded text-[9px] font-extrabold uppercase font-mono ${record.status === 'PRESENT'
                          ? 'bg-emerald-500 text-black'
                          : record.status === 'LATE'
                            ? 'bg-amber-500 text-black'
                            : record.status === 'ABSENT'
                              ? 'bg-rose-500 text-white'
                              : record.status === 'HOLIDAY'
                                ? 'bg-purple-600 text-white'
                                : 'bg-zinc-700 text-white'
                        }`}
                    >
                      {record.status === 'PRESENT' ? 'P' : record.status === 'LATE' ? 'L' : record.status === 'ABSENT' ? 'A' : record.status === 'HOLIDAY' ? 'H' : 'E'}
                    </span>
                  )}
                </div>

                {record ? (
                  <div className="text-[9px] truncate font-medium text-zinc-300">
                    {record.status}
                  </div>
                ) : (
                  <span className="text-[9px] text-zinc-600 italic">No class</span>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
