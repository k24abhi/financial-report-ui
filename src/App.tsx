import React, { useState, useMemo, useCallback } from "react";
import { 
  Search, 
  Building2, 
  TrendingUp, 
  TrendingDown,
  FileText,
  DollarSign,
  Calendar,
  MapPin,
  User,
  Clock,
  ChevronDown,
  ChevronRight,
  Filter,
  Download,
  Eye,
  AlertCircle,
  CheckCircle2,
  Upload,
  Trash,
  X,
  Calculator,
  Grid3x3,
  FolderOpen,
  Check,
  Plus
} from "lucide-react";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Badge } from "./components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Separator } from "./components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { ScrollArea } from "./components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./components/ui/dialog";
import { Label } from "./components/ui/label";
import { cn } from "./lib/utils";

// Mock company data
const companies = [
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

// Mock data structure with hierarchy for grid
const mockGridData = [
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

function formatUSD(n: number) {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD', 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
  }).format(n);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

type CellKey = string;

export default function App() {
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [companiesList, setCompaniesList] = useState(companies);
  const [addCompanyOpen, setAddCompanyOpen] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: "",
    type: "",
    location: "",
    industry: "",
    borrower: ""
  });
  
  // Grid features
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set(["rev", "opex", "addback"]));
  const [selectedCells, setSelectedCells] = useState<Set<CellKey>>(new Set());
  
  // Upload features
  const [files, setFiles] = useState<any[]>([
    { name: "P&L_2024.pdf", size: 1024*1024*2.1, type:"application/pdf", status: "parsed" },
    { name: "STR_Report_Q3_2025.pdf", size: 1024*640, type:"application/pdf", status: "parsed" },
  ]);
  const [isDragging, setDragging] = useState(false);

  const selectedCompany = useMemo(() => {
    return companiesList.find(c => c.id === selectedCompanyId);
  }, [selectedCompanyId, companiesList]);

  const filteredCompanies = useMemo(() => {
    return companiesList.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.borrower.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.location.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, companiesList]);

  const filteredDeals = useMemo(() => {
    if (!selectedCompany) return [];
    if (statusFilter === "all") return selectedCompany.deals;
    return selectedCompany.deals.filter(d => d.status.toLowerCase() === statusFilter.toLowerCase());
  }, [selectedCompany, statusFilter]);

  const dealStats = useMemo(() => {
    if (!selectedCompany) return null;
    const deals = selectedCompany.deals;
    const totalAmount = deals.reduce((sum, d) => sum + d.amount, 0);
    const avgDSCR = deals.reduce((sum, d) => sum + d.dscr, 0) / deals.length;
    const avgLTV = deals.reduce((sum, d) => sum + d.ltv, 0) / deals.length;
    const approved = deals.filter(d => d.status === "Approved" || d.status === "Funded").length;
    
    return { totalAmount, avgDSCR, avgLTV, approved, total: deals.length };
  }, [selectedCompany]);

  // Grid functions
  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleCell = (cellKey: CellKey) => {
    setSelectedCells(prev => {
      const next = new Set(prev);
      if (next.has(cellKey)) {
        next.delete(cellKey);
      } else {
        next.add(cellKey);
      }
      return next;
    });
  };

  const selectedSum = useMemo(() => {
    let sum = 0;
    selectedCells.forEach(key => {
      const [rowId, period] = key.split(":");
      mockGridData.forEach(section => {
        if (section.children) {
          const row = section.children.find(r => r.id === rowId);
          if (row && period in row) {
            sum += (row as any)[period];
          }
        }
      });
    });
    return sum;
  }, [selectedCells]);

  // Upload functions
  const onDrop = useCallback((evt: React.DragEvent)=>{
    evt.preventDefault();
    setDragging(false);
    const dropped = Array.from(evt.dataTransfer.files).map((f:any)=>({
      name: f.name,
      size: f.size,
      type: f.type,
      status: "parsed",
    }));
    if(!dropped.length) return;
    setFiles(v=>[...dropped, ...v]);
  },[]);

  const onSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>)=>{
    const fl = e.target.files ? Array.from(e.target.files) : [];
    if(!fl.length) return;
    const added = fl.map((f:any)=>({ name:f.name, size:f.size, type:f.type, status:"parsed" }));
    setFiles(v=>[...added, ...v]);
  },[]);

  const removeFile = (idx:number)=> setFiles(v=>v.filter((_,i)=>i!==idx));

  // Add company function
  const handleAddCompany = () => {
    if (!newCompany.name || !newCompany.type || !newCompany.location || !newCompany.industry || !newCompany.borrower) {
      return;
    }

    const newId = Math.max(...companiesList.map(c => c.id)) + 1;
    const companyToAdd = {
      id: newId,
      name: newCompany.name,
      type: newCompany.type,
      location: newCompany.location,
      industry: newCompany.industry,
      borrower: newCompany.borrower,
      deals: []
    };

    setCompaniesList([...companiesList, companyToAdd]);
    setSelectedCompanyId(newId);
    setAddCompanyOpen(false);
    setNewCompany({ name: "", type: "", location: "", industry: "", borrower: "" });
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="sticky top-0 z-30 border-b bg-white">
        <div className="mx-auto max-w-[1600px] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-black">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="font-semibold">Underwriter Dashboard</div>
                <div className="text-xs text-neutral-500">Deal & Company Analysis</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="funded">Funded</SelectItem>
                  <SelectItem value="under review">Under Review</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] px-6 py-6">
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* Left Sidebar - Company List */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Companies</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <Input
                    placeholder="Search companies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {filteredCompanies.map((company) => (
                  <button
                    key={company.id}
                    onClick={() => setSelectedCompanyId(company.id)}
                    className={cn(
                      "w-full rounded-lg border p-3 text-left transition-all",
                      selectedCompanyId === company.id
                        ? "border-black bg-black text-white"
                        : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
                    )}
                  >
                    <div className="mb-1 font-medium text-sm">{company.name}</div>
                    <div className={cn(
                      "text-xs",
                      selectedCompanyId === company.id ? "text-white/70" : "text-neutral-500"
                    )}>
                      {company.location}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge 
                        variant={selectedCompanyId === company.id ? "secondary" : "outline"}
                        className="text-xs"
                      >
                        {company.deals.length} {company.deals.length === 1 ? 'Deal' : 'Deals'}
                      </Badge>
                    </div>
                  </button>
                ))}

                {/* Add Company Button */}
                <Dialog open={addCompanyOpen} onOpenChange={setAddCompanyOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full gap-2 border-dashed">
                      <Plus className="h-4 w-4" />
                      Add New Company
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Add New Company</DialogTitle>
                      <DialogDescription>
                        Enter the company details to add them to your portfolio.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Company Name</Label>
                        <Input
                          id="name"
                          placeholder="e.g. Downtown Office Building"
                          value={newCompany.name}
                          onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="type">Business Type</Label>
                        <Input
                          id="type"
                          placeholder="e.g. Commercial Real Estate"
                          value={newCompany.type}
                          onChange={(e) => setNewCompany({ ...newCompany, type: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          placeholder="e.g. New York, NY"
                          value={newCompany.location}
                          onChange={(e) => setNewCompany({ ...newCompany, location: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="industry">Industry</Label>
                        <Input
                          id="industry"
                          placeholder="e.g. Real Estate"
                          value={newCompany.industry}
                          onChange={(e) => setNewCompany({ ...newCompany, industry: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="borrower">Borrower Name</Label>
                        <Input
                          id="borrower"
                          placeholder="e.g. ABC Properties LLC"
                          value={newCompany.borrower}
                          onChange={(e) => setNewCompany({ ...newCompany, borrower: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAddCompanyOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddCompany} className="bg-black">
                        Add Company
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          {selectedCompany && (
            <div className="space-y-6">
              {/* Company Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl">{selectedCompany.name}</CardTitle>
                      <CardDescription className="mt-2 flex flex-wrap items-center gap-4">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {selectedCompany.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building2 className="h-4 w-4" />
                          {selectedCompany.industry}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {selectedCompany.borrower}
                        </span>
                      </CardDescription>
                    </div>
                    <Badge className="bg-black">{selectedCompany.type}</Badge>
                  </div>
                </CardHeader>
              </Card>

              {/* Key Metrics */}
              {dealStats && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription>Total Loan Volume</CardDescription>
                      <CardTitle className="text-2xl">{formatUSD(dealStats.totalAmount)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xs text-neutral-500">
                        Across {dealStats.total} {dealStats.total === 1 ? 'deal' : 'deals'}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription>Approval Rate</CardDescription>
                      <CardTitle className="text-2xl">
                        {((dealStats.approved / dealStats.total) * 100).toFixed(0)}%
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xs text-neutral-500">
                        {dealStats.approved} of {dealStats.total} approved/funded
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription>Avg DSCR</CardDescription>
                      <CardTitle className="text-2xl">{dealStats.avgDSCR.toFixed(2)}x</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        {dealStats.avgDSCR > 1.25 ? (
                          <>
                            <TrendingUp className="h-3 w-3" />
                            Strong coverage
                          </>
                        ) : (
                          <>
                            <TrendingDown className="h-3 w-3" />
                            Below threshold
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription>Avg LTV</CardDescription>
                      <CardTitle className="text-2xl">{dealStats.avgLTV.toFixed(0)}%</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xs text-neutral-500">
                        Loan-to-value ratio
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Main Tabs */}
              <Tabs defaultValue="deals" className="space-y-4">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="deals" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Deal History
                  </TabsTrigger>
                  <TabsTrigger value="financials" className="gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Financial Trends
                  </TabsTrigger>
                  <TabsTrigger value="grid" className="gap-2">
                    <Grid3x3 className="h-4 w-4" />
                    Data Grid
                  </TabsTrigger>
                  <TabsTrigger value="upload" className="gap-2">
                    <Upload className="h-4 w-4" />
                    Documents
                  </TabsTrigger>
                  <TabsTrigger value="analysis" className="gap-2">
                    <Calculator className="h-4 w-4" />
                    Analysis
                  </TabsTrigger>
                </TabsList>

                {/* Deal History Tab */}
                <TabsContent value="deals" className="space-y-4">
                  {filteredDeals.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <AlertCircle className="mb-4 h-12 w-12 text-neutral-300" />
                        <div className="text-neutral-500">No deals found</div>
                      </CardContent>
                    </Card>
                  ) : (
                    filteredDeals.map((deal) => (
                      <Card key={deal.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-3">
                                <CardTitle className="text-lg">{deal.id}</CardTitle>
                                <StatusBadge status={deal.status} />
                              </div>
                              <CardDescription className="mt-2">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(deal.date)} • {deal.purpose}
                                </div>
                              </CardDescription>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-semibold">{formatUSD(deal.amount)}</div>
                              <div className="text-xs text-neutral-500">Loan Amount</div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid gap-6 md:grid-cols-2">
                            {/* Financial Metrics */}
                            <div>
                              <div className="mb-3 text-sm font-medium">Key Metrics</div>
                              <div className="space-y-3">
                                <div className="flex items-center justify-between rounded-lg border p-3">
                                  <div className="text-sm text-neutral-600">DSCR</div>
                                  <div className="flex items-center gap-2">
                                    <div className="font-semibold">{deal.dscr.toFixed(2)}x</div>
                                    {deal.dscr >= 1.25 ? (
                                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    ) : (
                                      <AlertCircle className="h-4 w-4 text-amber-600" />
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center justify-between rounded-lg border p-3">
                                  <div className="text-sm text-neutral-600">LTV</div>
                                  <div className="font-semibold">{deal.ltv}%</div>
                                </div>
                                <div className="flex items-center justify-between rounded-lg border p-3">
                                  <div className="text-sm text-neutral-600">NOI (2024)</div>
                                  <div className="font-semibold">{formatUSD(deal.noi2024)}</div>
                                </div>
                              </div>
                            </div>

                            {/* Revenue Comparison */}
                            <div>
                              <div className="mb-3 text-sm font-medium">Revenue YoY</div>
                              <div className="space-y-3">
                                <div className="rounded-lg border p-3">
                                  <div className="mb-1 flex items-center justify-between text-sm">
                                    <span className="text-neutral-600">2024</span>
                                    <span className="font-semibold">{formatUSD(deal.revenue2024)}</span>
                                  </div>
                                  <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                                    <div 
                                      className="h-full bg-black"
                                      style={{ width: '100%' }}
                                    />
                                  </div>
                                </div>
                                <div className="rounded-lg border p-3">
                                  <div className="mb-1 flex items-center justify-between text-sm">
                                    <span className="text-neutral-600">2023</span>
                                    <span className="font-semibold">{formatUSD(deal.revenue2023)}</span>
                                  </div>
                                  <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                                    <div 
                                      className="h-full bg-neutral-400"
                                      style={{ width: `${(deal.revenue2023 / deal.revenue2024) * 100}%` }}
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  {deal.revenue2024 > deal.revenue2023 ? (
                                    <>
                                      <TrendingUp className="h-4 w-4 text-green-600" />
                                      <span className="font-medium text-green-600">
                                        +{(((deal.revenue2024 - deal.revenue2023) / deal.revenue2023) * 100).toFixed(1)}%
                                      </span>
                                      <span className="text-neutral-500">growth</span>
                                    </>
                                  ) : (
                                    <>
                                      <TrendingDown className="h-4 w-4 text-red-600" />
                                      <span className="font-medium text-red-600">
                                        {(((deal.revenue2024 - deal.revenue2023) / deal.revenue2023) * 100).toFixed(1)}%
                                      </span>
                                      <span className="text-neutral-500">decline</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          <Separator className="my-4" />

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-neutral-500">
                              <FileText className="h-4 w-4" />
                              {deal.documents} documents uploaded
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" className="gap-2">
                                <Eye className="h-4 w-4" />
                                View Details
                              </Button>
                              <Button variant="outline" size="sm" className="gap-2">
                                <Download className="h-4 w-4" />
                                Export
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>

                {/* Financial Trends Tab */}
                <TabsContent value="financials">
                  <Card>
                    <CardHeader>
                      <CardTitle>Financial Performance Over Time</CardTitle>
                      <CardDescription>Revenue and NOI trends across all deals</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {selectedCompany.deals.map((deal, idx) => (
                          <div key={deal.id} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium">{formatDate(deal.date)}</div>
                              <div className="text-sm text-neutral-500">{deal.id}</div>
                            </div>
                            <div className="grid gap-4 md:grid-cols-3">
                              <div className="rounded-lg border p-4">
                                <div className="text-xs text-neutral-500">Revenue 2024</div>
                                <div className="mt-1 font-semibold">{formatUSD(deal.revenue2024)}</div>
                              </div>
                              <div className="rounded-lg border p-4">
                                <div className="text-xs text-neutral-500">Revenue 2023</div>
                                <div className="mt-1 font-semibold">{formatUSD(deal.revenue2023)}</div>
                              </div>
                              <div className="rounded-lg border p-4">
                                <div className="text-xs text-neutral-500">NOI 2024</div>
                                <div className="mt-1 font-semibold">{formatUSD(deal.noi2024)}</div>
                              </div>
                            </div>
                            {idx < selectedCompany.deals.length - 1 && <Separator className="mt-4" />}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Data Grid Tab */}
                <TabsContent value="grid" className="space-y-4">
                  {/* Selection Summary */}
                  {selectedCells.size > 0 && (
                    <Card className="border-black bg-black text-white">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm opacity-80">{selectedCells.size} cells selected</div>
                            <div className="text-2xl font-semibold">{formatUSD(selectedSum)}</div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/20"
                            onClick={() => setSelectedCells(new Set())}
                          >
                            <X className="h-5 w-5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader>
                      <CardTitle>Financial Data Grid</CardTitle>
                      <CardDescription>
                        Click rows to expand/collapse. Click cells to select multiple for sum calculation.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b bg-neutral-50">
                              <th className="p-4 text-left font-medium">Account</th>
                              <th className="p-4 text-right font-medium">2023</th>
                              <th className="p-4 text-right font-medium">2024</th>
                              <th className="p-4 text-right font-medium">YTD 2025</th>
                            </tr>
                          </thead>
                          <tbody>
                            {mockGridData.map((section) => (
                              <React.Fragment key={section.id}>
                                {/* Parent Row */}
                                <tr
                                  className="cursor-pointer border-b bg-neutral-50 hover:bg-neutral-100"
                                  onClick={() => toggleRow(section.id)}
                                >
                                  <td className="p-4 font-semibold">
                                    <div className="flex items-center gap-2">
                                      {expandedRows.has(section.id) ? (
                                        <ChevronDown className="h-4 w-4" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4" />
                                      )}
                                      {section.category}
                                    </div>
                                  </td>
                                  <td className="p-4 text-right font-semibold">
                                    {formatUSD(section.children.reduce((sum, r) => sum + r.y2023, 0))}
                                  </td>
                                  <td className="p-4 text-right font-semibold">
                                    {formatUSD(section.children.reduce((sum, r) => sum + r.y2024, 0))}
                                  </td>
                                  <td className="p-4 text-right font-semibold">
                                    {formatUSD(section.children.reduce((sum, r) => sum + r.ytd2025, 0))}
                                  </td>
                                </tr>

                                {/* Child Rows */}
                                {expandedRows.has(section.id) &&
                                  section.children.map((row) => (
                                    <tr key={row.id} className="border-b hover:bg-neutral-50">
                                      <td className="p-4 pl-12 text-sm text-neutral-700">{row.account}</td>
                                      <td
                                        className={cn(
                                          "cursor-pointer p-4 text-right text-sm transition-colors",
                                          selectedCells.has(`${row.id}:y2023`)
                                            ? "bg-black text-white"
                                            : "hover:bg-neutral-100"
                                        )}
                                        onClick={() => toggleCell(`${row.id}:y2023`)}
                                      >
                                        {formatUSD(row.y2023)}
                                      </td>
                                      <td
                                        className={cn(
                                          "cursor-pointer p-4 text-right text-sm transition-colors",
                                          selectedCells.has(`${row.id}:y2024`)
                                            ? "bg-black text-white"
                                            : "hover:bg-neutral-100"
                                        )}
                                        onClick={() => toggleCell(`${row.id}:y2024`)}
                                      >
                                        {formatUSD(row.y2024)}
                                      </td>
                                      <td
                                        className={cn(
                                          "cursor-pointer p-4 text-right text-sm transition-colors",
                                          selectedCells.has(`${row.id}:ytd2025`)
                                            ? "bg-black text-white"
                                            : "hover:bg-neutral-100"
                                        )}
                                        onClick={() => toggleCell(`${row.id}:ytd2025`)}
                                      >
                                        {formatUSD(row.ytd2025)}
                                      </td>
                                    </tr>
                                  ))}
                              </React.Fragment>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Upload Tab */}
                <TabsContent value="upload" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Document Upload & Management</CardTitle>
                      <CardDescription>Upload and manage documents for this company</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div
                        onDragOver={(e)=>{ e.preventDefault(); setDragging(true); }}
                        onDragLeave={()=>setDragging(false)}
                        onDrop={onDrop}
                        className={cn(
                          "group relative grid place-items-center rounded-2xl border-2 border-dashed p-10 text-center transition",
                          isDragging ? "border-black bg-neutral-100" : "border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50"
                        )}
                      >
                        <Upload className="mb-3 h-10 w-10 opacity-70"/>
                        <div className="text-lg font-medium">Drop files here</div>
                        <div className="text-sm text-neutral-500">or</div>
                        <div className="mt-3">
                          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm shadow-sm hover:bg-neutral-50">
                            <FolderOpen className="h-4 w-4"/>
                            <span>Browse files</span>
                            <Input onChange={onSelect} type="file" multiple className="hidden"/>
                          </label>
                        </div>
                        <div className="mt-3 text-xs text-neutral-500">Supported: PDF, XLS/XLSX, CSV, PNG, JPG</div>
                      </div>

                      {/* File List */}
                      <div>
                        <div className="mb-3 flex items-center justify-between">
                          <div className="text-sm font-medium">Uploaded Files ({files.length})</div>
                        </div>
                        <ScrollArea className="h-[320px] rounded-xl border">
                          <div className="divide-y">
                            {files.map((f,idx)=> (
                              <div key={idx} className="flex items-center justify-between gap-3 px-4 py-3">
                                <div className="flex min-w-0 items-center gap-3">
                                  <FileText className="h-5 w-5 text-neutral-500"/>
                                  <div className="min-w-0">
                                    <div className="truncate text-sm font-medium">{f.name}</div>
                                    <div className="truncate text-xs text-neutral-500">{(f.size/1024/1024).toFixed(2)} MB</div>
                                  </div>
                                  {f.status === "parsed" && (<Badge variant="secondary" className="ml-2">Parsed</Badge>)}
                                </div>
                                <div className="flex items-center gap-3">
                                  <Button variant="ghost" size="icon"><Eye className="h-4 w-4"/></Button>
                                  <Button variant="ghost" size="icon" onClick={()=>removeFile(idx)}><Trash className="h-4 w-4"/></Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Analysis Tab */}
                <TabsContent value="analysis" className="space-y-4">
                  <div className="grid gap-6 md:grid-cols-3">
                    {mockGridData.map((section) => {
                      const total2024 = section.children.reduce((sum, r) => sum + r.y2024, 0);
                      const total2023 = section.children.reduce((sum, r) => sum + r.y2023, 0);
                      const growth = ((total2024 - total2023) / total2023) * 100;

                      return (
                        <Card key={section.id}>
                          <CardHeader className="pb-3">
                            <CardDescription>{section.category}</CardDescription>
                            <CardTitle className="text-3xl">{formatUSD(total2024)}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Separator className="my-4" />
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-neutral-600">2024</span>
                                <span className="font-medium">{formatUSD(total2024)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-neutral-600">2023</span>
                                <span className="font-medium">{formatUSD(total2023)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-neutral-600">Growth</span>
                                <Badge variant={growth > 0 ? "default" : "secondary"} className="rounded-full">
                                  {growth > 0 ? "+" : ""}{growth.toFixed(1)}%
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  <Card className="bg-black text-white">
                    <CardHeader>
                      <CardTitle>Final Analysis Summary</CardTitle>
                      <CardDescription className="text-white/70">Comprehensive overview of financial metrics</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-4">
                        <div>
                          <div className="text-sm opacity-80">Total Revenue</div>
                          <div className="mt-1 text-xl font-semibold">
                            {formatUSD(mockGridData[0].children.reduce((sum, r) => sum + r.y2024, 0))}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm opacity-80">Total Expenses</div>
                          <div className="mt-1 text-xl font-semibold">
                            {formatUSD(mockGridData[1].children.reduce((sum, r) => sum + r.y2024, 0))}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm opacity-80">Add-backs</div>
                          <div className="mt-1 text-xl font-semibold">
                            {formatUSD(mockGridData[2].children.reduce((sum, r) => sum + r.y2024, 0))}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm opacity-80">Adjusted NOI</div>
                          <div className="mt-1 text-xl font-semibold">
                            {formatUSD(
                              mockGridData[0].children.reduce((sum, r) => sum + r.y2024, 0) -
                              mockGridData[1].children.reduce((sum, r) => sum + r.y2024, 0) +
                              mockGridData[2].children.reduce((sum, r) => sum + r.y2024, 0)
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {!selectedCompany && (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12">
              <Building2 className="mb-4 h-12 w-12 text-neutral-300" />
              <div className="text-neutral-500">Select a company to view details</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { bg: string; text: string }> = {
    "Approved": { bg: "bg-green-100", text: "text-green-700" },
    "Funded": { bg: "bg-blue-100", text: "text-blue-700" },
    "Under Review": { bg: "bg-amber-100", text: "text-amber-700" },
    "Declined": { bg: "bg-red-100", text: "text-red-700" },
  };

  const variant = variants[status] || { bg: "bg-neutral-100", text: "text-neutral-700" };

  return (
    <Badge className={cn("border-0", variant.bg, variant.text)}>
      {status}
    </Badge>
  );
}