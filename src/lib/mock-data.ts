export const kpis = [
  { label: "Total Customers",    value: "1,284", change: "+12.4%", trend: "up",   hint: "vs last month" },
  { label: "Active Rentals",     value: "342",   change: "+8.1%",  trend: "up",   hint: "currently out" },
  { label: "Returned This Month",value: "94",    change: "+10%",   trend: "up",   hint: "equipments" },
  { label: "Available Equipment",value: "186",   change: "-3.2%",  trend: "down", hint: "in stock" },
  { label: "Rented Equipment",   value: "342",   change: "+6.8%",  trend: "up",   hint: "of 528 total" },
  { label: "Monthly Revenue",    value: "₹8.42L",change: "+22.7%", trend: "up",   hint: "Dec 2024" },
  { label: "Pending Payments",   value: "₹1.18L",change: "-4.5%",  trend: "down", hint: "26 invoices" },
  { label: "Security Deposits",  value: "₹14.6L",change: "+5.0%",  trend: "up",   hint: "held in escrow" },
];

export const revenueData = Array.from({ length: 12 }).map((_, i) => ({
  month: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i],
  current:  320000 + Math.round(Math.sin(i / 2) * 90000) + i * 22000,
  previous: 280000 + Math.round(Math.cos(i / 2) * 60000) + i * 16000,
}));

export const rentalGrowthData = Array.from({ length: 12 }).map((_, i) => ({
  month: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i],
  newRentals: 180 + Math.round(Math.sin(i / 2.5) * 40) + i * 8,
  returns:    140 + Math.round(Math.cos(i / 2.5) * 30) + i * 5,
}));

export const utilizationData = [
  { name: "Oxygen Concentrator 5LP", value: 92 },
  { name: "Oxygen Concentrator 10LPM", value: 85 },
  { name: "Bipap Machine",           value: 78 },
  { name: "Auto CPAP Machine",       value: 64 },
  { name: "Surgical Cot With Mattress", value: 70 },
  { name: "Foldable Wheel Chair",     value: 55 },
  { name: "Patient Monitor",         value: 81 },
  { name: "Syringe Pump",            value: 40 },
  { name: "Infusion Pump",           value: 45 },
  { name: "Nebulizer",               value: 50 },
  { name: "Patient Ventilator",      value: 30 },
];

export const collectionData = Array.from({ length: 7 }).map((_, i) => ({
  day: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i],
  collected: 40000 + (i * 7000) + Math.round(Math.sin(i) * 12000),
  pending:   10000 + (i * 2000) + Math.round(Math.cos(i) * 5000),
}));

export const pendingDuesData = [
  { label: "Due Today",    amount: 24500, count: 8 },
  { label: "Due Tomorrow", amount: 31200, count: 11 },
  { label: "This Week",    amount: 112000, count: 31 },
  { label: "7+ Days",      amount: 68400,  count: 14 },
  { label: "30+ Days",     amount: 42100,  count: 6 },
];

export const customers: any[] = [];
export const equipment: any[] = [];
export const rentals: any[] = [];
export const payments: any[] = [
  {
    id: "PAY-0264",
    agreement: "AGR-2026-0099",
    customer: "Cauvery Heart & Multispeciality Hospital",
    customerId: "CUS-0102",
    date: "15-08-2026",
    type: "Rent",
    amount: 21000,
    discount: 0,
    mode: "Bank",
    bankPaid: 21000,
    cashPaid: 0,
    status: "Paid",
    collectedBy: "Admin",
  },
  {
    id: "PAY-0265",
    agreement: "AGR-2026-0107",
    customer: "Cauvery Heart & Multispeciality Hospital",
    customerId: "CUS-0102",
    date: "15-08-2026",
    type: "Rent",
    amount: 36000,
    discount: 0,
    mode: "Bank",
    bankPaid: 36000,
    cashPaid: 0,
    status: "Paid",
    collectedBy: "Admin",
  },
  {
    id: "PAY-0266",
    agreement: "AGR-2026-0108",
    customer: "Cauvery Heart & Multispeciality Hospital",
    customerId: "CUS-0102",
    date: "15-08-2026",
    type: "Rent",
    amount: 36000,
    discount: 0,
    mode: "Bank",
    bankPaid: 36000,
    cashPaid: 0,
    status: "Paid",
    collectedBy: "Admin",
  },
];
export const returns: any[] = [];
export const activities: any[] = [];
