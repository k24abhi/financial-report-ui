export interface Deal {
  id: string;
  date: string;
  amount: number;
  status: string;
  purpose: string;
  dscr: number;
  ltv: number;
  revenue2024: number;
  revenue2023: number;
  noi2024: number;
  documents: number;
}

export interface Company {
  id: number;
  name: string;
  type: string;
  location: string;
  industry: string;
  borrower: string;
  deals: Deal[];
}

export interface GridRow {
  id: string;
  account: string;
  y2023: number;
  y2024: number;
  ytd2025: number;
}

export interface GridSection {
  id: string;
  category: string;
  isParent: true;
  children: GridRow[];
}

export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  status: string;
  period?: string;
  date?: string;
  period_type?: string;
  file?: File;
  company_id?: string;
  extractedData?: any;
}

export interface NewCompanyForm {
  name: string;
  type: string;
  location: string;
  industry: string;
  borrower: string;
}

export type CellKey = string;
