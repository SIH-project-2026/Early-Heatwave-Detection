import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  UserCheck,
  ShieldCheck,
  Clock,
  Phone,
  Radio,
  MapPin,
  Search,
  Filter,
  Activity,
  HeartPulse,
  Truck,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Coffee,
  Sparkles,
  Download,
  Flame,
  Calendar,
  Layers,
  ChevronRight,
  Thermometer,
} from 'lucide-react';
import { playDispatchSound } from '../utils/soundService';

interface Personnel {
  id: string;
  code: string;
  name: string;
  role: string;
  department: 'PARAMEDICS' | 'ASHA_HEALTH' | 'HEAT_WARDENS' | 'HYDRATION' | 'ER_TRIAGE';
  deptLabel: string;
  wardName: string;
  zone: string;
  status: 'ON_DUTY' | 'HEATBREAK_REST' | 'STANDBY' | 'OFF_DUTY';
  shift: string;
  currentUtci: number;
  contact: string;
  radioFrequency: string;
  equipment?: string;
  lastHydrationMinutesAgo: number;
  avatarColor: string;
}

const INITIAL_PERSONNEL: Personnel[] = [
  {
    id: 'emp-01',
    code: 'EMP-1081',
    name: 'Dr. Arvind Saxena, MD',
    role: 'Chief Medical Officer & Casualty Coordinator',
    department: 'ER_TRIAGE',
    deptLabel: 'Emergency Room Triage',
    wardName: 'DLF Cyber City & Udyog Vihar',
    zone: 'Zone 8 - Gurgaon North',
    status: 'ON_DUTY',
    shift: '06:00 AM - 02:00 PM',
    currentUtci: 35.6,
    contact: '+91 98101 23456',
    radioFrequency: 'CH-01 (154.600 MHz)',
    equipment: 'Trauma Bay 1 • Defibrillator Ready',
    lastHydrationMinutesAgo: 15,
    avatarColor: 'from-emerald-600/30 to-teal-600/30 text-emerald-300 border-emerald-500/40',
  },
  {
    id: 'emp-02',
    code: 'EMP-2044',
    name: 'Pooja Sharma',
    role: 'Lead Community Health Officer (ASHA Unit 4)',
    department: 'ASHA_HEALTH',
    deptLabel: 'Community Health & ASHA',
    wardName: 'Sector 29 Commercial Hub',
    zone: 'Zone 4 - Gurgaon Central',
    status: 'ON_DUTY',
    shift: '07:00 AM - 03:00 PM',
    currentUtci: 41.8,
    contact: '+91 98112 34567',
    radioFrequency: 'CH-04 (154.850 MHz)',
    equipment: '500x ORS Sachets • Digital Oximeter',
    lastHydrationMinutesAgo: 25,
    avatarColor: 'from-sky-600/30 to-indigo-600/30 text-sky-300 border-sky-500/40',
  },
  {
    id: 'emp-03',
    code: 'EMP-3012',
    name: 'Rajesh Kumar',
    role: 'Senior ALS Paramedic & Emergency Driver',
    department: 'PARAMEDICS',
    deptLabel: 'ALS Paramedics & Drivers',
    wardName: 'Udyog Vihar Phase 2',
    zone: 'Zone 8 - Gurgaon North',
    status: 'ON_DUTY',
    shift: '06:00 AM - 06:00 PM',
    currentUtci: 42.5,
    contact: '+91 98123 45678',
    radioFrequency: 'EMS-08 (155.050 MHz)',
    equipment: 'ALS Ambulance #108-Alpha • Ice Bath Unit',
    lastHydrationMinutesAgo: 10,
    avatarColor: 'from-rose-600/30 to-amber-600/30 text-rose-300 border-rose-500/40',
  },
  {
    id: 'emp-04',
    code: 'EMP-4091',
    name: 'Suresh Verma',
    role: 'Municipal Heat Warden & Labor Inspector',
    department: 'HEAT_WARDENS',
    deptLabel: 'Municipal Heat Wardens',
    wardName: 'Manesar Industrial Belt',
    zone: 'Zone 7 - Manesar Core',
    status: 'HEATBREAK_REST',
    shift: '08:00 AM - 04:00 PM',
    currentUtci: 44.1,
    contact: '+91 98134 56789',
    radioFrequency: 'CH-02 (154.700 MHz)',
    equipment: 'WBGT Heat Meter • Decibel Meter',
    lastHydrationMinutesAgo: 5,
    avatarColor: 'from-amber-600/30 to-orange-600/30 text-amber-300 border-amber-500/40',
  },
  {
    id: 'emp-05',
    code: 'EMP-5120',
    name: 'Manoj Tiwari',
    role: 'Heavy Water Tanker Logistics Operator',
    department: 'HYDRATION',
    deptLabel: 'Hydration Logistics',
    wardName: 'Sohna Road Corridor',
    zone: 'Zone 5 - South Expressway',
    status: 'ON_DUTY',
    shift: '05:30 AM - 01:30 PM',
    currentUtci: 39.8,
    contact: '+91 98145 67890',
    radioFrequency: 'DISP-03 (154.900 MHz)',
    equipment: 'Tanker WT-04 (12,000 Liters Chilled)',
    lastHydrationMinutesAgo: 20,
    avatarColor: 'from-blue-600/30 to-cyan-600/30 text-blue-300 border-blue-500/40',
  },
  {
    id: 'emp-06',
    code: 'EMP-1102',
    name: 'Anjali Mehta',
    role: 'Emergency Room Triage In-Charge',
    department: 'ER_TRIAGE',
    deptLabel: 'Emergency Room Triage',
    wardName: 'Civil Hospital Trauma Center',
    zone: 'Sector 10 - Central Medical',
    status: 'ON_DUTY',
    shift: '07:00 AM - 03:00 PM',
    currentUtci: 24.0,
    contact: '+91 98156 78901',
    radioFrequency: 'MED-01 (155.100 MHz)',
    equipment: 'Heatstroke Cooling Bed #04 Active',
    lastHydrationMinutesAgo: 30,
    avatarColor: 'from-teal-600/30 to-emerald-600/30 text-teal-300 border-teal-500/40',
  },
  {
    id: 'emp-07',
    code: 'EMP-3055',
    name: 'Vikram Singh',
    role: 'Rapid Response Heatstroke Technician',
    department: 'PARAMEDICS',
    deptLabel: 'ALS Paramedics & Drivers',
    wardName: 'Gurgaon Railway Station Transit',
    zone: 'Zone 3 - Old Gurgaon',
    status: 'STANDBY',
    shift: '08:00 AM - 04:00 PM',
    currentUtci: 38.2,
    contact: '+91 98167 89012',
    radioFrequency: 'EMS-02 (155.025 MHz)',
    equipment: 'Rapid Response Bike Ambulances #RR-02',
    lastHydrationMinutesAgo: 40,
    avatarColor: 'from-purple-600/30 to-pink-600/30 text-purple-300 border-purple-500/40',
  },
  {
    id: 'emp-08',
    code: 'EMP-2089',
    name: 'Sunita Devi',
    role: 'ASHA Urban Outreach Specialist',
    department: 'ASHA_HEALTH',
    deptLabel: 'Community Health & ASHA',
    wardName: 'DLF Phase 3 Cluster',
    zone: 'Zone 8 - Cyber Transit',
    status: 'HEATBREAK_REST',
    shift: '06:30 AM - 02:30 PM',
    currentUtci: 43.0,
    contact: '+91 98178 90123',
    radioFrequency: 'CH-05 (154.875 MHz)',
    equipment: 'ORS Hydration Satchel • Infrared Thermometer',
    lastHydrationMinutesAgo: 8,
    avatarColor: 'from-indigo-600/30 to-sky-600/30 text-indigo-300 border-indigo-500/40',
  },
  {
    id: 'emp-09',
    code: 'EMP-5201',
    name: 'Rakesh Yadav',
    role: 'Mobile Misting Canopy Lead Operator',
    department: 'HYDRATION',
    deptLabel: 'Hydration Logistics',
    wardName: 'IFFCO Chowk Transit Junction',
    zone: 'Zone 4 - Expressway Interchange',
    status: 'ON_DUTY',
    shift: '09:00 AM - 05:00 PM',
    currentUtci: 40.5,
    contact: '+91 98189 01234',
    radioFrequency: 'DISP-05 (154.950 MHz)',
    equipment: 'Misting Canopy Unit #MIST-02 (High Pressure)',
    lastHydrationMinutesAgo: 18,
    avatarColor: 'from-cyan-600/30 to-teal-600/30 text-cyan-300 border-cyan-500/40',
  },
  {
    id: 'emp-10',
    code: 'EMP-1150',
    name: 'Dr. Neha Kapoor',
    role: 'Thermal Trauma Specialist & ICU Lead',
    department: 'ER_TRIAGE',
    deptLabel: 'Emergency Room Triage',
    wardName: 'Medanta Critical Heat Care Unit',
    zone: 'Zone 6 - South City',
    status: 'ON_DUTY',
    shift: '08:00 AM - 04:00 PM',
    currentUtci: 22.5,
    contact: '+91 98190 12345',
    radioFrequency: 'MED-02 (155.150 MHz)',
    equipment: 'Hypothermia Induction Machine • 6 ICU Beds',
    lastHydrationMinutesAgo: 35,
    avatarColor: 'from-emerald-600/30 to-sky-600/30 text-emerald-300 border-emerald-500/40',
  },
];

