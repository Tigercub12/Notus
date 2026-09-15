'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isToday, addMonths, subMonths } from 'date-fns';
import { th } from 'date-fns/locale';

interface CalEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  end_date: string | null;
  note_id: string | null;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [newEventTime, setNewEventTime] = useState('09:00');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/events');
      if (res.ok) {
        const data = (await res.json()) as CalEvent[];
        setEvents(data);
      }
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;
    setIsSubmitting(true);
    const localDate = new Date(`${newEventDate}T${newEventTime}`);
    const isoString = localDate.toISOString();
    
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newEventTitle,
          description: null,
          event_date: isoString,
        })
      });
      
      if (res.ok) {
        const created = (await res.json()) as CalEvent;
        setEvents([...events, created]);
        setIsModalOpen(false);
        setNewEventTitle('');
      }
    } catch (err) {
      console.error('Failed to create event:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  // Ensure we get exactly 42 days (6 weeks) to cover all calendar edge cases
  const days = eachDayOfInterval({ start: calStart, end: calEnd });
  while (days.length < 42) {
    days.push(new Date(days[days.length - 1].getTime() + 24 * 60 * 60 * 1000));
  }

  const dayNames = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

  const getEventsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return events.filter((e) => {
      if (!e.event_date) return false;
      const eDateStr = e.event_date.split('T')[0];
      if (e.end_date) {
        const endDateStr = e.end_date.split('T')[0];
        return dateStr >= eDateStr && dateStr <= endDateStr;
      }
      return eDateStr === dateStr;
    });
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Mobile Top Bar */}
      <header className="md:hidden bg-[#f8f9ff] border-b border-[#c4c5d5] h-14 flex items-center justify-between px-4 sticky top-0 z-20">
        <h1 className="text-xl font-semibold text-[#0b1c30]">
          {format(currentDate, 'MMMM yyyy', { locale: th })}
        </h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-1 rounded-full hover:bg-[#e5eeff] text-[#444653]">
            <span className="material-symbols-outlined text-sm">chevron_left</span>
          </button>
          <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-1 rounded-full hover:bg-[#e5eeff] text-[#444653]">
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        </div>
      </header>

      {/* Desktop Top Bar */}
      <header className="hidden md:flex justify-between items-center px-6 h-16 bg-white border-b border-[#c4c5d5] shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => setCurrentDate(new Date())} className="text-sm font-medium px-4 py-2 rounded-lg border border-[#c4c5d5] hover:bg-[#e5eeff] transition-colors text-[#0b1c30]">
            วันนี้
          </button>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 rounded-full hover:bg-[#e5eeff] transition-colors text-[#444653]">
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 rounded-full hover:bg-[#e5eeff] transition-colors text-[#444653]">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
          <h2 className="text-2xl font-semibold text-[#0b1c30] ml-2">
            {format(currentDate, 'MMMM yyyy', { locale: th })}
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#1e40af] text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-[#00288e] transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            สร้างกิจกรรม
          </button>
          <div className="relative hidden lg:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#444653] text-sm">search</span>
            <input className="pl-10 pr-4 py-2 w-64 bg-[#f8f9ff] rounded-full border-none focus:ring-2 focus:ring-[#00288e] text-sm text-[#0b1c30] placeholder:text-[#444653]" placeholder="ค้นหากิจกรรม..." type="text" />
          </div>
          <div className="flex items-center bg-[#f8f9ff] rounded-lg p-1 border border-[#c4c5d5]">
            {(['month', 'week', 'day'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded-md text-xs font-medium tracking-[0.05em] transition-colors ${
                  viewMode === mode
                    ? 'bg-white shadow-sm text-[#0b1c30] border border-[#c4c5d5]'
                    : 'text-[#444653] hover:bg-[#e5eeff]'
                }`}
              >
                {mode === 'month' ? 'เดือน' : mode === 'week' ? 'สัปดาห์' : 'วัน'}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Calendar Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Mini Calendar & My Calendars (Desktop) */}
        <aside className="hidden lg:flex flex-col w-[260px] border-r border-[#c4c5d5] bg-white overflow-y-auto p-4 shrink-0">
          {/* Mini Calendar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-[#0b1c30]">{format(currentDate, 'MMMM yyyy', { locale: th })}</h3>
              <div className="flex">
                <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-1 hover:bg-[#e5eeff] rounded-full text-[#444653]"><span className="material-symbols-outlined text-sm">chevron_left</span></button>
                <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-1 hover:bg-[#e5eeff] rounded-full text-[#444653]"><span className="material-symbols-outlined text-sm">chevron_right</span></button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map((d) => (
                <div key={d} className="text-center text-xs font-medium tracking-[0.05em] text-[#444653] py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-y-1 gap-x-1">
              {days.slice(0, 42).map((day, i) => {
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isTodayDate = isToday(day);
                return (
                  <div
                    key={i}
                    onClick={() => setCurrentDate(day)}
                    className={`text-center text-sm py-1 rounded-full cursor-pointer hover:bg-[#e5eeff] ${
                      !isCurrentMonth ? 'text-[#757684]' : isTodayDate ? 'bg-[#1e40af] text-white font-medium' : 'text-[#0b1c30]'
                    }`}
                  >
                    {format(day, 'd')}
                  </div>
                );
              })}
            </div>
          </div>

          {/* My Calendars */}
          <div>
            <h4 className="text-xs font-medium tracking-[0.05em] text-[#444653] uppercase mb-3">ปฏิทินของฉัน</h4>
            <ul className="space-y-2">
              <li><label className="flex items-center gap-3 cursor-pointer group"><input defaultChecked className="rounded border-[#c4c5d5] text-[#00288e] focus:ring-[#00288e] h-4 w-4" type="checkbox" /><span className="text-sm text-[#0b1c30] group-hover:text-[#00288e] transition-colors">ส่วนตัว</span></label></li>
              <li><label className="flex items-center gap-3 cursor-pointer group"><input defaultChecked className="rounded border-[#c4c5d5] text-[#565e74] focus:ring-[#565e74] h-4 w-4" type="checkbox" /><span className="text-sm text-[#0b1c30] group-hover:text-[#00288e] transition-colors">งาน</span></label></li>
              <li><label className="flex items-center gap-3 cursor-pointer group"><input defaultChecked className="rounded border-[#c4c5d5] text-[#611e00] focus:ring-[#611e00] h-4 w-4" type="checkbox" /><span className="text-sm text-[#0b1c30] group-hover:text-[#00288e] transition-colors">แชร์ - วางแผน Q4</span></label></li>
            </ul>
          </div>
        </aside>

        {/* Main Calendar Grid */}
        <section className="flex-1 flex flex-col overflow-hidden bg-white">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-[#c4c5d5] shrink-0 bg-[#f8f9ff]">
            {dayNames.map((d, i) => (
              <div key={d} className={`text-center py-2 ${i < 6 ? 'border-r border-[#c4c5d5]' : ''}`}>
                <span className={`text-xs font-medium tracking-[0.05em] block text-[#444653]`}>{d}</span>
              </div>
            ))}
          </div>

          {/* Grid Body */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="w-full h-full flex justify-center items-center">
                <span className="inline-block w-8 h-8 border-4 border-[#00288e]/30 border-t-[#00288e] rounded-full animate-spin"></span>
              </div>
            ) : (
              <div className="grid grid-cols-7 h-full min-h-[600px]" style={{ gridTemplateRows: `repeat(${Math.ceil(days.slice(0,42).length / 7)}, minmax(100px, 1fr))` }}>
                {days.slice(0, 42).map((day, i) => {
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isTodayDate = isToday(day);
                  const dayEvents = getEventsForDay(day);

                  return (
                    <div
                      key={i}
                      className={`border-r border-b border-[#c4c5d5] p-2 flex flex-col gap-1 ${!isCurrentMonth ? 'bg-[#eff4ff]' : isTodayDate ? 'bg-[#f8f9ff]' : ''} ${i % 7 === 6 ? 'border-r-0' : ''}`}
                    >
                      <span className={`text-sm ${
                        !isCurrentMonth ? 'text-[#757684]'
                          : isTodayDate ? 'bg-[#00288e] text-white w-7 h-7 flex items-center justify-center rounded-full font-medium'
                          : 'text-[#0b1c30]'
                      }`}>
                        {format(day, 'd')}
                      </span>
                      {dayEvents.map((event) => (
                        <div 
                          key={event.id} 
                          onClick={() => setSelectedEvent(event)}
                          className="bg-[#1e40af]/10 text-[#00288e] border border-[#00288e]/20 text-[11px] px-2 py-0.5 rounded truncate cursor-pointer hover:bg-[#1e40af]/20 transition-colors"
                        >
                          {event.title}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Mobile FAB */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-20 right-4 z-30 w-14 h-14 bg-[#00288e] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[#1e40af] transition-all active:scale-95 md:hidden"
      >
        <span className="material-symbols-outlined text-[28px]">add</span>
      </button>

      {/* Add Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-[#c4c5d5] flex items-center justify-between bg-[#f8f9ff]">
              <h3 className="text-lg font-semibold text-[#0b1c30]">สร้างกิจกรรมใหม่</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#444653] hover:bg-[#e5eeff] p-1 rounded-full transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleCreateEvent} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#0b1c30] mb-1">ชื่อกิจกรรม</label>
                <input
                  type="text"
                  required
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-[#c4c5d5] rounded-lg focus:outline-none focus:border-[#00288e] focus:ring-1 focus:ring-[#00288e] transition-colors text-sm text-[#0b1c30]"
                  placeholder="เช่น ประชุมทีม, ส่งรายงาน..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#0b1c30] mb-1">วันที่</label>
                  <input
                    type="date"
                    required
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="w-full px-3 py-2 border border-[#c4c5d5] rounded-lg focus:outline-none focus:border-[#00288e] focus:ring-1 focus:ring-[#00288e] transition-colors text-sm text-[#0b1c30]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0b1c30] mb-1">เวลา</label>
                  <input
                    type="time"
                    required
                    value={newEventTime}
                    onChange={(e) => setNewEventTime(e.target.value)}
                    className="w-full px-3 py-2 border border-[#c4c5d5] rounded-lg focus:outline-none focus:border-[#00288e] focus:ring-1 focus:ring-[#00288e] transition-colors text-sm text-[#0b1c30]"
                  />
                </div>
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-[#444653] hover:bg-[#f8f9ff] rounded-lg transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newEventTitle.trim()}
                  className="px-4 py-2 text-sm font-medium bg-[#1e40af] text-white hover:bg-[#00288e] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : null}
                  บันทึกกิจกรรม
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelectedEvent(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-[#c4c5d5] flex items-center justify-between bg-[#f8f9ff]">
              <h3 className="text-lg font-semibold text-[#0b1c30]">รายละเอียดกิจกรรม</h3>
              <button 
                onClick={() => setSelectedEvent(null)}
                className="text-[#444653] hover:text-[#0b1c30] p-1 rounded-full hover:bg-[#e5eeff] transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h4 className="text-xl font-bold text-[#00288e] mb-1">{selectedEvent.title}</h4>
                <div className="flex items-center gap-2 text-[#444653] text-sm">
                  <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                  <span>{new Date(selectedEvent.event_date).toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2 text-[#444653] text-sm mt-1">
                  <span className="material-symbols-outlined text-[18px]">schedule</span>
                  <span>{new Date(selectedEvent.event_date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
              
              {selectedEvent.description && (
                <div className="bg-[#f8f9ff] p-3 rounded-lg border border-[#c4c5d5]/50">
                  <p className="text-sm text-[#444653] whitespace-pre-wrap">{selectedEvent.description}</p>
                </div>
              )}
              
              {selectedEvent.note_id && (
                <Link href={`/notes/${selectedEvent.note_id}`} className="flex items-center gap-2 text-sm text-[#00288e] hover:underline p-2 bg-[#e5eeff] rounded-lg w-fit transition-colors">
                  <span className="material-symbols-outlined text-[18px]">description</span>
                  ไปที่โน้ตที่เกี่ยวข้อง
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const runtime = 'edge';
