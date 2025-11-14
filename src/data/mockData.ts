import { Company, GridSection } from "../types";

export const companies: Company[] = [
  {
    id: 1,
    name: "Sunset Beach Hotel & Resort",
    type: "Hotel",
    location: "San Diego, CA",
    industry: "Hospitality",
    borrower: "Pacific Hospitality Group LLC",
    deals: [
      {
        id: "D-2024-001",
        date: "2024-09-15",
        amount: 3500000,
        status: "Approved",
        purpose: "Acquisition & Renovation",
        dscr: 1.45,
        ltv: 75,
        revenue2024: 1250220,
        revenue2023: 1177770,
        noi2024: 446130,
        documents: 12
      },
      {
        id: "D-2023-087",
        date: "2023-03-22",
        amount: 2800000,
        status: "Funded",
        purpose: "Refinance",
        dscr: 1.38,
        ltv: 70,
        revenue2024: 1189020,
        revenue2023: 1123450,
        noi2024: 428000,
        documents: 10
      }
    ]
  },
  {
    id: 2,
    name: "Metro Office Plaza",
    type: "Commercial Real Estate",
    location: "Austin, TX",
    industry: "Commercial Real Estate",
    borrower: "Metro Properties Inc",
    deals: [
      {
        id: "D-2024-045",
        date: "2024-06-10",
        amount: 5200000,
        status: "Under Review",
        purpose: "Acquisition",
        dscr: 1.52,
        ltv: 65,
        revenue2024: 890000,
        revenue2023: 845000,
        noi2024: 556000,
        documents: 8
      },
      {
        id: "D-2023-156",
        date: "2023-11-05",
        amount: 4100000,
        status: "Approved",
        purpose: "Expansion",
        dscr: 1.42,
        ltv: 68,
        revenue2024: 845000,
        revenue2023: 798000,
        noi2024: 498000,
        documents: 15
      }
    ]
  },
  {
    id: 3,
    name: "Riverside Restaurant Group",
    type: "Restaurant Chain",
    location: "Portland, OR",
    industry: "Food & Beverage",
    borrower: "Riverside Dining LLC",
    deals: [
      {
        id: "D-2024-089",
        date: "2024-08-20",
        amount: 1800000,
        status: "Declined",
        purpose: "Equipment & Working Capital",
        dscr: 1.15,
        ltv: 80,
        revenue2024: 2100000,
        revenue2023: 2050000,
        noi2024: 245000,
        documents: 7
      }
    ]
  },
  {
    id: 4,
    name: "Greenfield Manufacturing Co",
    type: "Manufacturing",
    location: "Charlotte, NC",
    industry: "Manufacturing",
    borrower: "Greenfield Industries LLC",
    deals: [
      {
        id: "D-2024-112",
        date: "2024-10-05",
        amount: 6500000,
        status: "Approved",
        purpose: "Equipment Purchase",
        dscr: 1.68,
        ltv: 60,
        revenue2024: 4500000,
        revenue2023: 4100000,
        noi2024: 985000,
        documents: 18
      }
    ]
  }
];

export const mockGridData: GridSection[] = [
  {
    id: "rev",
    category: "Revenue",
    isParent: true,
    children: [
      { id: "rev_rooms", account: "Rooms Revenue", y2023: 1123450, y2024: 1189020, ytd2025: 785430 },
      { id: "rev_food", account: "Food & Beverage", y2023: 234000, y2024: 256000, ytd2025: 168000 },
      { id: "rev_other", account: "Other Income", y2023: 54320, y2024: 61200, ytd2025: 40110 },
    ]
  },
  {
    id: "opex",
    category: "Operating Expenses",
    isParent: true,
    children: [
      { id: "opex_payroll", account: "Payroll", y2023: 356000, y2024: 372900, ytd2025: 245110 },
      { id: "opex_util", account: "Utilities", y2023: 98000, y2024: 100230, ytd2025: 68400 },
      { id: "opex_repair", account: "Repairs & Maintenance", y2023: 62200, y2024: 131000, ytd2025: 22050 },
      { id: "opex_insurance", account: "Insurance", y2023: 45000, y2024: 48000, ytd2025: 32000 },
      { id: "opex_marketing", account: "Marketing", y2023: 34000, y2024: 38000, ytd2025: 25000 },
    ]
  },
  {
    id: "addback",
    category: "Add-backs",
    isParent: true,
    children: [
      { id: "add_salary", account: "Owner Salary", y2023: 96000, y2024: 98000, ytd2025: 65000 },
      { id: "add_deprec", account: "Depreciation", y2023: 120000, y2024: 120000, ytd2025: 80000 },
      { id: "add_interest", account: "Interest Expense", y2023: 45000, y2024: 43000, ytd2025: 28000 },
    ]
  },
];