export const HumanResourcesPage: React.FC = () => {
  const { user } = useAuth();
  const roleType = user?.roleType || 'controller';

  const [personnelList, setPersonnelList] = useState<Personnel[]>(INITIAL_PERSONNEL);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>(() => {
    if (roleType === 'disaster_officer') return 'ASHA_HEALTH';
    if (roleType === 'field_lead') return 'PARAMEDICS';
    return 'ALL';
  });
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync default filter on role change
  useEffect(() => {
    if (roleType === 'disaster_officer') setSelectedDept('ASHA_HEALTH');
    else if (roleType === 'field_lead') setSelectedDept('PARAMEDICS');
    else setSelectedDept('ALL');
  }, [roleType]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleHeatbreak = (id: string) => {
    playDispatchSound();
    setPersonnelList((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const nextStatus = p.status === 'ON_DUTY' ? 'HEATBREAK_REST' : 'ON_DUTY';
          showToast(
            `${p.name} status updated to ${
              nextStatus === 'HEATBREAK_REST' ? 'Mandatory Heatbreak Rest (15m)' : 'Active On-Duty'
            }`
          );
          return {
            ...p,
            status: nextStatus,
            lastHydrationMinutesAgo: nextStatus === 'HEATBREAK_REST' ? 0 : p.lastHydrationMinutesAgo,
          };
        }
        return p;
      })
    );
  };

  const handleRadioCheck = (person: Personnel) => {
    playDispatchSound();
    showToast(`Radio frequency ${person.radioFrequency} pinged for ${person.name}. Signal nominal.`);
  };

  // Role metadata configurations
  const roleMeta = {
    controller: {
      badge: 'SEOC L4 // INTER-AGENCY RELIEF ROSTER',
      badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      title: 'Statewide Disaster Relief Task Force & Roster',
      subtitle: 'Command personnel, inter-agency liaison officers, medical reserve corps, and state civil defense response teams.',
      exportLabel: 'Export Statewide Roster (CSV)',
      exportToast: 'Workforce Roster exported successfully (148 Statewide Staff records).',
      broadcastLabel: 'Broadcast Heatbreak Directive',
      broadcastToast: 'Statewide Directive issued: Mandatory 15-min Hydration Break for all active sectors.',
      protocolTitle: 'State Disaster Management Authority (SDMA SOP-12) Active',
      protocolDesc: 'Mandatory heat shelter shifts and emergency deployment rotations for all 24 municipal ward sectors.',
      kpi1Title: 'Total Task Force',
      kpi1Value: '148',
      kpi1Sub: 'Statewide Deployments Across 24 Wards',
      kpi1Tag: '100% Operational Grid',
      kpi2Title: 'Active On-Duty',
      kpi2Value: '134',
      kpi2Sub: 'Command Staff & Inter-Agency Officers',
      kpi2Tag: '98.4% Roster Attendance',
      kpi3Title: 'Heatbreak Rotation',
      kpi3Value: '16',
      kpi3Sub: 'NDMA Shift Protocol (UTCI > 40°C)',
      kpi3Tag: '45m Work / 15m Shaded Rest',
      kpi4Title: 'Standby Reserves',
      kpi4Value: '20',
      kpi4Sub: 'State Civil Defense Tactical Reserve',
      kpi4Tag: '~3 min Mobilization SLA',
    },
    disaster_officer: {
      badge: 'MUNI L3 // HEALTH RELIEF & MEDICAL CORPS',
      badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      title: 'Healthcare Relief Staff & Community Health Liaisons',
      subtitle: 'ASHA community coordinators, emergency room trauma nurses, and clinical heatwave triage physicians.',
      exportLabel: 'Export Health Roster (CSV)',
      exportToast: 'Healthcare Personnel Directory exported (84 Clinical & ASHA records).',
      broadcastLabel: 'Broadcast Hydration Alert',
      broadcastToast: 'Advisory sent to all ASHA coordinators & triage teams: Mandatory cooling rest.',
      protocolTitle: 'National Heat Action Plan - Clinical Health Protocol Active',
      protocolDesc: 'Mandatory ORS rest periods for all field health liaisons and designated ER cold-bath readiness.',
      kpi1Title: 'Health Corps & ASHA',
      kpi1Value: '84',
      kpi1Sub: 'Community Liaisons & Trauma Nurses',
      kpi1Tag: 'Full Clinical Coverage',
      kpi2Title: 'Active Clinical Duty',
      kpi2Value: '78',
      kpi2Sub: 'Stationed at Ward Health Centers & ERs',
      kpi2Tag: 'Zero Unattended Clinics',
      kpi3Title: 'Staff Hydration Rest',
      kpi3Value: '12',
      kpi3Sub: 'Staggered Cooling Station Breaks',
      kpi3Tag: '15m Shaded Rest Mandate',
      kpi4Title: 'Hypothermia Bays',
      kpi4Value: '24',
      kpi4Sub: 'Trauma Cooling Beds with On-Call Staff',
      kpi4Tag: 'Instant Triage Ready',
    },
    field_lead: {
      badge: 'TACT L2 // FIRST RESPONDER & FLEET CREWS',
      badgeColor: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
      title: 'First Responder Rosters & Ground Tactical Squads',
      subtitle: 'ALS ambulance paramedics, water tanker operators, municipal heat wardens, and misting technicians.',
      exportLabel: 'Export Squad Roster (CSV)',
      exportToast: 'Ground Responders Roster exported (64 Tactical Crew records).',
      broadcastLabel: 'Field Crew Heatbreak',
      broadcastToast: 'Tactical Alert issued: All tanker drivers and wardens proceed to shaded misting canopy.',
      protocolTitle: 'Tactical Field Safety & Hydration Mandate Active',
      protocolDesc: 'Mandatory 15-minute shaded hydration break every 45 minutes for all water tanker drivers and heat wardens.',
      kpi1Title: 'Ground Fleet Crews',
      kpi1Value: '64',
      kpi1Sub: 'Tanker Drivers, Paramedics & Techs',
      kpi1Tag: '100% Radio Verified',
      kpi2Title: 'Active Responders',
      kpi2Value: '56',
      kpi2Sub: 'On High-Exposure Transit Patrols',
      kpi2Tag: '6.2m Avg SOS Dispatch',
      kpi3Title: 'Hydration Depots',
      kpi3Value: '18',
      kpi3Sub: 'Field Refill Stations Staffed',
      kpi3Tag: 'Active Tanker Top-Off',
      kpi4Title: 'ALS Ambulances',
      kpi4Value: '14',
      kpi4Sub: 'Rapid Response Mobile Units Staged',
      kpi4Tag: 'Engine Running & Staged',
    },
  }[roleType];

  // Filtered list
  const filteredPersonnel = useMemo(() => {
    return personnelList.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.wardName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.contact.includes(searchQuery);

      const matchesDept = selectedDept === 'ALL' || p.department === selectedDept;
      const matchesStatus = selectedStatus === 'ALL' || p.status === selectedStatus;

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [personnelList, searchQuery, selectedDept, selectedStatus]);

  return (
    <div className="w-full space-y-6 pb-12 font-sans select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 animate-bounce">
          <div className="bg-[#181920] border border-emerald-500/40 text-emerald-300 px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-2.5 font-sans text-xs sm:text-sm font-bold card-highlight-rim">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* 1. Header Banner */}
      <div className="p-6 sm:p-7 rounded-3xl bg-[#181920] border border-white/[0.08] flex flex-col lg:flex-row lg:items-center justify-between gap-5 w-full shadow-2xl card-highlight-rim">
        <div className="min-w-0">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-400 shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white uppercase tracking-tight flex items-center space-x-2.5 flex-wrap">
                <span>{roleMeta.title}</span>
                <span className={`px-2.5 py-0.5 text-xs font-mono font-bold rounded-xl border mt-1 sm:mt-0 ${roleMeta.badgeColor}`}>
                  {roleMeta.badge}
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium">
                {roleMeta.subtitle}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0 flex-wrap gap-y-2">
          <button
            onClick={() => {
              playDispatchSound();
              showToast(roleMeta.exportToast);
            }}
            className="px-4 py-2.5 rounded-xl bg-[#13141a] hover:bg-[#181920] text-slate-300 hover:text-white border border-white/[0.08] text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>{roleMeta.exportLabel}</span>
          </button>

          <button
            onClick={() => {
              playDispatchSound();
              showToast(roleMeta.broadcastToast);
            }}
            className="px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm active:scale-95"
          >
            <Coffee className="w-3.5 h-3.5 text-amber-400" />
            <span>{roleMeta.broadcastLabel}</span>
          </button>
        </div>
      </div>

      {/* 2. Top 4 Workforce KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="relative overflow-hidden p-5 sm:p-6 rounded-2xl bg-[#181920] border border-white/[0.08] shadow-2xl card-highlight-rim flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              {roleMeta.kpi1Title}
            </span>
            <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-2xl sm:text-3xl font-bold text-white font-sans tracking-tight">
              {roleMeta.kpi1Value}
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              {roleMeta.kpi1Sub}
            </p>
          </div>
          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-medium text-sky-300">
            <span>{roleMeta.kpi1Tag}</span>
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
          </div>
        </div>

        {/* Card 2 */}
        <div className="relative overflow-hidden p-5 sm:p-6 rounded-2xl bg-[#181920] border border-white/[0.08] shadow-2xl card-highlight-rim flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              {roleMeta.kpi2Title}
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-2xl sm:text-3xl font-bold text-emerald-400 font-sans tracking-tight">
              {roleMeta.kpi2Value}
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              {roleMeta.kpi2Sub}
            </p>
          </div>
          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-medium text-emerald-300">
            <span>{roleMeta.kpi2Tag}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
        </div>

        {/* Card 3 */}
        <div className="relative overflow-hidden p-5 sm:p-6 rounded-2xl bg-[#181920] border border-white/[0.08] shadow-2xl card-highlight-rim flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              {roleMeta.kpi3Title}
            </span>
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Coffee className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-2xl sm:text-3xl font-bold text-amber-300 font-sans tracking-tight">
              {roleMeta.kpi3Value}
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              {roleMeta.kpi3Sub}
            </p>
          </div>
          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-medium text-amber-300">
            <span>{roleMeta.kpi3Tag}</span>
            <span className="w-2 h-2 rounded-full bg-amber-400" />
          </div>
        </div>

        {/* Card 4 */}
        <div className="relative overflow-hidden p-5 sm:p-6 rounded-2xl bg-[#181920] border border-white/[0.08] shadow-2xl card-highlight-rim flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              {roleMeta.kpi4Title}
            </span>
            <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
              <HeartPulse className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-2xl sm:text-3xl font-bold text-rose-400 font-sans tracking-tight">
              {roleMeta.kpi4Value}
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              {roleMeta.kpi4Sub}
            </p>
          </div>
          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-medium text-rose-300">
            <span>{roleMeta.kpi4Tag}</span>
            <span className="w-2 h-2 rounded-full bg-rose-400" />
          </div>
        </div>
      </div>

      {/* 3. Heatwave Worker Protection & Labor Safety Protocol Callout */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-[#181920] to-rose-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 card-highlight-rim shadow-lg">
        <div className="flex items-center space-x-3.5 min-w-0">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              {roleMeta.protocolTitle}
            </h3>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              {roleMeta.protocolDesc}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>OSHA COMPLIANT</span>
          </span>
        </div>
      </div>

      {/* 4. Search and Multi-filter Toolbar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#181920] border border-white/[0.08] shadow-2xl space-y-4 card-highlight-rim">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by personnel name, employee ID, role, or ward..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#13141a] border border-white/[0.06] rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/50 transition-all font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2 shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              aria-label="Filter by duty status"
              className="bg-[#13141a] border border-white/[0.06] rounded-xl px-3 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:border-sky-500/50 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="ON_DUTY">On Duty (Active)</option>
              <option value="HEATBREAK_REST">Heatbreak Rest (Shaded)</option>
              <option value="STANDBY">Standby (Ready)</option>
            </select>
          </div>
        </div>

        {/* Department Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'ALL', label: 'All Personnel' },
            { id: 'PARAMEDICS', label: 'ALS Paramedics & Drivers' },
            { id: 'ASHA_HEALTH', label: 'ASHA & Community Health' },
            { id: 'HEAT_WARDENS', label: 'Municipal Heat Wardens' },
            { id: 'HYDRATION', label: 'Hydration Logistics' },
            { id: 'ER_TRIAGE', label: 'Emergency Room Triage' },
          ].map((dept) => {
            const isSelected = selectedDept === dept.id;
            return (
              <button
                key={dept.id}
                onClick={() => setSelectedDept(dept.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-sky-500/20 border-sky-500/40 text-sky-300 shadow-md ring-1 ring-sky-500/30'
                    : 'bg-[#13141a] border-white/[0.04] text-slate-400 hover:text-white hover:border-white/[0.08]'
                }`}
              >
                {dept.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Personnel Directory Roster Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-mono font-medium">
          <span>
            Showing {filteredPersonnel.length} of {personnelList.length} Active Personnel
          </span>
          <span>SOP Rotation Schedule • Shift 1 (06:00 - 14:00)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPersonnel.map((person) => {
            const isOnDuty = person.status === 'ON_DUTY';
            const isHeatbreak = person.status === 'HEATBREAK_REST';

            return (
              <div
                key={person.id}
                className="rounded-3xl bg-[#181920] border border-white/[0.08] p-5 shadow-2xl space-y-4 card-highlight-rim hover:border-white/[0.14] transition-all flex flex-col justify-between"
              >
                {/* Top Row: Avatar + Name + Status Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-3 min-w-0">
                    {/* Avatar with Status Dot */}
                    <div className="relative shrink-0">
                      <div
                        className={`w-11 h-11 rounded-2xl bg-gradient-to-br border flex items-center justify-center font-bold font-sans text-xs shadow-md ${person.avatarColor}`}
                      >
                        {person.name
                          .split(' ')
                          .filter((w) => !w.startsWith('Dr.') && !w.endsWith(','))
                          .slice(0, 2)
                          .map((w) => w[0])
                          .join('')}
                      </div>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#181920] ${
                          isOnDuty
                            ? 'bg-emerald-400 animate-pulse'
                            : isHeatbreak
                            ? 'bg-amber-400'
                            : 'bg-sky-400'
                        }`}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-mono font-bold text-slate-400 bg-white/[0.05] px-2 py-0.5 rounded-md">
                          {person.code}
                        </span>
                        <span className="text-[11px] font-mono text-sky-400 font-bold truncate">
                          {person.deptLabel}
                        </span>
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-white tracking-tight leading-snug mt-0.5 truncate">
                        {person.name}
                      </h3>
                      <p className="text-xs text-slate-300 font-medium truncate mt-0.5">
                        {person.role}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold border shrink-0 uppercase tracking-wider ${
                      isOnDuty
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : isHeatbreak
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        : 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                    }`}
                  >
                    {isOnDuty ? 'ON DUTY' : isHeatbreak ? 'HEATBREAK' : 'STANDBY'}
                  </span>
                </div>

                {/* Middle Telemetry & Assignment Details */}
                <div className="bg-[#13141a] rounded-2xl p-3.5 border border-white/[0.05] space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <div className="flex items-center space-x-1.5 min-w-0">
                      <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span className="truncate font-medium">{person.wardName}</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 shrink-0">
                      {person.zone}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-300 pt-1 border-t border-white/[0.04]">
                    <div className="flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span className="font-mono text-[11px]">{person.shift}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 font-mono text-[11px]">
                      <Thermometer className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className={person.currentUtci > 42 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                        {person.currentUtci}°C UTCI
                      </span>
                    </div>
                  </div>

                  {person.equipment && (
                    <div className="text-[11px] text-slate-400 font-mono truncate pt-1 border-t border-white/[0.04] flex items-center space-x-1.5">
                      <Activity className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      <span className="truncate">{person.equipment}</span>
                    </div>
                  )}
                </div>

                {/* Bottom Action Buttons: Radio Ping & Heatbreak Toggle */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => handleRadioCheck(person)}
                    className="px-3 py-2 rounded-xl bg-[#13141a] hover:bg-white/[0.06] text-slate-200 font-bold text-xs transition-all flex items-center justify-center space-x-1.5 border border-white/[0.06] cursor-pointer"
                    title={`Ping Radio ${person.radioFrequency}`}
                  >
                    <Radio className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span className="truncate">Radio Check</span>
                  </button>

                  <button
                    onClick={() => handleToggleHeatbreak(person.id)}
                    className={`px-3 py-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center space-x-1.5 border cursor-pointer ${
                      isOnDuty
                        ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30'
                        : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    <Coffee className="w-3.5 h-3.5 shrink-0" />
                    <span>{isOnDuty ? 'Log Heatbreak' : 'Resume Duty'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
