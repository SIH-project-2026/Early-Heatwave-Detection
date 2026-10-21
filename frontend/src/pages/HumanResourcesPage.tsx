import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useHeatwave } from '../context/HeatwaveContext';
import { getAllRegions } from '../services/regionStorageService';
import type { MunicipalRegion } from '../types/region';
import type { Ward } from '../types/ward';
import {
  Users,
  UserCheck,
  ShieldCheck,
  Clock,
  Radio,
  MapPin,
  Search,
  Filter,
  Activity,
  HeartPulse,
  Coffee,
  Download,
  Flame,
  Thermometer,
  CheckCircle2,
  Globe,
  Layers,
  Sparkles,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';
import { playDispatchSound } from '../utils/soundService';

export interface Personnel {
  id: string;
  code: string;
  name: string;
  role: string;
  department: 'PARAMEDICS' | 'ASHA_HEALTH' | 'HEAT_WARDENS' | 'HYDRATION' | 'ER_TRIAGE';
  deptLabel: string;
  wardId: string;
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

// Regional name & profile pools for authentic pan-India data generation
interface StaffProfile {
  name: string;
  role: string;
  department: 'PARAMEDICS' | 'ASHA_HEALTH' | 'HEAT_WARDENS' | 'HYDRATION' | 'ER_TRIAGE';
  deptLabel: string;
  equipment: string;
  radioChannel: string;
  avatarColor: string;
  shift: string;
}

function getRegionalStaffProfiles(region: MunicipalRegion): StaffProfile[] {
  const norm = (region.state + ' ' + region.name).toLowerCase();

  // Maharashtra / West India
  if (norm.includes('maharashtra') || norm.includes('mumbai') || norm.includes('pune') || norm.includes('nagpur')) {
    return [
      {
        name: 'Dr. Nilesh Patel, MD',
        role: 'Chief Medical Officer & Casualty Coordinator',
        department: 'ER_TRIAGE',
        deptLabel: 'Emergency Room Triage',
        equipment: 'Trauma Bay 1 • Defibrillator Ready',
        radioChannel: 'MED-01 (155.100 MHz)',
        avatarColor: 'from-emerald-600/30 to-teal-600/30 text-emerald-300 border-emerald-500/40',
        shift: '06:00 AM - 02:00 PM',
      },
      {
        name: 'Neha Deshmukh',
        role: 'Lead Community Health Officer (ASHA Unit 4)',
        department: 'ASHA_HEALTH',
        deptLabel: 'Community Health & ASHA',
        equipment: '500x ORS Sachets • Digital Oximeter',
        radioChannel: 'CH-04 (154.850 MHz)',
        avatarColor: 'from-sky-600/30 to-indigo-600/30 text-sky-300 border-sky-500/40',
        shift: '07:00 AM - 03:00 PM',
      },
      {
        name: 'Sanjay Patil',
        role: 'Senior ALS Paramedic & Emergency Driver',
        department: 'PARAMEDICS',
        deptLabel: 'ALS Paramedics & Drivers',
        equipment: 'ALS Ambulance #108-Alpha • Ice Bath Unit',
        radioChannel: 'EMS-08 (155.050 MHz)',
        avatarColor: 'from-rose-600/30 to-amber-600/30 text-rose-300 border-rose-500/40',
        shift: '06:00 AM - 06:00 PM',
      },
      {
        name: 'Rahul Shinde',
        role: 'Municipal Heat Warden & Labor Inspector',
        department: 'HEAT_WARDENS',
        deptLabel: 'Municipal Heat Wardens',
        equipment: 'WBGT Heat Meter • Decibel Meter',
        radioChannel: 'CH-02 (154.700 MHz)',
        avatarColor: 'from-amber-600/30 to-orange-600/30 text-amber-300 border-amber-500/40',
        shift: '08:00 AM - 04:00 PM',
      },
      {
        name: 'Chetan Solanki',
        role: 'Heavy Water Tanker Logistics Operator',
        department: 'HYDRATION',
        deptLabel: 'Hydration Logistics',
        equipment: 'Tanker WT-04 (12,000 Liters Chilled)',
        radioChannel: 'DISP-03 (154.900 MHz)',
        avatarColor: 'from-blue-600/30 to-cyan-600/30 text-blue-300 border-blue-500/40',
        shift: '05:30 AM - 01:30 PM',
      },
      {
        name: 'Dr. Meera Gokhale',
        role: 'Emergency Room Triage In-Charge',
        department: 'ER_TRIAGE',
        deptLabel: 'Emergency Room Triage',
        equipment: 'Heatstroke Cooling Bed #04 Active',
        radioChannel: 'MED-02 (155.150 MHz)',
        avatarColor: 'from-teal-600/30 to-emerald-600/30 text-teal-300 border-teal-500/40',
        shift: '07:00 AM - 03:00 PM',
      },
      {
        name: 'Pravin Kulkarni',
        role: 'Rapid Response Heatstroke Technician',
        department: 'PARAMEDICS',
        deptLabel: 'ALS Paramedics & Drivers',
        equipment: 'Rapid Response Bike Ambulances #RR-02',
        radioChannel: 'EMS-02 (155.025 MHz)',
        avatarColor: 'from-purple-600/30 to-pink-600/30 text-purple-300 border-purple-500/40',
        shift: '08:00 AM - 04:00 PM',
      },
      {
        name: 'Deepa Shah',
        role: 'ASHA Urban Outreach Specialist',
        department: 'ASHA_HEALTH',
        deptLabel: 'Community Health & ASHA',
        equipment: 'ORS Hydration Satchel • Infrared Thermometer',
        radioChannel: 'CH-05 (154.875 MHz)',
        avatarColor: 'from-indigo-600/30 to-sky-600/30 text-indigo-300 border-indigo-500/40',
        shift: '06:30 AM - 02:30 PM',
      },
      {
        name: 'Sachin Kadam',
        role: 'Mobile Misting Canopy Lead Operator',
        department: 'HYDRATION',
        deptLabel: 'Hydration Logistics',
        equipment: 'Misting Canopy Unit #MIST-02 (High Pressure)',
        radioChannel: 'DISP-05 (154.950 MHz)',
        avatarColor: 'from-cyan-600/30 to-teal-600/30 text-cyan-300 border-cyan-500/40',
        shift: '09:00 AM - 05:00 PM',
      },
      {
        name: 'Dr. Aarti More',
        role: 'Thermal Trauma Specialist & ICU Lead',
        department: 'ER_TRIAGE',
        deptLabel: 'Emergency Room Triage',
        equipment: 'Hypothermia Induction Machine • 6 ICU Beds',
        radioChannel: 'MED-03 (155.180 MHz)',
        avatarColor: 'from-emerald-600/30 to-sky-600/30 text-emerald-300 border-emerald-500/40',
        shift: '08:00 AM - 04:00 PM',
      },
      {
        name: 'Tanvi Sawant',
        role: 'Auxiliary Nurse Midwife (ANM Heat Squad)',
        department: 'ASHA_HEALTH',
        deptLabel: 'Community Health & ASHA',
        equipment: 'Maternal Hydration Packs • Cold Compress',
        radioChannel: 'CH-06 (154.900 MHz)',
        avatarColor: 'from-sky-600/30 to-indigo-600/30 text-sky-300 border-sky-500/40',
        shift: '07:30 AM - 03:30 PM',
      },
      {
        name: 'Prasad Jadhav',
        role: 'Urban Heat Island Patrol Officer',
        department: 'HEAT_WARDENS',
        deptLabel: 'Municipal Heat Wardens',
        equipment: 'Infrared Thermal Scanner • Megaphone',
        radioChannel: 'CH-03 (154.750 MHz)',
        avatarColor: 'from-amber-600/30 to-orange-600/30 text-amber-300 border-amber-500/40',
        shift: '09:00 AM - 05:00 PM',
      },
    ];
  }

  // South India (Bengaluru, Hyderabad, Chennai, Karnataka, Telangana, Tamil Nadu)
  if (
    norm.includes('bengaluru') ||
    norm.includes('hyderabad') ||
    norm.includes('chennai') ||
    norm.includes('karnataka') ||
    norm.includes('telangana') ||
    norm.includes('tamil')
  ) {
    return [
      {
        name: 'Dr. K. Ramesh, MD',
        role: 'Chief Medical Officer & Casualty Coordinator',
        department: 'ER_TRIAGE',
        deptLabel: 'Emergency Room Triage',
        equipment: 'Trauma Bay 1 • Defibrillator Ready',
        radioChannel: 'MED-01 (155.100 MHz)',
        avatarColor: 'from-emerald-600/30 to-teal-600/30 text-emerald-300 border-emerald-500/40',
        shift: '06:00 AM - 02:00 PM',
      },
      {
        name: 'Priya Nair',
        role: 'Lead Community Health Officer (ASHA Unit 4)',
        department: 'ASHA_HEALTH',
        deptLabel: 'Community Health & ASHA',
        equipment: '500x ORS Sachets • Digital Oximeter',
        radioChannel: 'CH-04 (154.850 MHz)',
        avatarColor: 'from-sky-600/30 to-indigo-600/30 text-sky-300 border-sky-500/40',
        shift: '07:00 AM - 03:00 PM',
      },
      {
        name: 'Suresh Reddy',
        role: 'Senior ALS Paramedic & Emergency Driver',
        department: 'PARAMEDICS',
        deptLabel: 'ALS Paramedics & Drivers',
        equipment: 'ALS Ambulance #108-Alpha • Ice Bath Unit',
        radioChannel: 'EMS-08 (155.050 MHz)',
        avatarColor: 'from-rose-600/30 to-amber-600/30 text-rose-300 border-rose-500/40',
        shift: '06:00 AM - 06:00 PM',
      },
      {
        name: 'Venkatesh Murthy',
        role: 'Municipal Heat Warden & Labor Inspector',
        department: 'HEAT_WARDENS',
        deptLabel: 'Municipal Heat Wardens',
        equipment: 'WBGT Heat Meter • Decibel Meter',
        radioChannel: 'CH-02 (154.700 MHz)',
        avatarColor: 'from-amber-600/30 to-orange-600/30 text-amber-300 border-amber-500/40',
        shift: '08:00 AM - 04:00 PM',
      },
      {
        name: 'Karthik Varma',
        role: 'Heavy Water Tanker Logistics Operator',
        department: 'HYDRATION',
        deptLabel: 'Hydration Logistics',
        equipment: 'Tanker WT-04 (12,000 Liters Chilled)',
        radioChannel: 'DISP-03 (154.900 MHz)',
        avatarColor: 'from-blue-600/30 to-cyan-600/30 text-blue-300 border-blue-500/40',
        shift: '05:30 AM - 01:30 PM',
      },
      {
        name: 'Dr. Lakshmi Sundaram',
        role: 'Emergency Room Triage In-Charge',
        department: 'ER_TRIAGE',
        deptLabel: 'Emergency Room Triage',
        equipment: 'Heatstroke Cooling Bed #04 Active',
        radioChannel: 'MED-02 (155.150 MHz)',
        avatarColor: 'from-teal-600/30 to-emerald-600/30 text-teal-300 border-teal-500/40',
        shift: '07:00 AM - 03:00 PM',
      },
      {
        name: 'Divya Pillai',
        role: 'Rapid Response Heatstroke Technician',
        department: 'PARAMEDICS',
        deptLabel: 'ALS Paramedics & Drivers',
        equipment: 'Rapid Response Bike Ambulances #RR-02',
        radioChannel: 'EMS-02 (155.025 MHz)',
        avatarColor: 'from-purple-600/30 to-pink-600/30 text-purple-300 border-purple-500/40',
        shift: '08:00 AM - 04:00 PM',
      },
      {
        name: 'Ananya Rao',
        role: 'ASHA Urban Outreach Specialist',
        department: 'ASHA_HEALTH',
        deptLabel: 'Community Health & ASHA',
        equipment: 'ORS Hydration Satchel • Infrared Thermometer',
        radioChannel: 'CH-05 (154.875 MHz)',
        avatarColor: 'from-indigo-600/30 to-sky-600/30 text-indigo-300 border-indigo-500/40',
        shift: '06:30 AM - 02:30 PM',
      },
      {
        name: 'Arvind Swamy',
        role: 'Mobile Misting Canopy Lead Operator',
        department: 'HYDRATION',
        deptLabel: 'Hydration Logistics',
        equipment: 'Misting Canopy Unit #MIST-02 (High Pressure)',
        radioChannel: 'DISP-05 (154.950 MHz)',
        avatarColor: 'from-cyan-600/30 to-teal-600/30 text-cyan-300 border-cyan-500/40',
        shift: '09:00 AM - 05:00 PM',
      },
      {
        name: 'Dr. Mohan Kumar',
        role: 'Thermal Trauma Specialist & ICU Lead',
        department: 'ER_TRIAGE',
        deptLabel: 'Emergency Room Triage',
        equipment: 'Hypothermia Induction Machine • 6 ICU Beds',
        radioChannel: 'MED-03 (155.180 MHz)',
        avatarColor: 'from-emerald-600/30 to-sky-600/30 text-emerald-300 border-emerald-500/40',
        shift: '08:00 AM - 04:00 PM',
      },
      {
        name: 'Preeti Krishnan',
        role: 'Auxiliary Nurse Midwife (ANM Heat Unit)',
        department: 'ASHA_HEALTH',
        deptLabel: 'Community Health & ASHA',
        equipment: 'Maternal Hydration Packs • Cold Compress',
        radioChannel: 'CH-06 (154.900 MHz)',
        avatarColor: 'from-sky-600/30 to-indigo-600/30 text-sky-300 border-sky-500/40',
        shift: '07:30 AM - 03:30 PM',
      },
      {
        name: 'Harish Raghavan',
        role: 'Urban Heat Island Patrol Officer',
        department: 'HEAT_WARDENS',
        deptLabel: 'Municipal Heat Wardens',
        equipment: 'Infrared Thermal Scanner • Megaphone',
        radioChannel: 'CH-03 (154.750 MHz)',
        avatarColor: 'from-amber-600/30 to-orange-600/30 text-amber-300 border-amber-500/40',
        shift: '09:00 AM - 05:00 PM',
      },
    ];
  }

  // East & North-East India (Kolkata, Guwahati, Assam, Bengal, Darjeeling)
  if (
    norm.includes('kolkata') ||
    norm.includes('guwahati') ||
    norm.includes('assam') ||
    norm.includes('bengal') ||
    norm.includes('darjeeling')
  ) {
    return [
      {
        name: 'Dr. Subrata Ghosh, MD',
        role: 'Chief Medical Officer & Casualty Coordinator',
        department: 'ER_TRIAGE',
        deptLabel: 'Emergency Room Triage',
        equipment: 'Trauma Bay 1 • Defibrillator Ready',
        radioChannel: 'MED-01 (155.100 MHz)',
        avatarColor: 'from-emerald-600/30 to-teal-600/30 text-emerald-300 border-emerald-500/40',
        shift: '06:00 AM - 02:00 PM',
      },
      {
        name: 'Debolina Roy',
        role: 'Lead Community Health Officer (ASHA Unit 4)',
        department: 'ASHA_HEALTH',
        deptLabel: 'Community Health & ASHA',
        equipment: '500x ORS Sachets • Digital Oximeter',
        radioChannel: 'CH-04 (154.850 MHz)',
        avatarColor: 'from-sky-600/30 to-indigo-600/30 text-sky-300 border-sky-500/40',
        shift: '07:00 AM - 03:00 PM',
      },
      {
        name: 'Pradip Das',
        role: 'Senior ALS Paramedic & Emergency Driver',
        department: 'PARAMEDICS',
        deptLabel: 'ALS Paramedics & Drivers',
        equipment: 'ALS Ambulance #108-Alpha • Ice Bath Unit',
        radioChannel: 'EMS-08 (155.050 MHz)',
        avatarColor: 'from-rose-600/30 to-amber-600/30 text-rose-300 border-rose-500/40',
        shift: '06:00 AM - 06:00 PM',
      },
      {
        name: 'Moushumi Sen',
        role: 'Municipal Heat Warden & Labor Inspector',
        department: 'HEAT_WARDENS',
        deptLabel: 'Municipal Heat Wardens',
        equipment: 'WBGT Heat Meter • Decibel Meter',
        radioChannel: 'CH-02 (154.700 MHz)',
        avatarColor: 'from-amber-600/30 to-orange-600/30 text-amber-300 border-amber-500/40',
        shift: '08:00 AM - 04:00 PM',
      },
      {
        name: 'Anupam Barua',
        role: 'Heavy Water Tanker Logistics Operator',
        department: 'HYDRATION',
        deptLabel: 'Hydration Logistics',
        equipment: 'Tanker WT-04 (12,000 Liters Chilled)',
        radioChannel: 'DISP-03 (154.900 MHz)',
        avatarColor: 'from-blue-600/30 to-cyan-600/30 text-blue-300 border-blue-500/40',
        shift: '05:30 AM - 01:30 PM',
      },
      {
        name: 'Dr. Sanjoy Mondal',
        role: 'Emergency Room Triage In-Charge',
        department: 'ER_TRIAGE',
        deptLabel: 'Emergency Room Triage',
        equipment: 'Heatstroke Cooling Bed #04 Active',
        radioChannel: 'MED-02 (155.150 MHz)',
        avatarColor: 'from-teal-600/30 to-emerald-600/30 text-teal-300 border-teal-500/40',
        shift: '07:00 AM - 03:00 PM',
      },
      {
        name: 'Tenzing Norbu',
        role: 'Rapid Response Heatstroke Technician',
        department: 'PARAMEDICS',
        deptLabel: 'ALS Paramedics & Drivers',
        equipment: 'Rapid Response Bike Ambulances #RR-02',
        radioChannel: 'EMS-02 (155.025 MHz)',
        avatarColor: 'from-purple-600/30 to-pink-600/30 text-purple-300 border-purple-500/40',
        shift: '08:00 AM - 04:00 PM',
      },
      {
        name: 'Pratima Borah',
        role: 'ASHA Urban Outreach Specialist',
        department: 'ASHA_HEALTH',
        deptLabel: 'Community Health & ASHA',
        equipment: 'ORS Hydration Satchel • Infrared Thermometer',
        radioChannel: 'CH-05 (154.875 MHz)',
        avatarColor: 'from-indigo-600/30 to-sky-600/30 text-indigo-300 border-indigo-500/40',
        shift: '06:30 AM - 02:30 PM',
      },
      {
        name: 'Siddhartha Ray',
        role: 'Mobile Misting Canopy Lead Operator',
        department: 'HYDRATION',
        deptLabel: 'Hydration Logistics',
        equipment: 'Misting Canopy Unit #MIST-02 (High Pressure)',
        radioChannel: 'DISP-05 (154.950 MHz)',
        avatarColor: 'from-cyan-600/30 to-teal-600/30 text-cyan-300 border-cyan-500/40',
        shift: '09:00 AM - 05:00 PM',
      },
      {
        name: 'Dr. Bipasha Dutta',
        role: 'Thermal Trauma Specialist & ICU Lead',
        department: 'ER_TRIAGE',
        deptLabel: 'Emergency Room Triage',
        equipment: 'Hypothermia Induction Machine • 6 ICU Beds',
        radioChannel: 'MED-03 (155.180 MHz)',
        avatarColor: 'from-emerald-600/30 to-sky-600/30 text-emerald-300 border-emerald-500/40',
        shift: '08:00 AM - 04:00 PM',
      },
      {
        name: 'Sharmila Das',
        role: 'Auxiliary Nurse Midwife (ANM Heat Unit)',
        department: 'ASHA_HEALTH',
        deptLabel: 'Community Health & ASHA',
        equipment: 'Maternal Hydration Packs • Cold Compress',
        radioChannel: 'CH-06 (154.900 MHz)',
        avatarColor: 'from-sky-600/30 to-indigo-600/30 text-sky-300 border-sky-500/40',
        shift: '07:30 AM - 03:30 PM',
      },
      {
        name: 'Anirban Bhattacharya',
        role: 'Urban Heat Island Patrol Officer',
        department: 'HEAT_WARDENS',
        deptLabel: 'Municipal Heat Wardens',
        equipment: 'Infrared Thermal Scanner • Megaphone',
        radioChannel: 'CH-03 (154.750 MHz)',
        avatarColor: 'from-amber-600/30 to-orange-600/30 text-amber-300 border-amber-500/40',
        shift: '09:00 AM - 05:00 PM',
      },
    ];
  }

  // Default North India (Delhi, Gurgaon, Sohna, Haryana, UP, Rajasthan, etc.)
  return [
    {
      name: 'Dr. Arvind Saxena, MD',
      role: 'Chief Medical Officer & Casualty Coordinator',
      department: 'ER_TRIAGE',
      deptLabel: 'Emergency Room Triage',
      equipment: 'Trauma Bay 1 • Defibrillator Ready',
      radioChannel: 'MED-01 (155.100 MHz)',
      avatarColor: 'from-emerald-600/30 to-teal-600/30 text-emerald-300 border-emerald-500/40',
      shift: '06:00 AM - 02:00 PM',
    },
    {
      name: 'Pooja Sharma',
      role: 'Lead Community Health Officer (ASHA Unit 4)',
      department: 'ASHA_HEALTH',
      deptLabel: 'Community Health & ASHA',
      equipment: '500x ORS Sachets • Digital Oximeter',
      radioChannel: 'CH-04 (154.850 MHz)',
      avatarColor: 'from-sky-600/30 to-indigo-600/30 text-sky-300 border-sky-500/40',
      shift: '07:00 AM - 03:00 PM',
    },
    {
      name: 'Rajesh Kumar',
      role: 'Senior ALS Paramedic & Emergency Driver',
      department: 'PARAMEDICS',
      deptLabel: 'ALS Paramedics & Drivers',
      equipment: 'ALS Ambulance #108-Alpha • Ice Bath Unit',
      radioChannel: 'EMS-08 (155.050 MHz)',
      avatarColor: 'from-rose-600/30 to-amber-600/30 text-rose-300 border-rose-500/40',
      shift: '06:00 AM - 06:00 PM',
    },
    {
      name: 'Suresh Verma',
      role: 'Municipal Heat Warden & Labor Inspector',
      department: 'HEAT_WARDENS',
      deptLabel: 'Municipal Heat Wardens',
      equipment: 'WBGT Heat Meter • Decibel Meter',
      radioChannel: 'CH-02 (154.700 MHz)',
      avatarColor: 'from-amber-600/30 to-orange-600/30 text-amber-300 border-amber-500/40',
      shift: '08:00 AM - 04:00 PM',
    },
    {
      name: 'Manoj Tiwari',
      role: 'Heavy Water Tanker Logistics Operator',
      department: 'HYDRATION',
      deptLabel: 'Hydration Logistics',
      equipment: 'Tanker WT-04 (12,000 Liters Chilled)',
      radioChannel: 'DISP-03 (154.900 MHz)',
      avatarColor: 'from-blue-600/30 to-cyan-600/30 text-blue-300 border-blue-500/40',
      shift: '05:30 AM - 01:30 PM',
    },
    {
      name: 'Dr. Anjali Mehta',
      role: 'Emergency Room Triage In-Charge',
      department: 'ER_TRIAGE',
      deptLabel: 'Emergency Room Triage',
      equipment: 'Heatstroke Cooling Bed #04 Active',
      radioChannel: 'MED-02 (155.150 MHz)',
      avatarColor: 'from-teal-600/30 to-emerald-600/30 text-teal-300 border-teal-500/40',
      shift: '07:00 AM - 03:00 PM',
    },
    {
      name: 'Vikram Singh',
      role: 'Rapid Response Heatstroke Technician',
      department: 'PARAMEDICS',
      deptLabel: 'ALS Paramedics & Drivers',
      equipment: 'Rapid Response Bike Ambulances #RR-02',
      radioChannel: 'EMS-02 (155.025 MHz)',
      avatarColor: 'from-purple-600/30 to-pink-600/30 text-purple-300 border-purple-500/40',
      shift: '08:00 AM - 04:00 PM',
    },
    {
      name: 'Sunita Devi',
      role: 'ASHA Urban Outreach Specialist',
      department: 'ASHA_HEALTH',
      deptLabel: 'Community Health & ASHA',
      equipment: 'ORS Hydration Satchel • Infrared Thermometer',
      radioChannel: 'CH-05 (154.875 MHz)',
      avatarColor: 'from-indigo-600/30 to-sky-600/30 text-indigo-300 border-indigo-500/40',
      shift: '06:30 AM - 02:30 PM',
    },
    {
      name: 'Rakesh Yadav',
      role: 'Mobile Misting Canopy Lead Operator',
      department: 'HYDRATION',
      deptLabel: 'Hydration Logistics',
      equipment: 'Misting Canopy Unit #MIST-02 (High Pressure)',
      radioChannel: 'DISP-05 (154.950 MHz)',
      avatarColor: 'from-cyan-600/30 to-teal-600/30 text-cyan-300 border-cyan-500/40',
      shift: '09:00 AM - 05:00 PM',
    },
    {
      name: 'Dr. Neha Kapoor',
      role: 'Thermal Trauma Specialist & ICU Lead',
      department: 'ER_TRIAGE',
      deptLabel: 'Emergency Room Triage',
      equipment: 'Hypothermia Induction Machine • 6 ICU Beds',
      radioChannel: 'MED-03 (155.180 MHz)',
      avatarColor: 'from-emerald-600/30 to-sky-600/30 text-emerald-300 border-emerald-500/40',
      shift: '08:00 AM - 04:00 PM',
    },
    {
      name: 'Rekha Gupta',
      role: 'Auxiliary Nurse Midwife (ANM Heat Unit)',
      department: 'ASHA_HEALTH',
      deptLabel: 'Community Health & ASHA',
      equipment: 'Maternal Hydration Packs • Cold Compress',
      radioChannel: 'CH-06 (154.900 MHz)',
      avatarColor: 'from-sky-600/30 to-indigo-600/30 text-sky-300 border-sky-500/40',
      shift: '07:30 AM - 03:30 PM',
    },
    {
      name: 'Pradeep Tyagi',
      role: 'Urban Heat Island Patrol Officer',
      department: 'HEAT_WARDENS',
      deptLabel: 'Municipal Heat Wardens',
      equipment: 'Infrared Thermal Scanner • Megaphone',
      radioChannel: 'CH-03 (154.750 MHz)',
      avatarColor: 'from-amber-600/30 to-orange-600/30 text-amber-300 border-amber-500/40',
      shift: '09:00 AM - 05:00 PM',
    },
  ];
}

function getPhonePrefix(region: MunicipalRegion): string {
  const norm = (region.state + ' ' + region.name).toLowerCase();
  if (norm.includes('maharashtra') || norm.includes('mumbai') || norm.includes('pune')) return '9820';
  if (norm.includes('gujarat') || norm.includes('ahmedabad')) return '9825';
  if (norm.includes('karnataka') || norm.includes('bengaluru')) return '9845';
  if (norm.includes('tamil') || norm.includes('chennai')) return '9840';
  if (norm.includes('bengal') || norm.includes('kolkata')) return '9830';
  if (norm.includes('assam') || norm.includes('guwahati')) return '9864';
  if (norm.includes('rajasthan') || norm.includes('jaipur')) return '9829';
  if (norm.includes('telangana') || norm.includes('hyderabad')) return '9849';
  return '9810'; // Delhi / NCR default
}

export function generatePersonnelForRegion(region: MunicipalRegion, wards: Ward[]): Personnel[] {
  const profiles = getRegionalStaffProfiles(region);
  const phonePrefix = getPhonePrefix(region);
  const effectiveWards = wards && wards.length > 0 ? wards : [];

  const personnelCount = Math.max(12, Math.min(24, effectiveWards.length > 0 ? effectiveWards.length : 12));
  const list: Personnel[] = [];

  for (let i = 0; i < personnelCount; i++) {
    const profile = profiles[i % profiles.length];
    const assignedWard = effectiveWards.length > 0 ? effectiveWards[i % effectiveWards.length] : null;

    const wardName = assignedWard ? assignedWard.name : `${region.name.split(' ')[0]} Central Sector ${i + 1}`;
    const zone = assignedWard ? assignedWard.zone : `Zone ${Math.floor(i / 3) + 1} - ${region.name.split(' ')[0]}`;
    const wardUtci = assignedWard?.currentMetrics?.utci ?? 38.5;
    const wardId = assignedWard ? assignedWard.id : `ward-${region.id}-${i + 1}`;

    // Status distribution: ~75% ON_DUTY, ~15% HEATBREAK_REST, ~10% STANDBY
    let status: 'ON_DUTY' | 'HEATBREAK_REST' | 'STANDBY' = 'ON_DUTY';
    if (i % 6 === 3) status = 'HEATBREAK_REST';
    else if (i % 7 === 6) status = 'STANDBY';

    list.push({
      id: `emp-${region.id.slice(0, 3)}-${String(i + 1).padStart(2, '0')}`,
      code: `EMP-${1000 + (i + 1) * 43}`,
      name: profile.name,
      role: profile.role,
      department: profile.department,
      deptLabel: profile.deptLabel,
      wardId,
      wardName,
      zone,
      status,
      shift: profile.shift,
      currentUtci: Number(wardUtci.toFixed(1)),
      contact: `+91 ${phonePrefix}${i} ${12340 + i}`,
      radioFrequency: profile.radioChannel,
      equipment: profile.equipment,
      lastHydrationMinutesAgo: status === 'HEATBREAK_REST' ? 5 : (i * 7 + 10) % 50,
      avatarColor: profile.avatarColor,
    });
  }

  return list;
}

export const HumanResourcesPage: React.FC = () => {
  const { user } = useAuth();
  const roleType = user?.roleType || 'controller';

  const { activeRegion, setActiveRegion, wards, selectedWard, setSelectedWard } = useHeatwave();

  // All available municipal regions (preset + user saved)
  const availableRegions = useMemo(() => getAllRegions(), []);

  // Selected ward filter: 'ALL' or specific ward ID
  const [selectedWardFilter, setSelectedWardFilter] = useState<string>(() => selectedWard?.id || 'ALL');

  // Sync ward filter if context selectedWard changes externally
  useEffect(() => {
    if (selectedWard) {
      setSelectedWardFilter(selectedWard.id);
    }
  }, [selectedWard]);

  // Personnel roster state initialized and synced with activeRegion and wards
  const [personnelList, setPersonnelList] = useState<Personnel[]>(() =>
    generatePersonnelForRegion(activeRegion, wards)
  );

  useEffect(() => {
    setPersonnelList(generatePersonnelForRegion(activeRegion, wards));
  }, [activeRegion.id, wards]);

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
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Toggle heatbreak for a staff member (with live KPI reaction)
  const handleToggleHeatbreak = (id: string) => {
    playDispatchSound();
    setPersonnelList((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const nextStatus = p.status === 'ON_DUTY' ? 'HEATBREAK_REST' : 'ON_DUTY';
          showToast(
            `${p.name} (${p.wardName}): status updated to ${
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

  // Ping staff member's radio channel
  const handleRadioCheck = (person: Personnel) => {
    playDispatchSound();
    showToast(`Radio frequency ${person.radioFrequency} pinged for ${person.name}. Signal nominal in ${person.zone}.`);
  };

  // CSV Export with dynamic location data
  const handleExportRoster = () => {
    playDispatchSound();
    const headers = [
      'Employee ID',
      'Name',
      'Role',
      'Department',
      'Ward Name',
      'Zone',
      'Status',
      'Shift',
      'Current UTCI (°C)',
      'Contact',
      'Radio Frequency',
      'Equipment',
    ];
    const rows = filteredPersonnel.map((p) => [
      `"${p.code}"`,
      `"${p.name}"`,
      `"${p.role}"`,
      `"${p.deptLabel}"`,
      `"${p.wardName}"`,
      `"${p.zone}"`,
      `"${p.status}"`,
      `"${p.shift}"`,
      `"${p.currentUtci}"`,
      `"${p.contact}"`,
      `"${p.radioFrequency}"`,
      `"${p.equipment || 'Standard Kit'}"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const sanitizedFileName = `${activeRegion.name.replace(/[^a-zA-Z0-9]/g, '_')}_Roster_${new Date().toISOString().slice(0, 10)}.csv`;
    link.setAttribute('download', sanitizedFileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Exported ${filteredPersonnel.length} personnel records for ${activeRegion.name} (${sanitizedFileName}).`);
  };

  // Broadcast Heatbreak Directive across active sectors
  const handleBroadcastDirective = () => {
    playDispatchSound();
    setPersonnelList((prev) =>
      prev.map((p, idx) => {
        if (p.status === 'ON_DUTY' && (p.currentUtci >= 40 || idx % 3 === 0)) {
          return { ...p, status: 'HEATBREAK_REST', lastHydrationMinutesAgo: 0 };
        }
        return p;
      })
    );
    showToast(
      `Directive broadcasted for ${activeRegion.name}: Mandatory 15-min Shaded Rest ordered for all high-exposure sectors.`
    );
  };

  // Switch region handler
  const handleRegionChange = (newRegionId: string) => {
    const matched = availableRegions.find((r) => r.id === newRegionId);
    if (matched) {
      setActiveRegion(matched);
      setSelectedWardFilter('ALL');
      setSelectedWard(null);
      showToast(`Switched active operational command to ${matched.name} (${matched.state})`);
    }
  };

  // Switch ward handler
  const handleWardChange = (wardId: string) => {
    setSelectedWardFilter(wardId);
    if (wardId === 'ALL') {
      setSelectedWard(null);
      showToast(`Showing all monitored wards across ${activeRegion.name}`);
    } else {
      const matched = wards.find((w) => w.id === wardId);
      if (matched) {
        setSelectedWard(matched);
        showToast(`Filtered tactical roster for ${matched.name}`);
      }
    }
  };

  // Find currently selected ward object
  const currentSelectedWard = useMemo(() => {
    if (selectedWardFilter === 'ALL') return null;
    return wards.find((w) => w.id === selectedWardFilter) || null;
  }, [selectedWardFilter, wards]);

  // City display name
  const cityName = useMemo(() => {
    return activeRegion.name.split(' ')[0] || activeRegion.name;
  }, [activeRegion.name]);

  // Filtered personnel based on Ward filter, Search Query, Department, and Status
  const filteredPersonnel = useMemo(() => {
    return personnelList.filter((p) => {
      const matchesWard = selectedWardFilter === 'ALL' || p.wardId === selectedWardFilter;

      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.role.toLowerCase().includes(q) ||
        p.wardName.toLowerCase().includes(q) ||
        p.zone.toLowerCase().includes(q) ||
        p.contact.includes(q);

      const matchesDept = selectedDept === 'ALL' || p.department === selectedDept;
      const matchesStatus = selectedStatus === 'ALL' || p.status === selectedStatus;

      return matchesWard && matchesSearch && matchesDept && matchesStatus;
    });
  }, [personnelList, selectedWardFilter, searchQuery, selectedDept, selectedStatus]);

  // Targeted personnel for KPI computation (scoped to active ward if filtered, else all in region)
  const scopedPersonnel = useMemo(() => {
    if (selectedWardFilter === 'ALL') return personnelList;
    return personnelList.filter((p) => p.wardId === selectedWardFilter);
  }, [personnelList, selectedWardFilter]);

  // Scaled & real-time KPI metrics
  const totalWardsCount = wards.length || 18;
  const isSingleWard = Boolean(currentSelectedWard);

  // For statewide/citywide overview, scale squad leaders by 6.2 to reflect full municipal grid;
  // For a single ward, show actual tactical roster for that sector
  const totalTaskForceValue = useMemo(() => {
    if (isSingleWard) return scopedPersonnel.length * 2;
    return Math.max(124, Math.round(totalWardsCount * 6.2));
  }, [isSingleWard, scopedPersonnel.length, totalWardsCount]);

  const activeCount = scopedPersonnel.filter((p) => p.status === 'ON_DUTY').length;
  const heatbreakCount = scopedPersonnel.filter((p) => p.status === 'HEATBREAK_REST').length;
  const standbyCount = scopedPersonnel.filter((p) => p.status === 'STANDBY').length;

  const activeOnDutyValue = useMemo(() => {
    if (isSingleWard) return activeCount * 2;
    const ratio = scopedPersonnel.length > 0 ? activeCount / scopedPersonnel.length : 0.88;
    return Math.round(totalTaskForceValue * ratio);
  }, [isSingleWard, activeCount, scopedPersonnel.length, totalTaskForceValue]);

  const heatbreakRotationValue = useMemo(() => {
    if (isSingleWard) return heatbreakCount * 2;
    const ratio = scopedPersonnel.length > 0 ? heatbreakCount / scopedPersonnel.length : 0.11;
    return Math.max(8, Math.round(totalTaskForceValue * ratio));
  }, [isSingleWard, heatbreakCount, scopedPersonnel.length, totalTaskForceValue]);

  const standbyReservesValue = useMemo(() => {
    if (isSingleWard) return standbyCount * 2;
    const ratio = scopedPersonnel.length > 0 ? standbyCount / scopedPersonnel.length : 0.13;
    return Math.max(12, Math.round(totalTaskForceValue * ratio));
  }, [isSingleWard, standbyCount, scopedPersonnel.length, totalTaskForceValue]);

  const attendanceRate = useMemo(() => {
    if (scopedPersonnel.length === 0) return '98.4';
    return (((activeCount + heatbreakCount) / scopedPersonnel.length) * 100).toFixed(1);
  }, [scopedPersonnel.length, activeCount, heatbreakCount]);

  const avgUtci = useMemo(() => {
    if (currentSelectedWard) return currentSelectedWard.currentMetrics?.utci.toFixed(1) || '40.5';
    if (scopedPersonnel.length === 0) return '39.8';
    const sum = scopedPersonnel.reduce((acc, p) => acc + p.currentUtci, 0);
    return (sum / scopedPersonnel.length).toFixed(1);
  }, [currentSelectedWard, scopedPersonnel]);

  // Role metadata configurations adapted dynamically per active region & ward
  const roleMeta = useMemo(() => {
    const regionStateUpper = (activeRegion.state || 'INTER-AGENCY').toUpperCase();
    const regionName = activeRegion.name;

    const baseTitles = {
      controller: {
        badge: isSingleWard
          ? `WARD L4 // ${currentSelectedWard?.name.toUpperCase()} COMMAND`
          : `SEOC L4 // ${regionStateUpper} RELIEF ROSTER`,
        badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        title: isSingleWard
          ? `${currentSelectedWard?.name} Relief Task Force & Tactical Squad`
          : `${regionName} Disaster Relief Task Force & Roster`,
        subtitle: isSingleWard
          ? `Tactical first responders, field community health officers, and triage liaisons deployed in ${currentSelectedWard?.name} (${currentSelectedWard?.zone}).`
          : `Command personnel, inter-agency liaison officers, medical reserve corps, and ${activeRegion.state || 'state'} civil defense response teams across ${totalWardsCount} monitored municipal sectors.`,
        exportLabel: `Export ${cityName} Roster (CSV)`,
        broadcastLabel: 'Broadcast Heatbreak Directive',
        protocolTitle: isSingleWard
          ? `${currentSelectedWard?.name} - Sector Heat Safety Protocol Active`
          : `${activeRegion.state || 'State'} Disaster Management Authority (${regionName}) Active`,
        protocolDesc: isSingleWard
          ? `Mandatory 15-min shaded hydration break every 45 minutes for all field workers stationed in ${currentSelectedWard?.name} (${avgUtci}°C UTCI).`
          : `Mandatory heat shelter shifts and emergency deployment rotations for all ${totalWardsCount} municipal ward sectors in ${regionName}.`,
        kpi1Title: 'Total Task Force',
        kpi1Sub: isSingleWard
          ? `Sector Deployment for ${currentSelectedWard?.name}`
          : `Deployments Across ${totalWardsCount} Wards in ${cityName}`,
        kpi1Tag: isSingleWard ? '100% Ward Coverage' : '100% Operational Grid',
        kpi2Title: 'Active On-Duty',
        kpi2Sub: isSingleWard ? `Deployed in ${currentSelectedWard?.zone}` : 'Command Staff & Inter-Agency Officers',
        kpi2Tag: `${attendanceRate}% Roster Attendance`,
        kpi3Title: 'Heatbreak Rotation',
        kpi3Sub: `HeatWave Shift Protocol (UTCI > 40°C • Current ${avgUtci}°C)`,
        kpi3Tag: '45m Work / 15m Shaded Rest',
        kpi4Title: 'Standby Reserves',
        kpi4Sub: isSingleWard
          ? `${currentSelectedWard?.zone} Tactical Reserve`
          : `${activeRegion.state || cityName} Tactical Reserve`,
        kpi4Tag: '~3 min Mobilization SLA',
      },
      disaster_officer: {
        badge: isSingleWard
          ? `MUNI L3 // ${currentSelectedWard?.name.toUpperCase()} CLINICAL SQUAD`
          : `MUNI L3 // ${cityName.toUpperCase()} HEALTH CORPS`,
        badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        title: isSingleWard
          ? `${currentSelectedWard?.name} Clinical Heatwave & Community Health Staff`
          : `${regionName} Healthcare Relief Staff & Community Health Liaisons`,
        subtitle: isSingleWard
          ? `Stationed healthcare workers, ASHA community liaisons, and trauma nurses assigned to ${currentSelectedWard?.name}.`
          : `ASHA community coordinators, emergency room trauma nurses, and clinical heatwave triage physicians across ${totalWardsCount} sectors in ${regionName}.`,
        exportLabel: `Export Health Roster (CSV)`,
        broadcastLabel: 'Broadcast Hydration Alert',
        protocolTitle: `${activeRegion.state || 'National'} Heat Action Plan - Clinical Health Protocol Active`,
        protocolDesc: `Mandatory ORS rest periods for all field health liaisons and designated ER cold-bath readiness across ${cityName}.`,
        kpi1Title: 'Health Corps & ASHA',
        kpi1Sub: isSingleWard ? `Clinical Staff in ${currentSelectedWard?.name}` : 'Community Liaisons & Trauma Nurses',
        kpi1Tag: 'Full Clinical Coverage',
        kpi2Title: 'Active Clinical Duty',
        kpi2Sub: isSingleWard ? `Stationed at Ward Clinics` : 'Stationed at Ward Health Centers & ERs',
        kpi2Tag: 'Zero Unattended Clinics',
        kpi3Title: 'Staff Hydration Rest',
        kpi3Sub: `Staggered Cooling Station Breaks (${avgUtci}°C UTCI)`,
        kpi3Tag: '15m Shaded Rest Mandate',
        kpi4Title: 'Hypothermia Bays',
        kpi4Sub: isSingleWard ? 'Trauma Cooling Beds Allocated' : 'Trauma Cooling Beds with On-Call Staff',
        kpi4Tag: 'Instant Triage Ready',
      },
      field_lead: {
        badge: isSingleWard
          ? `TACT L2 // ${currentSelectedWard?.name.toUpperCase()} FIRST RESPONDERS`
          : `TACT L2 // ${cityName.toUpperCase()} FIRST RESPONDERS`,
        badgeColor: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
        title: isSingleWard
          ? `${currentSelectedWard?.name} First Responder Squad & Tactical Fleet`
          : `${regionName} First Responder Rosters & Ground Tactical Squads`,
        subtitle: isSingleWard
          ? `ALS ambulance paramedics, water tanker operators, and heat wardens on patrol in ${currentSelectedWard?.name}.`
          : `ALS ambulance paramedics, water tanker operators, municipal heat wardens, and misting technicians in ${regionName}.`,
        exportLabel: `Export Squad Roster (CSV)`,
        broadcastLabel: 'Field Crew Heatbreak',
        protocolTitle: 'Tactical Field Safety & Hydration Mandate Active',
        protocolDesc: `Mandatory 15-minute shaded hydration break every 45 minutes for all water tanker drivers and heat wardens in ${regionName}.`,
        kpi1Title: 'Ground Fleet Crews',
        kpi1Sub: isSingleWard ? `Field Responders in ${currentSelectedWard?.name}` : 'Tanker Drivers, Paramedics & Techs',
        kpi1Tag: '100% Radio Verified',
        kpi2Title: 'Active Responders',
        kpi2Sub: isSingleWard ? 'On Ward Transit Patrol' : 'On High-Exposure Transit Patrols',
        kpi2Tag: '4.8m Avg SOS Dispatch',
        kpi3Title: 'Hydration Depots',
        kpi3Sub: `Field Refill Stations Staffed (${avgUtci}°C UTCI)`,
        kpi3Tag: 'Active Tanker Top-Off',
        kpi4Title: 'ALS Ambulances',
        kpi4Sub: isSingleWard ? 'Dedicated Mobile ICU Unit' : 'Rapid Response Mobile Units Staged',
        kpi4Tag: 'Engine Running & Staged',
      },
    };

    return baseTitles[roleType as keyof typeof baseTitles] || baseTitles.controller;
  }, [
    activeRegion.state,
    activeRegion.name,
    cityName,
    isSingleWard,
    currentSelectedWard,
    totalWardsCount,
    avgUtci,
    attendanceRate,
    roleType,
  ]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-6 pb-12 font-sans select-none px-2 sm:px-4 lg:px-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 max-w-md animate-bounce">
          <div className="bg-[#181920] border border-emerald-500/40 text-emerald-300 px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-2.5 font-sans text-xs sm:text-sm font-bold card-highlight-rim">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="leading-snug">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* 1. Header Banner */}
      <div className="p-4 sm:p-6 lg:p-7 rounded-3xl bg-[#181920] border border-white/[0.08] flex flex-col xl:flex-row xl:items-center justify-between gap-4 sm:gap-6 w-full shadow-2xl card-highlight-rim">
        <div className="min-w-0 flex-1">
          <div className="flex items-start sm:items-center space-x-3 sm:space-x-4">
            <div className="p-2.5 sm:p-3 rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-400 shrink-0">
              <Users className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                <span
                  className={`px-2.5 py-0.5 text-[10px] sm:text-xs font-mono font-bold rounded-xl border ${roleMeta.badgeColor}`}
                >
                  {roleMeta.badge}
                </span>

                {/* Location Chip */}
                <span className="px-2.5 py-0.5 text-[10px] sm:text-xs font-mono font-bold rounded-xl border bg-sky-500/10 text-sky-300 border-sky-500/30 flex items-center space-x-1">
                  <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                  <span className="truncate">
                    {activeRegion.name} {activeRegion.state ? `(${activeRegion.state})` : ''}
                  </span>
                </span>

                {/* Ward specific badge if active */}
                {isSingleWard && currentSelectedWard && (
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-xl border bg-amber-500/15 text-amber-300 border-amber-500/30 flex items-center space-x-1">
                    <Layers className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>{currentSelectedWard.name}</span>
                  </span>
                )}
              </div>

              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white uppercase tracking-tight leading-snug">
                {roleMeta.title}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium leading-relaxed">
                {roleMeta.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons: Responsive full width on mobile, inline on desktop */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 shrink-0 w-full xl:w-auto pt-2 xl:pt-0">
          <button
            onClick={handleExportRoster}
            className="w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl bg-[#13141a] hover:bg-[#1f2029] text-slate-200 hover:text-white border border-white/[0.08] text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm active:scale-95"
            title="Download CSV roster of all personnel matching current location"
          >
            <Download className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="truncate">{roleMeta.exportLabel}</span>
          </button>

          <button
            onClick={handleBroadcastDirective}
            className="w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm active:scale-95"
            title="Broadcast emergency hydration directive to all field crews"
          >
            <Coffee className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">{roleMeta.broadcastLabel}</span>
          </button>
        </div>
      </div>

      {/* 2. Top 4 Workforce KPI Metric Cards (Responsive Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Task Force */}
        <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-[#181920] border border-white/[0.08] shadow-2xl card-highlight-rim flex flex-col justify-between min-h-[145px]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider text-slate-300 truncate">
              {roleMeta.kpi1Title}
            </span>
            <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30 shrink-0">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2.5">
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-sans tracking-tight">
              {totalTaskForceValue}
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 font-medium mt-0.5 line-clamp-2">
              {roleMeta.kpi1Sub}
            </p>
          </div>
          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-medium text-sky-300">
            <span className="truncate">{roleMeta.kpi1Tag}</span>
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse shrink-0 ml-1.5" />
          </div>
        </div>

        {/* Card 2: Active On-Duty */}
        <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-[#181920] border border-white/[0.08] shadow-2xl card-highlight-rim flex flex-col justify-between min-h-[145px]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider text-slate-300 truncate">
              {roleMeta.kpi2Title}
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2.5">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-sans tracking-tight">
              {activeOnDutyValue}
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 font-medium mt-0.5 line-clamp-2">
              {roleMeta.kpi2Sub}
            </p>
          </div>
          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-medium text-emerald-300">
            <span className="truncate">{roleMeta.kpi2Tag}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0 ml-1.5" />
          </div>
        </div>

        {/* Card 3: Heatbreak Rotation */}
        <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-[#181920] border border-white/[0.08] shadow-2xl card-highlight-rim flex flex-col justify-between min-h-[145px]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider text-slate-300 truncate">
              {roleMeta.kpi3Title}
            </span>
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
              <Coffee className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2.5">
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-sans tracking-tight">
              {heatbreakRotationValue}
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 font-medium mt-0.5 line-clamp-2">
              {roleMeta.kpi3Sub}
            </p>
          </div>
          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-medium text-amber-300">
            <span className="truncate">{roleMeta.kpi3Tag}</span>
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 ml-1.5" />
          </div>
        </div>

        {/* Card 4: Standby Reserves */}
        <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-[#181920] border border-white/[0.08] shadow-2xl card-highlight-rim flex flex-col justify-between min-h-[145px]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider text-slate-300 truncate">
              {roleMeta.kpi4Title}
            </span>
            <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 shrink-0">
              <HeartPulse className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2.5">
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-400 font-sans tracking-tight">
              {standbyReservesValue}
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 font-medium mt-0.5 line-clamp-2">
              {roleMeta.kpi4Sub}
            </p>
          </div>
          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-medium text-rose-300">
            <span className="truncate">{roleMeta.kpi4Tag}</span>
            <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0 ml-1.5" />
          </div>
        </div>
      </div>

      {/* 3. Heatwave Worker Protection & Labor Safety Protocol Callout */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-[#181920] to-rose-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 card-highlight-rim shadow-lg">
        <div className="flex items-start sm:items-center space-x-3 sm:space-x-3.5 min-w-0">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0 mt-0.5 sm:mt-0">
            <Flame className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide leading-snug">
              {roleMeta.protocolTitle}
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5 leading-relaxed">
              {roleMeta.protocolDesc}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0 self-start sm:self-auto pl-10 sm:pl-0">
          <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>SAFETY & PROTOCOL COMPLIANT</span>
          </span>
        </div>
      </div>

      {/* 4. Location Controls, Search, and Multi-filter Toolbar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#181920] border border-white/[0.08] shadow-2xl space-y-4 card-highlight-rim">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 sm:gap-3">
          {/* Search Box */}
          <div className="sm:col-span-2 lg:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search personnel name, ID, role, or ward..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#13141a] border border-white/[0.06] rounded-xl sm:rounded-2xl pl-10 pr-12 py-2 sm:py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/50 transition-all font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* City / Operational Region Selector */}
          <div className="sm:col-span-1 lg:col-span-3 relative flex items-center">
            <div className="w-full relative">
              <Globe className="w-3.5 h-3.5 text-sky-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={activeRegion.id}
                onChange={(e) => handleRegionChange(e.target.value)}
                aria-label="Select Operational Region"
                className="w-full bg-[#13141a] border border-white/[0.06] rounded-xl sm:rounded-2xl pl-8 pr-7 py-2 sm:py-2.5 text-xs font-bold text-slate-200 focus:outline-none focus:border-sky-500/50 cursor-pointer truncate appearance-none"
              >
                {availableRegions.map((region) => (
                  <option key={region.id} value={region.id} className="bg-[#181920] text-slate-200">
                    📍 {region.name} {region.state ? `(${region.state})` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Ward Sector Filter Dropdown */}
          <div className="sm:col-span-1 lg:col-span-3 relative flex items-center">
            <div className="w-full relative">
              <Layers className="w-3.5 h-3.5 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedWardFilter}
                onChange={(e) => handleWardChange(e.target.value)}
                aria-label="Filter by Ward Sector"
                className="w-full bg-[#13141a] border border-white/[0.06] rounded-xl sm:rounded-2xl pl-8 pr-7 py-2 sm:py-2.5 text-xs font-bold text-slate-200 focus:outline-none focus:border-sky-500/50 cursor-pointer truncate appearance-none"
              >
                <option value="ALL" className="bg-[#181920] text-slate-200">
                  All Wards in {cityName} ({totalWardsCount} Sectors)
                </option>
                {wards.map((ward) => (
                  <option key={ward.id} value={ward.id} className="bg-[#181920] text-slate-200">
                    {ward.name} ({ward.currentMetrics?.utci}°C UTCI)
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Duty Status Filter */}
          <div className="sm:col-span-2 lg:col-span-2 relative flex items-center">
            <div className="w-full relative">
              <Filter className="w-3.5 h-3.5 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                aria-label="Filter by duty status"
                className="w-full bg-[#13141a] border border-white/[0.06] rounded-xl sm:rounded-2xl pl-8 pr-7 py-2 sm:py-2.5 text-xs font-bold text-slate-200 focus:outline-none focus:border-sky-500/50 cursor-pointer truncate appearance-none"
              >
                <option value="ALL" className="bg-[#181920] text-slate-200">
                  All Statuses
                </option>
                <option value="ON_DUTY" className="bg-[#181920] text-slate-200">
                  On Duty (Active)
                </option>
                <option value="HEATBREAK_REST" className="bg-[#181920] text-slate-200">
                  Heatbreak (Shaded)
                </option>
                <option value="STANDBY" className="bg-[#181920] text-slate-200">
                  Standby (Ready)
                </option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Department Filter Pills (Horizontal Scroll on Mobile) */}
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 px-1 font-mono font-medium gap-1">
          <span>
            Showing {filteredPersonnel.length} of {personnelList.length} Active Personnel in{' '}
            <strong className="text-sky-300 font-bold">
              {isSingleWard ? currentSelectedWard?.name : activeRegion.name}
            </strong>
          </span>
          <span>Shift 1 Active (06:00 - 14:00) • Automated Telemetry</span>
        </div>

        {filteredPersonnel.length === 0 ? (
          <div className="p-8 sm:p-12 text-center rounded-3xl bg-[#181920] border border-white/[0.08] shadow-2xl space-y-3 card-highlight-rim">
            <Users className="w-10 h-10 text-slate-500 mx-auto" />
            <h3 className="text-base font-bold text-white">No personnel found for the current filters</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Try changing the search query, selecting "All Wards in {cityName}", or clearing the department filter.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedDept('ALL');
                setSelectedStatus('ALL');
                setSelectedWardFilter('ALL');
              }}
              className="mt-2 px-4 py-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-xs font-bold transition-all cursor-pointer inline-flex items-center space-x-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-4">
            {filteredPersonnel.map((person) => {
              const isOnDuty = person.status === 'ON_DUTY';
              const isHeatbreak = person.status === 'HEATBREAK_REST';

              return (
                <div
                  key={person.id}
                  className="rounded-3xl bg-[#181920] border border-white/[0.08] p-4 sm:p-5 shadow-2xl space-y-3.5 sm:space-y-4 card-highlight-rim hover:border-white/[0.14] transition-all flex flex-col justify-between"
                >
                  {/* Top Row: Avatar + Name + Status Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start space-x-3 min-w-0 flex-1">
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
                          <span className="text-[10px] font-mono font-bold text-slate-400 bg-white/[0.05] px-2 py-0.5 rounded-md shrink-0">
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
                      className={`px-2.5 py-1 rounded-xl text-[10px] sm:text-xs font-mono font-bold border shrink-0 uppercase tracking-wider ${
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
                  <div className="bg-[#13141a] rounded-2xl p-3 sm:p-3.5 border border-white/[0.05] space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <div className="flex items-center space-x-1.5 min-w-0">
                        <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span className="truncate font-medium">{person.wardName}</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 shrink-0 ml-2">
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
                        <span className={person.currentUtci >= 41 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
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
                      className="px-3 py-2 sm:py-2.5 rounded-xl bg-[#13141a] hover:bg-white/[0.06] text-slate-200 font-bold text-xs transition-all flex items-center justify-center space-x-1.5 border border-white/[0.06] cursor-pointer active:scale-95"
                      title={`Ping Radio ${person.radioFrequency}`}
                    >
                      <Radio className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span className="truncate">Radio Check</span>
                    </button>

                    <button
                      onClick={() => handleToggleHeatbreak(person.id)}
                      className={`px-3 py-2 sm:py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center space-x-1.5 border cursor-pointer active:scale-95 ${
                        isOnDuty
                          ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30'
                          : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      <Coffee className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{isOnDuty ? 'Log Heatbreak' : 'Resume Duty'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
