import { useState } from "react";
import { Building2, Filter, Download, HelpCircle } from "lucide-react";
import {
  Button, Select, MenuItem, FormControl, InputLabel, AppBar, Toolbar, Box,
  Typography, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Divider, Chip, Tooltip,
} from "@mui/material";
import type { DashboardHeaderProps } from "../../types/interfaces";

export function DashboardHeader({ statusFilter, onStatusFilterChange }: DashboardHeaderProps) {
  const [legendOpen, setLegendOpen] = useState(false);

  const LegendSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <Box sx={{ mb: 2.5 }}>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>{title}</Typography>
      <Divider sx={{ mb: 1 }} />
      {children}
    </Box>
  );

  const LegendItem = ({ label, description }: { label: string; description: string }) => (
    <Box sx={{ mb: 0.75, pl: 1 }}>
      <Typography variant="body2">
        <strong>{label}:</strong> {description}
      </Typography>
    </Box>
  );

  return (
    <>
    <AppBar position="sticky" color="default" elevation={1} sx={{ bgcolor: 'white' }}>
      <Toolbar sx={{ maxWidth: '1600px', width: '100%', mx: 'auto', px: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
          <Box sx={{ 
            width: 40, 
            height: 40, 
            borderRadius: 1, 
            bgcolor: 'black', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <Building2 style={{ color: 'white', width: 20, height: 20 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>Underwriter Dashboard</Typography>
            <Typography variant="caption" color="text.secondary">Deal & Company Analysis</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Filter by status</InputLabel>
            <Select
              value={statusFilter}
              label="Filter by status"
              onChange={(e) => onStatusFilterChange(e.target.value)}
              startAdornment={<Filter style={{ marginRight: 8, width: 16, height: 16 }} />}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="funded">Funded</MenuItem>
              <MenuItem value="under review">Under Review</MenuItem>
              <MenuItem value="declined">Declined</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" startIcon={<Download style={{ width: 16, height: 16 }} />}>
            Export
          </Button>
          <Tooltip title="Application Guide & Legend" arrow>
            <IconButton
              onClick={() => setLegendOpen(true)}
              sx={{
                border: '2px solid',
                borderColor: 'primary.main',
                color: 'primary.main',
                bgcolor: 'primary.50',
                width: 36,
                height: 36,
                '&:hover': { bgcolor: 'primary.100' },
              }}
            >
              <HelpCircle style={{ width: 20, height: 20 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>

    {/* ── Comprehensive Application Legend Dialog ── */}
    <Dialog
      open={legendOpen}
      onClose={() => setLegendOpen(false)}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { maxHeight: '85vh' } }}
    >
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1.25rem', pb: 0 }}>
        Application Guide &amp; Legend
      </DialogTitle>
      <DialogContent dividers sx={{ pt: 2 }}>

        {/* ── Overview ── */}
        <LegendSection title="Overview">
          <Typography variant="body2" sx={{ pl: 1 }}>
            This is the <strong>Underwriter Dashboard</strong> — a commercial loan underwriting platform for managing
            companies/borrowers, uploading &amp; extracting financial documents, analyzing deal metrics, assessing risk,
            verifying applications, checking compliance, and generating portfolio reports. Use the <strong>sidebar</strong> on
            the left to search and select a company, then use the tabs below to perform underwriting tasks.
          </Typography>
        </LegendSection>

        {/* ── Header Controls ── */}
        <LegendSection title="Header Controls">
          <LegendItem label="Filter by Status" description="Use the dropdown to filter the deal list by status: All Statuses, Approved, Funded, Under Review, or Declined. This affects which deals are shown in the Deal History tab." />
          <LegendItem label="Export" description="Click to export data from the dashboard (placeholder for future functionality)." />
          <LegendItem label="? (This Button)" description="Opens this Application Guide & Legend dialog with full documentation of every feature." />
        </LegendSection>

        {/* ── Sidebar ── */}
        <LegendSection title="Sidebar — Company List">
          <LegendItem label="Search" description="Type in the search box to filter companies by name, borrower, or location." />
          <LegendItem label="Select a Company" description="Click any company to load its deals, documents, and financial data in the main area." />
          <LegendItem label="Add New Company" description="Click the '+ Add New Company' button to open a form. Fill in Company Name, Business Type, Location, Industry, and Borrower Name, then submit. The company is saved to the server and appears in your sidebar immediately." />
        </LegendSection>

        {/* ── Company Header & Key Metrics ── */}
        <LegendSection title="Company Header &amp; Key Metrics">
          <Typography variant="body2" sx={{ pl: 1, mb: 0.5 }}>
            Once a company is selected, its <strong>name, location, industry, borrower,</strong> and <strong>type badge</strong> appear
            at the top. Below that, four KPI cards summarize the company's deals:
          </Typography>
          <LegendItem label="Total Loan Volume" description="Sum of all deal amounts for this company, with the number of active deals." />
          <LegendItem label="Approval Rate" description="Percentage of deals with status 'Approved' or 'Funded'." />
          <LegendItem label="Avg DSCR" description="Average Debt Service Coverage Ratio across all deals. Shown in green with 'Strong coverage' if >= 1.25x, or red with 'Below threshold' if lower." />
          <LegendItem label="Avg LTV" description="Average Loan-to-Value ratio across all deals." />
        </LegendSection>

        {/* ── How Deals Are Created ── */}
        <LegendSection title="How Deals Are Created">
          <Typography variant="body2" sx={{ pl: 1, mb: 1 }}>
            Deals represent individual loan transactions associated with a company/borrower. In this application:
          </Typography>
          <LegendItem label="Data Source" description="Deals are loaded automatically from the backend system when you select a company. Each company comes with its pre-existing deal history." />
          <LegendItem label="Deal Lifecycle" description="Deals progress through statuses: 'Under Review' (new/pending evaluation) → 'Approved' (underwriter approves the loan) → 'Funded' (loan is disbursed). A deal can also be 'Declined' if it fails underwriting criteria." />
          <LegendItem label="Deal Properties" description="Each deal includes: a unique Deal ID, date, loan amount, purpose (e.g., Acquisition, Refinance, Cash-Out Refi, Construction, Bridge Loan), DSCR, LTV, Revenue (2024 & 2023), NOI 2024, and attached document count." />
          <LegendItem label="Risk Assessment → Decision" description="To evaluate a deal, go to the Risk Assessment tab to generate a risk score. Then go to App Review to verify documents and record a formal Approve/Suspend/Deny decision." />
          <LegendItem label="Compliance Check" description="Use the Compliance tab to verify the deal meets investor guidelines (Fannie Mae, Freddie Mac, FHA, VA, USDA) and regulatory frameworks before finalizing." />
          <LegendItem label="Monitoring" description="After a deal is funded, use the Reports tab → Monitoring Flags sub-tab to flag deals for issues like past payment due, risk increase, covenant breach, or upcoming renewal." />
        </LegendSection>

        <Divider sx={{ my: 2, borderWidth: 2 }} />
        <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5 }}>Tabs Reference</Typography>

        {/* ── Tab 0 ── */}
        <LegendSection title="1. Deal History">
          <Typography variant="body2" sx={{ pl: 1, mb: 0.5 }}>
            Lists every deal for the selected company as detailed cards.
          </Typography>
          <LegendItem label="Deal Card" description="Shows Deal ID, status badge, date, loan purpose, and loan amount." />
          <LegendItem label="Key Metrics Panel" description="DSCR (green checkmark if >= 1.25x, warning triangle if below), LTV percentage, and NOI 2024." />
          <LegendItem label="Revenue YoY Panel" description="Revenue 2024 vs 2023 with progress bars and calculated growth/decline percentage." />
          <LegendItem label="Document Count" description="Number of uploaded documents attached to this deal." />
          <LegendItem label="Actions" description="'View Details' to inspect the deal, 'Export' to download deal data." />
        </LegendSection>

        {/* ── Tab 1 ── */}
        <LegendSection title="2. Financial Trends">
          <Typography variant="body2" sx={{ pl: 1, mb: 0.5 }}>
            Displays financial performance across all deals. For each deal, three side-by-side cards show:
          </Typography>
          <LegendItem label="Revenue 2024" description="The deal's 2024 revenue figure." />
          <LegendItem label="Revenue 2023" description="The deal's 2023 revenue figure for comparison." />
          <LegendItem label="NOI 2024" description="Net Operating Income for 2024." />
        </LegendSection>

        {/* ── Tab 2 ── */}
        <LegendSection title="3. Hierarchy Grid">
          <Typography variant="body2" sx={{ pl: 1, mb: 0.5 }}>
            Shows a hierarchical tree view of the company's financial data (loaded from the API).
          </Typography>
          <LegendItem label="3-Step Workflow" description="(1) Upload PDFs in the Documents tab → (2) Review extractions in Edit Extraction → (3) View the resulting tree here." />
          <LegendItem label="Tree View" description="Expandable/collapsible row hierarchy. Click rows to expand or collapse children. Click cells to select them for sum calculation." />
          <LegendItem label="Selected Sum" description="When you select cells, their numeric values are summed and displayed." />
          <LegendItem label="Merge Cells" description="Enable 'Merge Cells' mode, then drag one row onto another to combine their values into a single row." />
          <LegendItem label="Create Children" description="Enable 'Create Children' mode, then drag a row onto another to nest it as a child beneath the target row." />
          <LegendItem label="Undo" description="Press Ctrl+Z or click the Undo button (available in Merge/Child mode) to revert the last operation. Supports up to 10 undo levels." />
        </LegendSection>

        {/* ── Tab 3 ── */}
        <LegendSection title="4. Documents">
          <Typography variant="body2" sx={{ pl: 1, mb: 0.5 }}>
            Upload and manage financial documents for AI-powered data extraction.
          </Typography>
          <LegendItem label="Period Configuration" description="Set the Period Date (e.g., 2024-12-31), Period Type (Quarterly / Half Yearly / Yearly / Monthly / YTD), and the specific quarter (Q1–Q4) or half (H1/H2) if applicable." />
          <LegendItem label="Drag &amp; Drop Zone" description="Drag files onto the zone or click 'Browse Files'. Accepts PDF, Excel (XLS/XLSX), CSV, and images (PNG/JPG)." />
          <LegendItem label="Statement Type Selector" description="Before uploading, choose the statement type: Quarterly (Q1–Q4), Half Yearly (H1/H2), or Annual." />
          <LegendItem label="File List" description="Each file shows name, size (in MB), statement type chip, and date." />
          <LegendItem label="File Status" description="'Pending' (not yet uploaded), 'Parsed' (green — extraction complete), spinner (uploading), or error message." />
          <LegendItem label="Upload Button" description="Sends the file to the extraction API with the configured period date and type. A progress bar shows during processing." />
          <LegendItem label="View / Delete" description="Eye icon to preview, trash icon to remove a file." />
        </LegendSection>

        {/* ── Tab 4 ── */}
        <LegendSection title="5. Edit Extraction">
          <Typography variant="body2" sx={{ pl: 1, mb: 0.5 }}>
            Review, search, and manually correct data extracted from uploaded documents.
          </Typography>
          <LegendItem label="Period Selector" description="Choose from available periods loaded from the API or select a parsed file directly, then click 'Load' to fetch extracted tables." />
          <LegendItem label="Table Selector" description="Switch between multiple extracted tables. Each shows its row x column dimensions." />
          <LegendItem label="Search" description="Type a keyword to highlight matching cells in yellow." />
          <LegendItem label="Edit Mode" description="Toggle edit mode to make cells editable via inline text inputs. Edited cells appear highlighted in blue with an 'Edited' chip." />
          <LegendItem label="Save Changes" description="Sends all modified data back to the API. The status footer shows the count of modified cells." />
          <LegendItem label="Export" description="Exports the current table data and switches to the Hierarchy Grid tab to visualize the tree." />
          <LegendItem label="Reset All Changes" description="Reverts all edits back to the original extracted values." />
        </LegendSection>

        {/* ── Tab 5 ── */}
        <LegendSection title="6. Analysis">
          <Typography variant="body2" sx={{ pl: 1, mb: 0.5 }}>
            Computed financial analysis derived from the Hierarchy Grid data sections.
          </Typography>
          <LegendItem label="Category Cards" description="One card per grid section (e.g., Revenue, Operating Expenses, Add-backs). Each shows the 2024 total, 2023 total, and year-over-year growth." />
          <Box sx={{ pl: 1, mb: 0.75, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip label="+X.X%" color="primary" size="small" />
            <Typography variant="body2">= Positive year-over-year growth</Typography>
          </Box>
          <Box sx={{ pl: 1, mb: 0.75, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip label="-X.X%" size="small" />
            <Typography variant="body2">= Negative or zero growth</Typography>
          </Box>
          <LegendItem label="Final Analysis Summary" description="Dark card showing Total Revenue, Total Expenses, Add-backs, and Adjusted NOI. Only appears when at least 3 grid sections are loaded." />
          <LegendItem label="Adjusted NOI Formula" description="Adjusted NOI = Total Revenue - Total Expenses + Add-backs (accounts for depreciation, amortization, interest, and other non-cash expenses)." />
        </LegendSection>

        {/* ── Tab 6 ── */}
        <LegendSection title="7. Risk Assessment">
          <Typography variant="body2" sx={{ pl: 1, mb: 0.5 }}>
            Evaluate borrower creditworthiness and produce an automated risk score with recommendations.
          </Typography>
          <LegendItem label="Input Form (Left Panel)" description="Select a Deal ID, enter Annual Income, Monthly Debt Obligations, Credit Score (300-850), Loan Amount, Appraised Property Value, Employment Status (Employed W-2 / Self-Employed / Retired / Other), Years at Current Employer, and optional Notes." />
          <LegendItem label="Run Risk Assessment" description="Submits the form to the underwriting API for automated scoring." />
          <LegendItem label="Risk Score" description="Score out of 100 with a visual progress bar. Risk levels: Low (safe), Moderate (review needed), High (elevated risk), Unacceptable (likely decline)." />
          <LegendItem label="Key Financial Ratios" description="DTI: <=36% Excellent, <=43% Acceptable, >43% High. LTV: <=75% Conservative, <=80% Standard, >80% Elevated. Credit Score: >=750 Excellent, >=700 Good, >=650 Fair, <650 Poor." />
          <LegendItem label="Risk Flags" description="Red alert list of identified risks (e.g., high DTI, low credit score, insufficient income)." />
          <LegendItem label="Recommendations" description="Green checklist of suggested actions for the underwriter." />
        </LegendSection>

        {/* ── Tab 7 ── */}
        {/* <LegendSection title="8. App Review (Application Review)">
          <Typography variant="body2" sx={{ pl: 1, mb: 0.5 }}>
            Verify document completeness and record formal underwriting decisions.
          </Typography>
          <LegendItem label="Document Verification (Left Panel)" description="Select a deal, enter Applicant Name, Loan Purpose (Purchase / Refinance / Cash-Out Refi / Construction / Bridge Loan), and Loan Amount." />
          <LegendItem label="9-Item Document Checklist" description="Check off: 2-Year Tax Returns, 3-Month Bank Statements, P&L Statement, Balance Sheet, Rent Roll, Property Appraisal, Credit Report Authorization, Identity Verification (Gov ID), Entity/Business Documents." />
          <LegendItem label="Verify Application" description="Submits the checklist to the API. Returns a completeness score (percentage with progress bar) and status (Complete / Returned / Incomplete)." />
          <LegendItem label="Missing Documents" description="Warning chips listing any documents not checked off." />
          <LegendItem label="Underwriting Decision" description="Choose a decision (Approve / Suspend - Awaiting Information / Deny), set Interest Rate, Loan Term (months), add Conditions (one per line), and provide a Rationale (required, minimum 10 characters for audit trail)." />
          <LegendItem label="Record Decision" description="Saves the formal decision with a unique Decision ID and the decider's name for permanent audit records." />
        </LegendSection> */}

        {/* ── Tab 8 ── */}
        {/* <LegendSection title="9. Compliance">
          <Typography variant="body2" sx={{ pl: 1, mb: 0.5 }}>
            Ensure loans comply with investor guidelines and regulatory frameworks. Contains 3 sub-tabs:
          </Typography>
          <Box sx={{ pl: 2, mb: 1 }}>
            <Typography variant="body2" fontWeight={600} sx={{ mt: 1 }}>Sub-tab A: Investor Guidelines Check</Typography>
            <LegendItem label="Inputs" description="Deal, Investor/Agency (Fannie Mae / Freddie Mac / FHA / VA / USDA), Loan Type (Conventional / FHA / VA / USDA / Jumbo), Loan Amount, Credit Score, DTI Ratio, LTV Ratio, Property Type, Occupancy Type, and Regulatory Framework checkboxes (TRID, RESPA, HMDA, ATR/QM Rule)." />
            <LegendItem label="Results" description="Overall pass/fail, list of violations, list of warnings, and expandable regulatory framework findings (one per framework)." />
          </Box>
          <Box sx={{ pl: 2, mb: 1 }}>
            <Typography variant="body2" fontWeight={600} sx={{ mt: 1 }}>Sub-tab B: LOS Underwriting Notes</Typography>
            <LegendItem label="Purpose" description="Add immutable audit-trail notes to the Loan Origination System (LOS)." />
            <LegendItem label="Fields" description="Deal, Note Type (Underwriting Analysis / Condition Clearing / Review QC / General), Referenced Guideline (e.g., 'Fannie Mae B3-3.1-01'), Note Text." />
          </Box>
          <Box sx={{ pl: 2, mb: 1 }}>
            <Typography variant="body2" fontWeight={600} sx={{ mt: 1 }}>Sub-tab C: Compliance Review</Typography>
            <LegendItem label="Purpose" description="Submit formal compliance reviews for audit." />
            <LegendItem label="Fields" description="Deal, Review Type (Pre-Approval / Closing / Post-Closing / Internal Audit), Outcome (Pass / Conditional / Fail), Findings, and Conditions." />
          </Box>
        </LegendSection> */}

        {/* ── Tab 9 ── */}
        {/* <LegendSection title="10. Reports">
          <Typography variant="body2" sx={{ pl: 1, mb: 0.5 }}>
            Portfolio-level monitoring, analytics, and deal-level reporting.
          </Typography>
          <LegendItem label="Top KPI Cards" description="Total Portfolio Value, Avg DSCR (green >= 1.25, yellow below), Avg LTV (green <=75%, yellow <=85%, red >85%), Open Monitoring Flags, and Deals Passing DSCR >= 1.25." />
          <Box sx={{ pl: 2, mb: 1 }}>
            <Typography variant="body2" fontWeight={600} sx={{ mt: 1 }}>Sub-tab A: Monitoring Flags</Typography>
            <LegendItem label="Add Flag" description="Select a Deal, pick Flag Type (Past Due / Risk Increase / Covenant Breach / Renewal Due / Other), set Severity (Low / Medium / High / Critical), add a Description." />
            <LegendItem label="Active Flags List" description="Shows all flags with type, severity, deal ID, description, who flagged it, and the date. Click 'Resolve' to close a flag. Resolved flags appear grayed out." />
          </Box>
          <Box sx={{ pl: 2, mb: 1 }}>
            <Typography variant="body2" fontWeight={600} sx={{ mt: 1 }}>Sub-tab B: Portfolio Risk Report</Typography>
            <LegendItem label="DSCR Distribution" description="Bar chart grouping deals into: Above 1.50x (Strong), 1.25-1.50x (Acceptable), 1.00-1.25x (Borderline), Below 1.00x (Alert)." />
            <LegendItem label="LTV Risk Tiers" description="Bar chart grouping deals into: <=65% (Low Risk), 65-75% (Standard), 75-85% (Elevated), >85% (High Risk)." />
            <LegendItem label="Portfolio Summary" description="Dark card with Total Exposure, Average DSCR, Average LTV, DSCR Passing Rate, Open Watch List Items, Critical Alerts." />
          </Box>
          <Box sx={{ pl: 2, mb: 1 }}>
            <Typography variant="body2" fontWeight={600} sx={{ mt: 1 }}>Sub-tab C: Deal Summary</Typography>
            <LegendItem label="Deals Table" description="Full table of all deals with columns: Deal ID, Status (color-coded chip), Loan Amount, DSCR (color-coded), LTV, NOI 2024, Revenue 2024, and Document Count." />
          </Box>
        </LegendSection> */}

        <Divider sx={{ my: 2, borderWidth: 2 }} />

        {/* ── Key Terminology ── */}
        <LegendSection title="Key Terminology &amp; Metrics">
          <LegendItem label="DSCR (Debt Service Coverage Ratio)" description="Measures a borrower's ability to cover debt payments from net income. A DSCR of 1.25x means income is 25% above debt obligations. Threshold: >= 1.25x is considered strong." />
          <LegendItem label="LTV (Loan-to-Value)" description="The loan amount as a percentage of the property's appraised value. Lower LTV = less risk for the lender. <=75% is conservative, >85% is elevated." />
          <LegendItem label="DTI (Debt-to-Income)" description="Monthly debt payments divided by gross monthly income. <=36% is excellent, <=43% is acceptable, >43% is high risk." />
          <LegendItem label="NOI (Net Operating Income)" description="Total revenue minus operating expenses. A core measure of property or business profitability." />
          <LegendItem label="Adjusted NOI" description="NOI with non-cash expenses added back: Revenue - Expenses + Add-backs (e.g., depreciation, amortization, interest)." />
          <LegendItem label="LOS (Loan Origination System)" description="The official system of record for all underwriting notes, decisions, and audit trails." />
          <LegendItem label="TRID" description="TILA-RESPA Integrated Disclosure rule — requires specific loan estimate and closing disclosure forms." />
          <LegendItem label="RESPA" description="Real Estate Settlement Procedures Act — prohibits kickbacks and requires disclosure of settlement costs." />
          <LegendItem label="HMDA" description="Home Mortgage Disclosure Act — requires lenders to report mortgage data for fair lending analysis." />
          <LegendItem label="ATR/QM Rule" description="Ability-to-Repay / Qualified Mortgage rule — requires lenders to verify a borrower can repay the loan." />
          <LegendItem label="Fannie Mae / Freddie Mac" description="Government-Sponsored Enterprises (GSEs) that buy conforming mortgages from lenders." />
          <LegendItem label="FHA / VA / USDA" description="Federal Housing Administration / Veterans Affairs / US Dept of Agriculture — government-backed loan programs with specific eligibility guidelines." />
        </LegendSection>

        {/* ── Status Badges ── */}
        <LegendSection title="Deal Status Badges">
          <Box sx={{ pl: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Chip label="Approved" color="success" size="small" />
            <Typography variant="body2" sx={{ alignSelf: 'center' }}>— Loan approved by underwriter</Typography>
          </Box>
          <Box sx={{ pl: 1, display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
            <Chip label="Funded" color="primary" size="small" />
            <Typography variant="body2" sx={{ alignSelf: 'center' }}>— Loan disbursed to borrower</Typography>
          </Box>
          <Box sx={{ pl: 1, display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
            <Chip label="Under Review" color="warning" size="small" />
            <Typography variant="body2" sx={{ alignSelf: 'center' }}>— Currently being evaluated by underwriter</Typography>
          </Box>
          <Box sx={{ pl: 1, display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
            <Chip label="Declined" color="error" size="small" />
            <Typography variant="body2" sx={{ alignSelf: 'center' }}>— Loan denied; failed underwriting criteria</Typography>
          </Box>
        </LegendSection>

        {/* ── Typical Workflow ── */}
        <LegendSection title="Typical Underwriting Workflow">
          <Typography variant="body2" sx={{ pl: 1, mb: 1 }}>
            Follow these steps for a complete underwriting cycle:
          </Typography>
          <Box sx={{ pl: 1 }}>
            <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Step 1:</strong> Select or create a company in the sidebar.</Typography>
            <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Step 2:</strong> Review the company's existing deals in <strong>Deal History</strong> and <strong>Financial Trends</strong>.</Typography>
            <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Step 3:</strong> Upload financial documents in the <strong>Documents</strong> tab (PDF, Excel, etc.).</Typography>
            <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Step 4:</strong> Review and correct extracted data in <strong>Edit Extraction</strong>.</Typography>
            <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Step 5:</strong> View the structured financial tree in <strong>Hierarchy Grid</strong>.</Typography>
            <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Step 6:</strong> Check computed metrics in the <strong>Analysis</strong> tab.</Typography>
            <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Step 7:</strong> Run a <strong>Risk Assessment</strong> to score the borrower.</Typography>
            <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Step 8:</strong> Verify documents and record a decision in <strong>App Review</strong>.</Typography>
            <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Step 9:</strong> Validate investor guidelines and regulatory compliance in <strong>Compliance</strong>.</Typography>
            <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Step 10:</strong> Monitor the portfolio and generate reports in <strong>Reports</strong>.</Typography>
          </Box>
        </LegendSection>

      </DialogContent>
      <DialogActions>
        <Button onClick={() => setLegendOpen(false)} variant="contained">Close</Button>
      </DialogActions>
    </Dialog>
    </>
  );
}
